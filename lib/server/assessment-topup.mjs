import {authenticatedUser, serviceRpc} from './paid-access.mjs';
import {assessmentTerminated, validAttemptId} from './assessment-lock.mjs';
import {paypalConfigured, paypalRequest, verifiedSubscription} from './paypal.mjs';

const price = '0.80';
const site = 'https://mostaedcoach.com';
const page = site + '/paid-practice.html';
const orderIdPattern = /^[A-Z0-9]{10,32}$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if (req.headers.origin && req.headers.origin !== site) return res.status(403).json({error:'Origin not allowed'});
  if (process.env.PAYPAL_MODE !== 'live' || process.env.BILLING_ENABLED !== 'true' || !paypalConfigured()) {
    return res.status(503).json({error:'Extra attempts checkout is unavailable'});
  }
  const {action, reference, orderId} = req.body || {};
  if (!['create','confirm'].includes(action) || !validAttemptId(reference) ||
      (action === 'confirm' && !orderIdPattern.test(orderId || ''))) {
    return res.status(400).json({error:'Invalid checkout request'});
  }

  try {
    const user = await authenticatedUser(req);
    if (!user) return res.status(401).json({error:'Sign in first'});
    const rpc = (operation, order = null, capture = null) => serviceRpc('assessment_topup_order', {
      p_action:operation, p_user:user.id, p_ref:reference, p_order:order, p_capture:capture,
    });

    if (action === 'create') {
      const sub = await serviceRpc('paid_subscription_for_user', {p_user_id:user.id});
      if (await assessmentTerminated(user) || !await verifiedSubscription(sub?.subscription_id, user.id)) {
        return res.status(403).json({error:'An eligible active subscription is required'});
      }
      if (await rpc('reserve') !== true) return res.status(429).json({error:'Please try a new checkout later'});
      const result = await paypalRequest('/v2/checkout/orders', {
        method:'POST', headers:{'PayPal-Request-Id':reference},
        body:JSON.stringify({intent:'CAPTURE',purchase_units:[{custom_id:reference,
          description:'Mostaed: one extra paid test start',amount:{currency_code:'USD',value:price}}],
          payment_source:{paypal:{experience_context:{shipping_preference:'NO_SHIPPING',
            user_action:'PAY_NOW',return_url:page+'?topup='+reference,cancel_url:page+'?topup_cancelled=1'}}}}),
      });
      const url = result.links?.find(link => ['approve','payer-action'].includes(link.rel))?.href;
      if (!orderIdPattern.test(result.id || '') || !/^https:\/\/(www\.)?paypal\.com\//.test(url || '') ||
          await rpc('attach', result.id) !== true) throw Error('Checkout creation failed');
      return res.status(200).json({url,orderId:result.id});
    }

    if (await rpc('owned', orderId) !== true) return res.status(404).json({error:'Checkout not found'});
    const path = '/v2/checkout/orders/' + orderId;
    let order = await paypalRequest(path);
    const unit = order.purchase_units?.[0];
    if (order.id !== orderId || order.purchase_units?.length !== 1 || unit?.custom_id !== reference ||
        unit.amount?.currency_code !== 'USD' || unit.amount.value !== price) {
      return res.status(409).json({error:'Checkout amount or reference could not be verified'});
    }
    if (order.status === 'APPROVED') {
      try {
        await paypalRequest(path+'/capture', {method:'POST',headers:{'PayPal-Request-Id':'cap-'+reference},body:'{}'});
      } catch {
        // A timed-out request may have captured the order. Verify before deciding whether to retry.
      }
      order = await paypalRequest(path);
    }
    const captures = order.purchase_units?.[0]?.payments?.captures;
    const capture = captures?.[0];
    if (order.id !== orderId || order.purchase_units?.length !== 1 ||
        order.purchase_units[0]?.custom_id !== reference || order.status !== 'COMPLETED' || captures?.length !== 1 || capture?.status !== 'COMPLETED' ||
        capture.amount?.currency_code !== 'USD' || capture.amount.value !== price ||
        !orderIdPattern.test(capture.id || '')) {
      return res.status(409).json({error:'Payment has not been verified. You can retry verification here.'});
    }
    if (await rpc('credit', orderId, capture.id) !== true) throw Error('Credit was not recorded');
    return res.status(200).json({credited:true});
  } catch {
    return res.status(503).json({error:'Checkout temporarily unavailable. If you already paid, retry verification here.'});
  }
}

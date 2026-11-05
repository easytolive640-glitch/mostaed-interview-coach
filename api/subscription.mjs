import { authenticatedUser, serviceRpc, temporaryTestAccess, testAiConfigured } from '../lib/server/paid-access.mjs';
import { syncSubscription } from '../lib/server/paypal.mjs';
import {paymentOrigin,verifiedAccess} from '../lib/server/paymob-live.mjs';
import { billingPlans, subscriptionPlan } from '../lib/server/billing-plans.mjs';
import { paymentLog } from '../lib/server/payment-logs.mjs';
import { createHash } from 'node:crypto';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const origin = paymentOrigin();
  if (req.headers.origin && req.headers.origin !== origin) return res.status(403).json({ error: 'Origin not allowed' });
  let user;
  try {
    user = await authenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Sign in first' });
    // The practice page can still use an independently granted trial.
    const testAccess = temporaryTestAccess(user);
    if (!req.body?.checkPayment && testAccess && testAiConfigured()) return res.status(200).json(testAccess);
    // A return URL or a client-supplied ID never grants entitlement by itself.
    const saved = await serviceRpc('paid_subscription_for_user', { p_user_id: user.id });
    const reference = req.body?.reference;
    if (reference != null && (typeof reference !== 'string' || !/^[a-f0-9-]{36}$/i.test(reference))) return res.status(400).json({error:'Invalid payment reference'});
    const id = reference ? 'paymob:'+reference : saved?.subscription_id;
    const verified = await verifiedAccess(id, user.id);
    if (!verified) {
      const reference = paymentLog('verification','error',{userId:user.id,error:{code:'PAYMENT_NOT_VERIFIED'}});
      return res.status(403).json({ error: 'A verified active payment is required', reference });
    }
    if (!id.startsWith('paymob:') && !await syncSubscription(id)) {
      const reference = paymentLog('verification','error',{userId:user.id,error:{code:'ACCOUNT_UPDATE_FAILED'}});
      return res.status(503).json({ error: 'Account update unavailable', reference });
    }
    const plan = verified.plan || subscriptionPlan(verified);
    paymentLog('verification','verified',{userId:user.id,plan});
    const live = id.startsWith('paymob:') || process.env.PAYPAL_MODE === 'live';
    const receipt = verified.verifiedPayment;
    // Never expose the raw PayPal transaction or account identifier to Analytics.
    const purchase = live && typeof receipt?.id === 'string' && receipt.id.length > 0
      ? { transaction_id: createHash('sha256').update('mostaed-purchase:' + receipt.currency+':'+receipt.id).digest('hex'), value: receipt.value, currency: receipt.currency, plan }
      : undefined;
    return res.status(200).json({ plan, questions:billingPlans[plan].questions, limit:billingPlans[plan].limit, active: live, sandbox: !live, ...(purchase ? {purchase} : {}) });
  } catch (error) {
    const reference = paymentLog('verification','error',{userId:user?.id,error});
    return res.status(503).json({ error: 'Verification unavailable', reference });
  }
}

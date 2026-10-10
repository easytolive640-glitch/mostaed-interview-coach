import { paypalConfigured, paypalRequest, syncSubscription } from '../lib/server/paypal.mjs';
import sandboxWebhook from '../lib/server/paypal-sandbox-webhook.mjs';
import { paymentLog } from '../lib/server/payment-logs.mjs';
export default async function handler(req, res) {
  if (req.query?.sandbox === '1') return sandboxWebhook(req,res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (!paypalConfigured()) return res.status(503).end();
  const body = req.body;
  if (!body || JSON.stringify(body).length > 131072) return res.status(400).end();
  const names = ['paypal-auth-algo','paypal-cert-url','paypal-transmission-id','paypal-transmission-sig','paypal-transmission-time'];
  if (names.some(n => typeof req.headers[n] !== 'string')) return res.status(400).end();
  try {
    const check = await paypalRequest('/v1/notifications/verify-webhook-signature', {
      method: 'POST', body: JSON.stringify({ auth_algo: req.headers[names[0]], cert_url: req.headers[names[1]],
        transmission_id: req.headers[names[2]], transmission_sig: req.headers[names[3]],
        transmission_time: req.headers[names[4]], webhook_id: process.env.PAYPAL_WEBHOOK_ID, webhook_event: body }),
    });
    if (check.verification_status !== 'SUCCESS') {
      paymentLog('webhook','error',{error:{code:'INVALID_SIGNATURE'}});
      return res.status(400).end();
    }
    const event = body.event_type || '';
    const block = ['PAYMENT.SALE.REFUNDED','PAYMENT.SALE.REVERSED','BILLING.SUBSCRIPTION.PAYMENT.FAILED'].includes(event);
    const subscriptionEvent = event.startsWith('BILLING.SUBSCRIPTION.');
    if (!subscriptionEvent && event !== 'PAYMENT.SALE.COMPLETED' && !block) return res.status(200).end();
    const id = subscriptionEvent ? body.resource?.id : body.resource?.billing_agreement_id;
    if (!/^I-[A-Z0-9]+$/.test(id || '')) return res.status(400).end();
    await syncSubscription(id, block);
    paymentLog('webhook','processed');
    return res.status(200).end();
  } catch (error) { paymentLog('webhook','error',{error}); return res.status(503).end(); }
}

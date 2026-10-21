import { authenticatedUser, serviceRpc, temporaryTestAccess, testAiConfigured } from '../lib/server/paid-access.mjs';
import { paypalConfigured, verifiedSubscription, syncSubscription } from '../lib/server/paypal.mjs';
import { billingPlans, subscriptionPlan } from '../lib/server/billing-plans.mjs';
import { paymentLog } from '../lib/server/payment-logs.mjs';
import { createHash } from 'node:crypto';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const origin = process.env.ALLOWED_ORIGIN || 'https://mostaed-interview-coach.vercel.app';
  if (req.headers.origin && req.headers.origin !== origin) return res.status(403).json({ error: 'Origin not allowed' });
  let user;
  try {
    user = await authenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Sign in first' });
    // Explicit payment verification still requires PayPal, even for a tester.
    const testAccess = temporaryTestAccess(user);
    if (!req.body?.subscriptionId && testAccess && testAiConfigured()) return res.status(200).json(testAccess);
    if (!paypalConfigured()) {
      const reference = paymentLog('verification','error',{userId:user.id,error:{code:'PAYPAL_NOT_CONFIGURED'}});
      return res.status(503).json({ error: 'Verification unavailable', reference });
    }
    // A return URL or a client-supplied ID never grants entitlement by itself.
    const saved = await serviceRpc('paid_subscription_for_user', { p_user_id: user.id });
    const id = req.body?.subscriptionId || saved?.subscription_id;
    const verified = await verifiedSubscription(id, user.id);
    if (!verified) {
      const reference = paymentLog('verification','error',{userId:user.id,error:{code:'PAYMENT_NOT_VERIFIED'}});
      return res.status(403).json({ error: 'A verified active payment is required', reference });
    }
    if (!await syncSubscription(id)) {
      const reference = paymentLog('verification','error',{userId:user.id,error:{code:'ACCOUNT_UPDATE_FAILED'}});
      return res.status(503).json({ error: 'Account update unavailable', reference });
    }
    const plan = subscriptionPlan(verified);
    paymentLog('verification','verified',{userId:user.id,plan});
    const live = process.env.PAYPAL_MODE === 'live';
    const receipt = verified.verifiedPayment;
    // Never expose the raw PayPal transaction or account identifier to Analytics.
    const purchase = live && typeof receipt?.id === 'string' && receipt.id.length > 0
      ? { transaction_id: createHash('sha256').update('mostaed-purchase:' + receipt.id).digest('hex'), value: receipt.value, currency: receipt.currency, plan }
      : undefined;
    return res.status(200).json({ plan, questions:billingPlans[plan].questions, limit:billingPlans[plan].limit, active: live, sandbox: !live, ...(purchase ? {purchase} : {}) });
  } catch (error) {
    const reference = paymentLog('verification','error',{userId:user?.id,error});
    return res.status(503).json({ error: 'Verification unavailable', reference });
  }
}

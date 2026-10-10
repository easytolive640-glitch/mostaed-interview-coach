import { serviceRpc } from './paid-access.mjs';
import { billingPlans, subscriptionPlan, paypalPlanId } from './billing-plans.mjs';

export const paypalConfigured = () => Boolean(
  ['live', 'sandbox'].includes(process.env.PAYPAL_MODE) &&
  process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET &&
  (paypalPlanId('pro') || paypalPlanId('starter')) && process.env.PAYPAL_WEBHOOK_ID &&
  process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
export async function paypalRequest(path, options = {}) {
  const host = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const tokenResponse = await fetch(`${host}/v1/oauth2/token`, {
    method: 'POST', headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }, body: 'grant_type=client_credentials', signal: AbortSignal.timeout(10000),
  });
  if (!tokenResponse.ok) throw Object.assign(new Error('PayPal authentication unavailable'), {status:tokenResponse.status, code:'PAYPAL_AUTH_FAILED'});
  const token = await tokenResponse.json();
  const response = await fetch(`${host}${path}`, {
    ...options, headers: { Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json', ...options.headers }, signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    throw Object.assign(new Error('PayPal request failed'), {status:response.status, code:failure.details?.[0]?.issue || failure.name, debugId:failure.debug_id});
  }
  return response.status === 204 ? null : response.json();
}
export function validSubscription(s, userId) {
  const plan = subscriptionPlan(s);
  const next = Date.parse(s?.billing_info?.next_billing_time || '');
  const last = s?.billing_info?.last_payment;
  return Boolean(plan && s?.status === 'ACTIVE' &&
    s.custom_id === userId && Number(s.quantity || 1) === 1 &&
    next > Date.now() && Number(s.billing_info.failed_payments_count || 0) === 0 &&
    last?.amount?.currency_code === 'USD' && Number(last.amount.value) === billingPlans[plan].amount &&
    Number.isFinite(Date.parse(last.time)));
}
export async function verifiedSubscription(id, userId) {
  if (!/^I-[A-Z0-9]+$/.test(id || '')) return false;
  const s = await paypalRequest(`/v1/billing/subscriptions/${id}`);
  if (!validSubscription(s, userId)) return false;
  const start = new Date(Date.now() - 35 * 86400000).toISOString();
  const end = new Date().toISOString();
  const transactions = await paypalRequest(`/v1/billing/subscriptions/${id}/transactions?start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}`);
  const paid = transactions.transactions?.some(t => t.status === 'COMPLETED' &&
    t.amount_with_breakdown?.gross_amount?.currency_code === 'USD' &&
    Number(t.amount_with_breakdown.gross_amount.value) === billingPlans[subscriptionPlan(s)].amount &&
    Date.parse(t.time) >= Date.parse(s.billing_info.last_payment.time) - 60000);
  return paid ? s : false;
}
export async function syncSubscription(id, blocked = false) {
  const s = await paypalRequest(`/v1/billing/subscriptions/${id}`);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.custom_id || '') ||
      !subscriptionPlan(s)) return false;
  const verified = !blocked && await verifiedSubscription(id, s.custom_id);
  return serviceRpc('ingest_paid_subscription', {
    p_subscription_id: id, p_user_id: s.custom_id, p_plan: subscriptionPlan(s),
    p_status: blocked ? 'payment_hold' : verified ? 'active' : 'inactive',
    p_test_mode: process.env.PAYPAL_MODE !== 'live', p_updated_at: new Date().toISOString(),
  });
}

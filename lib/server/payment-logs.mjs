import { randomUUID } from 'node:crypto';
// Allowlisted metadata only: never log request bodies, credentials or provider messages.
export function paymentLog(stage, outcome, { userId, plan, error, reference = randomUUID() } = {}) {
  const entry = { event: 'mostaed_payment', stage, outcome, reference,
    environment: process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox' };
  if (/^[0-9a-f-]{36}$/i.test(userId || '')) entry.userId = userId;
  if (['starter', 'pro'].includes(plan)) entry.plan = plan;
  if (Number.isInteger(error?.status)) entry.providerStatus = error.status;
  if (/^[A-Z0-9_]{1,80}$/.test(error?.code || '')) entry.code = error.code;
  if (/^[a-zA-Z0-9-]{1,80}$/.test(error?.debugId || '')) entry.providerDebugId = error.debugId;
  (outcome === 'error' ? console.error : console.info)(JSON.stringify(entry));
  return reference;
}

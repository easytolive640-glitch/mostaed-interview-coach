import { createHash } from 'node:crypto';
import { paypalConfigured } from './paypal.mjs';
// Server-only helpers. Never expose the service-role key or merchant keys to a client.
export const configured = () => Boolean(
  process.env.PAID_AI_ENABLED === 'true' &&
  process.env.PAYPAL_MODE === 'live' && process.env.OPENAI_API_KEY && paypalConfigured()
);

export async function authenticatedUser(req) {
  const authorization = req.headers.authorization || '';
  if (!/^Bearer [A-Za-z0-9._~-]+$/.test(authorization)) return null;
  const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_PUBLISHABLE_KEY,
      Authorization: authorization,
    },
  });
  if (!response.ok) return null;
  const user = await response.json();
  return /^[0-9a-f-]{36}$/i.test(user.id || '') ? user : null;
}

export async function serviceRpc(name, payload) {
  const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Paid-access database error: ${response.status}`);
  return response.json();
}

export function variantPlan(variantId) {
  if (String(variantId) === process.env.LEMON_STARTER_VARIANT_ID) return 'starter';
  if (String(variantId) === process.env.LEMON_PRO_VARIANT_ID) return 'pro';
  return null;
}

export async function lemonRequest(path, options = {}) {
  const response = await fetch(`https://api.lemonsqueezy.com/v1/${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
      ...(options.body ? { 'Content-Type': 'application/vnd.api+json' } : {}),
    },
  });
  if (!response.ok) throw new Error(`Merchant API unavailable: ${response.status}`);
  return response.json();
}


const testGrant = Object.freeze({
  emailHash: '651e92331b2cc3a3eecdcea290295a14ff8a7fa57a8450422e49577c2823331b',
  expiresAt: '2026-10-06T00:00:00.000Z',
  // A separate date keeps test attempts out of the paid monthly quota.
  period: '2026-10-03',
  limit: 5,
});
export function temporaryTestAccess(user, now = Date.now()) {
  if (!user?.email_confirmed_at || typeof user.email !== 'string' ||
      now >= Date.parse(testGrant.expiresAt) ||
      createHash('sha256').update(user.email.trim().toLowerCase()).digest('hex') !== testGrant.emailHash) return null;
  return { plan: 'pro', active: true, testAccess: true,
    expiresAt: testGrant.expiresAt, limit: testGrant.limit };
}
export const testAiConfigured = () => Boolean(process.env.OPENAI_API_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY && Date.now() < Date.parse(testGrant.expiresAt));

// Unique-key insertion and compare-and-set updates make the quota persistent,
// including across deployments and simultaneous requests. Never grant paid status.
export async function reserveTestEvaluation(user) {
  if (!temporaryTestAccess(user) || !testAiConfigured()) return { allowed: false };
  const url = `${process.env.SUPABASE_URL}/rest/v1/ai_monthly_usage`;
  const headers = { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json' };
  const filter = `user_id=eq.${encodeURIComponent(user.id)}&period=eq.${testGrant.period}`;
  const initial = await fetch(url + '?on_conflict=user_id,period', {
    method: 'POST', headers: { ...headers, Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify({ user_id: user.id, period: testGrant.period, attempts: 0 }),
  });
  if (!initial.ok) throw Error('Test quota unavailable');
  for (let retry = 0; retry < 8; retry++) {
    const response = await fetch(url + '?' + filter + '&select=attempts', { headers });
    if (!response.ok) throw Error('Test quota unavailable');
    const rows = await response.json();
    const used = rows?.[0]?.attempts;
    if (!Number.isInteger(used) || used < 0) throw Error('Invalid test quota');
    if (used >= testGrant.limit || !temporaryTestAccess(user)) return { allowed: false };
    const update = await fetch(url + '?' + filter + '&attempts=eq.' + used, {
      method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ attempts: used + 1 }),
    });
    if (!update.ok) throw Error('Test quota unavailable');
    const changed = await update.json();
    if (changed.length === 1) return { allowed: true, used: used + 1, limit: testGrant.limit };
  }
  throw Error('Test quota busy');
}

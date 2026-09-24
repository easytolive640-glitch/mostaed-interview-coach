// Server-only helpers. Never expose the service-role key or merchant keys to a client.
export const configured = () => Boolean(
  process.env.PAID_AI_ENABLED === 'true' &&
  process.env.STORE_LIVE_APPROVED === 'true' &&
  process.env.LEMON_TEST_MODE === 'false' &&
  process.env.OPENAI_API_KEY &&
  process.env.SUPABASE_URL &&
  process.env.SUPABASE_PUBLISHABLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.LEMON_API_KEY &&
  process.env.LEMON_STORE_ID &&
  process.env.LEMON_STARTER_VARIANT_ID &&
  process.env.LEMON_PRO_VARIANT_ID
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

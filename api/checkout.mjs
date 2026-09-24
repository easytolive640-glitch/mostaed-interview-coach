import { authenticatedUser, lemonRequest } from '../lib/server/paid-access.mjs';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const origin = req.headers.origin;
  const allowed = new Set(['https://mostaed-interview-coach.vercel.app', 'https://easytolive640-glitch.github.io']);
  if (allowed.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (origin && !allowed.has(origin)) return res.status(403).json({ error: 'Origin not allowed' });
  if (process.env.BILLING_ENABLED !== 'true' || !process.env.LEMON_API_KEY ||
      !process.env.LEMON_STORE_ID || !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_PUBLISHABLE_KEY ||
      (process.env.LEMON_TEST_MODE !== 'true' && process.env.STORE_LIVE_APPROVED !== 'true')) {
    return res.status(503).json({ error: 'Subscriptions are not open yet' });
  }
  const variantId = req.body?.plan === 'starter'
    ? process.env.LEMON_STARTER_VARIANT_ID
    : req.body?.plan === 'pro' ? process.env.LEMON_PRO_VARIANT_ID : null;
  if (!variantId || !/^\d+$/.test(variantId)) return res.status(400).json({ error: 'Invalid plan' });
  try {
    const user = await authenticatedUser(req);
    if (!user?.email) return res.status(401).json({ error: 'Sign in first' });
    const testMode = process.env.LEMON_TEST_MODE === 'true';
    const checkout = await lemonRequest('checkouts', {
      method: 'POST',
      body: JSON.stringify({ data: {
        type: 'checkouts',
        attributes: {
          test_mode: testMode,
          checkout_data: { email: user.email, custom: { user_id: user.id } },
          product_options: { enabled_variants: [Number(variantId)] },
        },
        relationships: {
          store: { data: { type: 'stores', id: process.env.LEMON_STORE_ID } },
          variant: { data: { type: 'variants', id: variantId } },
        },
      } }),
    });
    const url = checkout.data?.attributes?.url;
    if (typeof url !== 'string' || new URL(url).protocol !== 'https:') {
      throw new Error('Merchant checkout URL missing');
    }
    return res.status(200).json({ url, testMode });
  } catch (error) {
    console.error('Checkout failed', error instanceof Error ? error.message : error);
    return res.status(503).json({ error: 'Checkout unavailable' });
  }
}

import { authenticatedUser } from '../lib/server/paid-access.mjs';
import { paypalConfigured, paypalRequest } from '../lib/server/paypal.mjs';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const origin = process.env.ALLOWED_ORIGIN || 'https://mostaed-interview-coach.vercel.app';
  if (req.headers.origin && req.headers.origin !== origin) return res.status(403).json({ error: 'Origin not allowed' });
  if (process.env.BILLING_ENABLED !== 'true' || !paypalConfigured()) return res.status(503).json({ error: 'Subscriptions are not open yet' });
  if (req.body?.plan !== 'pro') return res.status(400).json({ error: 'Invalid plan' });
  try {
    const user = await authenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Sign in first' });
    const result = await paypalRequest('/v1/billing/subscriptions', {
      method: 'POST', headers: { 'PayPal-Request-Id': `${user.id}-${new Date().toISOString().slice(0,10)}` },
      body: JSON.stringify({ plan_id: process.env.PAYPAL_PRO_PLAN_ID, custom_id: user.id,
        application_context: { brand_name: 'Mostaed', user_action: 'SUBSCRIBE_NOW',
          return_url: `${origin}/account.html?payment=return`, cancel_url: `${origin}/account.html?payment=cancel` } }),
    });
    const url = result.links?.find(l => l.rel === 'approve')?.href;
    if (!url || !['www.paypal.com','www.sandbox.paypal.com'].includes(new URL(url).hostname) || new URL(url).protocol !== 'https:') throw Error('Approval link unavailable');
    return res.status(200).json({ url, subscriptionId: result.id, testMode: process.env.PAYPAL_MODE !== 'live' });
  } catch { return res.status(503).json({ error: 'Checkout unavailable' }); }
}

import { authenticatedUser, serviceRpc } from '../lib/server/paid-access.mjs';
import { paypalConfigured, verifiedSubscription, syncSubscription } from '../lib/server/paypal.mjs';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const origin = process.env.ALLOWED_ORIGIN || 'https://mostaed-interview-coach.vercel.app';
  if (req.headers.origin && req.headers.origin !== origin) return res.status(403).json({ error: 'Origin not allowed' });
  if (!paypalConfigured()) return res.status(503).json({ error: 'Verification unavailable' });
  try {
    const user = await authenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Sign in first' });
    // A return URL or a client-supplied ID never grants entitlement by itself.
    const saved = await serviceRpc('paid_subscription_for_user', { p_user_id: user.id });
    const id = req.body?.subscriptionId || saved?.subscription_id;
    if (!await verifiedSubscription(id, user.id)) return res.status(403).json({ error: 'A verified active payment is required' });
    if (!await syncSubscription(id)) return res.status(503).json({ error: 'Account update unavailable' });
    return res.status(200).json({ plan: 'pro', active: process.env.PAYPAL_MODE === 'live', sandbox: process.env.PAYPAL_MODE !== 'live' });
  } catch { return res.status(503).json({ error: 'Verification unavailable' }); }
}

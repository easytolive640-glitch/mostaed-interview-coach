import { createHmac, timingSafeEqual } from 'node:crypto';
import { serviceRpc, variantPlan } from '../lib/server/paid-access.mjs';

export const config = { api: { bodyParser: false } };

export async function verifiedEvent(req, secret) {
  const parts = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 256 * 1024) throw new Error('Webhook too large');
    parts.push(chunk);
  }
  // The original bytes are required: reconstructing parsed JSON changes the HMAC.
  const body = Buffer.concat(parts);
  const signature = req.headers['x-signature'];
  if (!body.length || typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return null;
  const digest = createHmac('sha256', secret).update(body).digest();
  if (!timingSafeEqual(digest, Buffer.from(signature, 'hex'))) return null;
  return JSON.parse(body.toString('utf8'));
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.LEMON_WEBHOOK_SECRET || !process.env.LEMON_STORE_ID ||
      !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(503).json({ error: 'Webhook not configured' });
  }
  let event;
  try { event = await verifiedEvent(req, process.env.LEMON_WEBHOOK_SECRET); }
  catch { return res.status(400).json({ error: 'Invalid webhook' }); }
  if (!event) return res.status(401).json({ error: 'Invalid signature' });
  const name = event.meta?.event_name;
  if (!['subscription_created', 'subscription_updated', 'subscription_cancelled',
    'subscription_expired', 'subscription_resumed', 'subscription_paused',
    'subscription_unpaused'].includes(name)) return res.status(200).json({ ignored: true });
  const attrs = event.data?.attributes;
  const userId = event.meta?.custom_data?.user_id;
  const plan = variantPlan(attrs?.variant_id);
  if (event.data?.type !== 'subscriptions' || !/^\d+$/.test(String(event.data.id)) ||
      String(attrs?.store_id) !== process.env.LEMON_STORE_ID || !plan ||
      !/^[0-9a-f-]{36}$/i.test(userId || '') ||
      typeof attrs?.status !== 'string' || typeof attrs?.test_mode !== 'boolean' ||
      !Number.isFinite(Date.parse(attrs.updated_at))) {
    return res.status(422).json({ error: 'Unexpected subscription payload' });
  }
  try {
    // Verify the signed user ID belongs to the merchant's customer email.
    const response = await fetch(`${process.env.SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!response.ok) throw new Error('Account lookup failed');
    const user = await response.json();
    if (user.email?.toLowerCase() !== attrs.user_email?.toLowerCase()) {
      return res.status(422).json({ error: 'Checkout email does not match account' });
    }
    await serviceRpc('ingest_paid_subscription', {
      p_subscription_id: String(event.data.id), p_user_id: userId,
      p_plan: plan, p_status: attrs.status, p_test_mode: attrs.test_mode,
      p_updated_at: attrs.updated_at,
    });
    return res.status(200).json({ accepted: true });
  } catch (error) {
    console.error('Webhook processing failed', error instanceof Error ? error.message : error);
    return res.status(503).json({ error: 'Webhook processing unavailable' });
  }
}

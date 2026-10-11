import loginAlertHandler from '../lib/server/new-user-alerts.mjs';
import adminHandler from '../lib/server/admin.mjs';
import coachingHandler from '../lib/server/coaching.mjs';
import { testAiConfigured } from '../lib/server/paid-access.mjs';
import accountAuth from '../lib/server/account-auth.mjs';
import historyHandler from '../lib/server/evaluation-history.mjs';
import { billingPlans, paypalPlanId } from '../lib/server/billing-plans.mjs';
import { paypalConfigured } from '../lib/server/paypal.mjs';
import supportHandler from '../lib/server/support.mjs';
export default async function handler(req, res) {
  if (req.query?.login_alert === '1') return loginAlertHandler(req,res);
  if (req.query?.support === '1') return supportHandler(req,res);
  if (req.query?.admin === '1') return adminHandler(req,res);
  if (req.query?.coaching === '1') return coachingHandler(req,res);
  if (req.method === 'GET' && req.query?.history === '1') return historyHandler(req,res);
  if (req.method === 'POST' || (req.method === 'GET' && req.query?.settings === '1')) return accountAuth(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).end();
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) return res.status(503).json({ error: 'Customer accounts are not available yet' });
  return res.status(200).json({ url: process.env.SUPABASE_URL, key: process.env.SUPABASE_PUBLISHABLE_KEY,
    billingEnabled: process.env.BILLING_ENABLED === 'true' && paypalConfigured(),
    plans:Object.fromEntries(Object.entries(billingPlans).map(([plan,details])=>[plan,{amount:details.amount,questions:details.questions,limit:details.limit,available:process.env.BILLING_ENABLED === 'true' && paypalConfigured() && Boolean(paypalPlanId(plan))}])),
    aiEnabled: process.env.PAID_AI_ENABLED === 'true' || testAiConfigured() });
}


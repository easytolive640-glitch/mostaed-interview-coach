import cvReviewHandler from "../lib/server/cv-review.mjs";
import topUpHandler from '../lib/server/assessment-topup.mjs';
import assessmentHandler from '../lib/server/assessment-lock.mjs';
import careerFeedHandler from '../lib/server/career-feed.mjs';
import loginAlertHandler from '../lib/server/new-user-alerts.mjs';
import adminHandler from '../lib/server/admin.mjs';
import coachingHandler from '../lib/server/coaching.mjs';
import { testAiConfigured } from '../lib/server/paid-access.mjs';
import accountAuth from '../lib/server/account-auth.mjs';
import historyHandler from '../lib/server/evaluation-history.mjs';
import { billingPlans } from '../lib/server/billing-plans.mjs';
import { exchangeQuote, liveReady } from '../lib/server/paymob-live.mjs';
import supportHandler from '../lib/server/support.mjs';
async function exchangeRate(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  res.setHeader('Cache-Control', 'no-store');
  try {
    const quote = await exchangeQuote();
    return res.status(200).json(quote);
  } catch {
    return res.status(503).json({error: 'Exchange rate unavailable'});
  }
}

export default async function handler(req, res) {
  if (req.query?.cvReview === "1") return cvReviewHandler(req, res);
  if (req.query?.exchangeRate === '1') return exchangeRate(req,res);
  if (req.query?.topup === '1') return topUpHandler(req, res);
  if (req.query?.assessment === '1') return assessmentHandler(req,res);
  if (req.query?.careerFeed === '1') return careerFeedHandler(req,res);
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
    billingEnabled: liveReady(),
    plans:Object.fromEntries(Object.entries(billingPlans).map(([plan,details])=>[plan,{questions:details.questions,limit:details.limit,available:liveReady()}])),
    aiEnabled: process.env.PAID_AI_ENABLED === 'true' || testAiConfigured() });
}


import { authenticatedUser, configured, lemonRequest, serviceRpc, variantPlan } from '../lib/server/paid-access.mjs';

const allowedCategories = new Set(['hr', 'customerService', 'itCloud']);
const allowedLanguages = new Set(['arabic', 'english']);

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    score: { type: 'integer', minimum: 0, maximum: 100 },
    strengths: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      items: { type: 'string' },
    },
    improvements: {
      type: 'array',
      minItems: 1,
      maxItems: 3,
      items: { type: 'string' },
    },
  },
  required: ['score', 'strengths', 'improvements'],
};

function setCors(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN ||
    'https://yo1982.github.io';
  const origin = req.headers.origin;
  if (origin === allowedOrigin) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function validate(body) {
  if (!body || !allowedCategories.has(body.category) ||
      !allowedLanguages.has(body.language) || !Array.isArray(body.responses) ||
      ![10, 15].includes(body.responses.length)) return false;
  return body.responses.every((item) =>
    typeof item?.questionId === 'string' && item.questionId.length <= 32 &&
    typeof item?.question === 'string' && item.question.length <= 300 &&
    typeof item?.answer === 'string' && item.answer.trim().length >= 2 &&
    item.answer.length <= 2000);
}

function extractOutput(response) {
  if (typeof response.output_text === 'string') return response.output_text;
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) return content.text;
    }
  }
  throw new Error('The model returned no structured output.');
}

export default async function handler(req, res) {
  setCors(req, res);
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://yo1982.github.io';
  if (req.headers.origin && req.headers.origin !== allowedOrigin) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  // Fail closed before the provider can be billed. CORS and IP limits are not payment checks.
  if (!configured()) return res.status(503).json({ error: 'Paid AI is not available' });
  if (!validate(req.body)) return res.status(400).json({ error: 'Invalid request' });
  let user;
  try {
    user = await authenticatedUser(req);
  } catch {
    return res.status(503).json({ error: 'Account verification unavailable' });
  }
  if (!user) return res.status(401).json({ error: 'Sign in to use paid AI' });
  let access;
  try {
    const subscription = await serviceRpc('paid_subscription_for_user', { p_user_id: user.id });
    if (!subscription?.subscription_id) return res.status(403).json({ error: 'Active subscription required' });
    if (req.body.responses.length !== (subscription.plan === 'pro' ? 15 : 10)) {
      return res.status(400).json({ error: 'Question count does not match subscription plan' });
    }
    const current = (await lemonRequest(`subscriptions/${encodeURIComponent(subscription.subscription_id)}`)).data?.attributes;
    if (!current || current.status !== 'active' || current.test_mode !== false ||
        String(current.store_id) !== process.env.LEMON_STORE_ID ||
        variantPlan(current.variant_id) !== subscription.plan ||
        current.user_email?.toLowerCase() !== user.email?.toLowerCase()) {
      return res.status(403).json({ error: 'Active subscription required' });
    }
    access = await serviceRpc('reserve_ai_evaluation', { p_user_id: user.id });
  } catch {
    return res.status(503).json({ error: 'Subscription verification unavailable' });
  }
  if (!access?.allowed) return res.status(403).json({ error: 'Active subscription or monthly credit required' });

  const languageInstruction = req.body.language === 'arabic'
    ? 'Write all feedback in clear Modern Standard Arabic.'
    : 'Write all feedback in clear English.';

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5-nano',
        instructions: [
          'You are a fair interview coach. Evaluate only the supplied answers.',
          'Do not invent experience, credentials, facts, or missing context.',
          'Score relevance, clarity, specific evidence, and STAR structure.',
          'Keep each feedback item concise and actionable.',
          languageInstruction,
        ].join(' '),
        input: JSON.stringify(req.body),
        max_output_tokens: 500,
        text: {
          format: {
            type: 'json_schema',
            name: 'interview_evaluation',
            strict: true,
            schema,
          },
        },
      }),
    });

    if (!openAiResponse.ok) {
      console.error('OpenAI request failed', openAiResponse.status);
      return res.status(502).json({ error: 'AI evaluation unavailable' });
    }

    const response = await openAiResponse.json();
    const evaluation = JSON.parse(extractOutput(response));
    return res.status(200).json(evaluation);
  } catch (error) {
    console.error('Evaluation failed', error instanceof Error ? error.message : error);
    return res.status(502).json({ error: 'AI evaluation unavailable' });
  }
}

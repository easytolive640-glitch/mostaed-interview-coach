import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createHmac } from 'node:crypto';
import evaluate from '../api/evaluate.mjs';
import checkout from '../api/checkout.mjs';
import { verifiedEvent } from '../api/lemon-webhook.mjs';

function response() {
  return {
    code: 200, headers: {}, body: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

test('paid endpoint fails closed before provider calls without account setup', async () => {
  const before = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('No network calls expected'); };
  try {
    const res = response();
    await evaluate({ method: 'POST', headers: {}, body: { responses: [] } }, res);
    assert.equal(res.code, 503);
    assert.equal(res.body.error, 'Paid AI is not available');
  } finally { globalThis.fetch = before; }
});

test('webhook verifies exact signed bytes and rejects tampering', async () => {
  const body = Buffer.from('{"meta":{"event_name":"subscription_created"}}');
  const secret = 'test-secret';
  const signature = createHmac('sha256', secret).update(body).digest('hex');
  const valid = Readable.from([body]);
  valid.headers = { 'x-signature': signature };
  assert.equal((await verifiedEvent(valid, secret)).meta.event_name, 'subscription_created');
  const invalid = Readable.from([Buffer.from('{}')]);
  invalid.headers = { 'x-signature': signature };
  assert.equal(await verifiedEvent(invalid, secret), null);
});

test('configured paid endpoint requires account before querying merchant or OpenAI', async () => {
  const names = ['PAID_AI_ENABLED', 'OPENAI_API_KEY', 'SUPABASE_URL',
    'SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'LEMON_API_KEY',
    'LEMON_STORE_ID', 'LEMON_STARTER_VARIANT_ID', 'LEMON_PRO_VARIANT_ID',
    'STORE_LIVE_APPROVED', 'LEMON_TEST_MODE'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  for (const name of names) process.env[name] =
    name === 'PAID_AI_ENABLED' || name === 'STORE_LIVE_APPROVED' ? 'true'
      : name === 'LEMON_TEST_MODE' ? 'false' : 'test';
  const before = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('No network calls expected'); };
  try {
    const res = response();
    await evaluate({ method: 'POST', headers: {}, body: {
      category: 'hr', language: 'english', responses: Array.from({ length: 10 }, (_, index) => ({ questionId: `hr_${index + 1}`, question: 'Explain an example', answer: 'I provided an example.' })),
    } }, res);
    assert.equal(res.code, 401);
  } finally {
    globalThis.fetch = before;
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name];
      else process.env[name] = previous[name];
    }
  }
});

test('checkout is closed when billing is disabled', async () => {
  const before = process.env.BILLING_ENABLED;
  delete process.env.BILLING_ENABLED;
  const res = response();
  await checkout({ method: 'POST', headers: {}, body: { plan: 'starter' } }, res);
  assert.equal(res.code, 503);
  if (before !== undefined) process.env.BILLING_ENABLED = before;
});

test('inactive merchant subscription cannot reach OpenAI', async () => {
  const values = {
    PAID_AI_ENABLED: 'true', STORE_LIVE_APPROVED: 'true', LEMON_TEST_MODE: 'false',
    OPENAI_API_KEY: 'server-only', SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'public', SUPABASE_SERVICE_ROLE_KEY: 'service',
    LEMON_API_KEY: 'merchant', LEMON_STORE_ID: '1',
    LEMON_STARTER_VARIANT_ID: '2', LEMON_PRO_VARIANT_ID: '3',
  };
  const previous = Object.fromEntries(Object.keys(values).map(name => [name, process.env[name]]));
  Object.assign(process.env, values);
  const before = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async url => {
    urls.push(String(url));
    if (String(url).endsWith('/auth/v1/user')) return Response.json({ id: 'dcdb9a59-7c3a-4927-9859-c17b222b5998', email: 'buyer@example.com' });
    if (String(url).includes('/rpc/paid_subscription_for_user')) return Response.json({ subscription_id: '42', plan: 'starter' });
    if (String(url).endsWith('/subscriptions/42')) return Response.json({ data: { attributes: {
      status: 'cancelled', test_mode: false, store_id: 1, variant_id: 2, user_email: 'buyer@example.com',
    } } });
    throw new Error('No credit or provider call allowed');
  };
  try {
    const res = response();
    await evaluate({ method: 'POST', headers: { authorization: 'Bearer valid.jwt.token' }, body: {
      category: 'hr', language: 'english', responses: Array.from({ length: 10 }, (_, index) => ({ questionId: `hr_${index + 1}`, question: 'Explain an example', answer: 'I provided an example.' })),
    } }, res);
    assert.equal(res.code, 403);
    assert.equal(urls.length, 3);
    assert.equal(urls.some(url => url.includes('openai.com')), false);
  } finally {
    globalThis.fetch = before;
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});

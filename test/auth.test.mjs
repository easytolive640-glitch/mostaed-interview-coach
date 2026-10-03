import {test, after} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/auth.mjs';
const originalFetch = globalThis.fetch;
const oldUrl = process.env.SUPABASE_URL, oldKey = process.env.SUPABASE_PUBLISHABLE_KEY;
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_PUBLISHABLE_KEY = 'public-test-key';
after(() => { globalThis.fetch = originalFetch;
  for (const [key, value] of [['SUPABASE_URL', oldUrl], ['SUPABASE_PUBLISHABLE_KEY', oldKey]]) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
async function request(overrides = {}) {
  const res = {headers:{}, setHeader(k,v){this.headers[k]=v;}, status(n){this.code=n;return this;},json(v){this.body=v;return this;}};
  await handler({method:'POST', headers:{host:'mostaed.test', origin:'https://mostaed.test','content-type':'application/json'},body:{email:'test@example.com',password:'fictional-test-password'},...overrides},res);
  return res;
}
test('successful sign-in forwards only email/password and returns the required session fields', async () => {
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://example.supabase.co/auth/v1/token?grant_type=password');
    assert.deepEqual(JSON.parse(options.body), {email:'test@example.com',password:'fictional-test-password'});
    assert.equal(options.headers.apikey, 'public-test-key');
    assert.equal(options.redirect, 'error');
    return new Response(JSON.stringify({access_token:'mock-token',refresh_token:'mock-refresh',user:{id:'mock-user',email:'test@example.com',user_metadata:{full_name:'Test',private_field:'excluded'}}}));
  };
  const res = await request();
  assert.equal(res.code,200); assert.equal(res.body.access_token,'mock-token');
  assert.equal(res.body.user.user_metadata.private_field,undefined);
  assert.equal(res.headers['Cache-Control'],'no-store');
});
test('Supabase rejection preserves the error without creating a session',async()=>{
  globalThis.fetch=async()=>new Response(JSON.stringify({error_description:'Invalid login credentials'}),{status:400});
  const res=await request(); assert.equal(res.code,400); assert.deepEqual(res.body,{error:'Invalid login credentials'});
});
test('upstream failures return a safe retry message',async()=>{
  globalThis.fetch=async()=>{throw Error('private upstream details');};
  const res=await request(); assert.equal(res.code,503); assert.ok(!JSON.stringify(res.body).includes('private upstream'));
});
test('cross-origin, malformed credentials, and unsupported methods do not reach Supabase',async()=>{
  globalThis.fetch=async()=>{assert.fail('unexpected upstream request');};
  assert.equal((await request({headers:{host:'mostaed.test',origin:'https://other.test'}})).code,403);
  assert.equal((await request({body:{email:'invalid',password:'test'}})).code,400);
  assert.equal((await request({method:'DELETE'})).code,405);
});
test('settings expose only Google availability',async()=>{
  globalThis.fetch=async()=>new Response(JSON.stringify({external:{google:false},private_setting:'excluded'}));
  const res=await request({method:'GET'}); assert.equal(res.code,200);assert.deepEqual(res.body,{external:{google:false}});
});

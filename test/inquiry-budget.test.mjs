import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/inquiry.mjs';
import {boundedInquiryRequest,inquiryBudget} from '../lib/server/inquiry-budget.mjs';

const originalEnv={...process.env};
test.afterEach(()=>{process.env={...originalEnv};});
test('per-call maximum fits the reservation; 500 reservations fit $5',()=>{
  const maximumMicroUsd=(inquiryBudget.maxPromptBytes+1024)*0.4+
    inquiryBudget.maxOutputTokens*1.6;
  assert.ok(maximumMicroUsd<inquiryBudget.reservationMicroUsd);
  assert.equal(500*inquiryBudget.reservationMicroUsd,5_000_000);
});
test('bounds UTF-8 bytes and refuses an expensive model override',()=>{
  delete process.env.INQUIRY_MODEL;
  assert.ok(boundedInquiryRequest('', 'x'.repeat(12000)));
  assert.equal(boundedInquiryRequest('', 'x'.repeat(12001)),null);
  assert.equal(boundedInquiryRequest('', '😀'.repeat(3001)),null);
  process.env.INQUIRY_MODEL='gpt-4.1';
  assert.equal(boundedInquiryRequest('facts','question'),null);
});
test('monthly quota exhaustion and missing migration cannot reach the provider',async()=>{
  Object.assign(process.env,{INQUIRY_AI_ENABLED:'true',INQUIRY_OPENAI_API_KEY:'test',
    SUPABASE_URL:'https://test.invalid',SUPABASE_SERVICE_ROLE_KEY:'test'});
  const originalFetch=global.fetch;
  try {
    for(const scenario of ['exhausted','missing','malformed']) {
      const calls=[];
      global.fetch=async(url)=>{
        calls.push(url);
        assert.ok(!url.startsWith('https://api.openai.com/'));
        if(calls.length===1)return {ok:true,json:async()=>true};
        assert.match(url,/reserve_inquiry_monthly_budget$/);
        if(scenario==='missing')return {ok:false,status:404};
        return {ok:true,json:async()=>scenario==='exhausted'?false:{allowed:true}};
      };
      const res={setHeader(){},status(code){this.code=code;return this;},json(data){this.data=data;return this;}};
      await handler({method:'POST',headers:{origin:'https://mostaed-interview-coach.vercel.app',
        'x-vercel-forwarded-for':'127.0.0.1'},body:{message:'pricing',language:'en',consent:true}},res);
      assert.equal(res.code,200);
      assert.equal(res.data.mode,'faq');
      assert.equal(calls.length,2);
    }
  } finally {global.fetch=originalFetch;}
});

import test from 'node:test';
import assert from 'node:assert/strict';
import checkout from '../api/checkout.mjs';
import { validSubscription, verifiedSubscription, syncSubscription } from '../lib/server/paypal.mjs';
import { paymentLog } from '../lib/server/payment-logs.mjs';
Object.assign(process.env,{PAYPAL_MODE:'live',BILLING_ENABLED:'true',PAYPAL_CLIENT_ID:'fixture',PAYPAL_CLIENT_SECRET:'fixture',PAYPAL_STARTER_PLAN_ID:'P-STARTER',PAYPAL_PRO_PLAN_ID:'P-PRO',PAYPAL_WEBHOOK_ID:'WH-TEST',SUPABASE_URL:'https://fixture.test',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture'});
const uid='12345678-1234-1234-1234-123456789abc';
const original=global.fetch;
const originalError=console.error;
const json=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
const res=()=>({code:0,body:null,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
const active=(plan,amount)=>({status:'ACTIVE',plan_id:plan,custom_id:uid,quantity:'1',billing_info:{next_billing_time:new Date(Date.now()+86400000).toISOString(),failed_payments_count:0,last_payment:{amount:{currency_code:'USD',value:amount},time:new Date().toISOString()}}});
test('Starter accepts its own price and rejects Pro price or a different user',()=>{
  assert.equal(validSubscription(active('P-STARTER','3.99'),uid),true);
  assert.equal(validSubscription(active('P-STARTER','7.99'),uid),false);
  assert.equal(validSubscription(active('P-STARTER','3.99'),'other'),false);
});
test('both checkout plans use separate provider plans and idempotency keys',async()=>{
  const requests=[];
  global.fetch=async(url,options)=>{
    if(url.endsWith('/auth/v1/user'))return json({id:uid});
    if(url.endsWith('/token'))return json({access_token:'fixture'});
    requests.push({body:JSON.parse(options.body),key:options.headers['PayPal-Request-Id']});
    return json({id:'I-TEST',links:[{rel:'approve',href:'https://www.paypal.com/approve'}]});
  };
  for(const plan of ['starter','pro']){const response=res();await checkout({method:'POST',headers:{authorization:'Bearer fixture'},body:{plan}},response);assert.equal(response.code,200);}
  assert.deepEqual(requests.map(r=>r.body.plan_id),['P-STARTER','P-PRO']);
  assert.notEqual(requests[0].key,requests[1].key);
});
test('missing Starter configuration never creates a subscription',async()=>{
  delete process.env.PAYPAL_STARTER_PLAN_ID;
  global.fetch=async url=>{assert.ok(url.endsWith('/auth/v1/user'));return json({id:uid});};
  const response=res();await checkout({method:'POST',headers:{authorization:'Bearer fixture'},body:{plan:'starter'}},response);
  assert.equal(response.code,503);assert.match(response.body.reference,/^[a-f0-9-]{36}$/);
  process.env.PAYPAL_STARTER_PLAN_ID='P-STARTER';
});
test('Starter requires a completed transaction and stores Starter entitlement',async()=>{
  let saved;
  global.fetch=async(url,options)=>{
    if(url.endsWith('/token'))return json({access_token:'fixture'});
    if(url.includes('/rpc/')){saved=JSON.parse(options.body);return json(true);}
    if(url.includes('/transactions?'))return json({transactions:[{status:'COMPLETED',time:new Date().toISOString(),amount_with_breakdown:{gross_amount:{currency_code:'USD',value:'3.99'}}}]});
    return json(active('P-STARTER','3.99'));
  };
  assert.ok(await verifiedSubscription('I-TEST',uid));assert.equal(await syncSubscription('I-TEST'),true);
  assert.equal(saved.p_plan,'starter');assert.equal(saved.p_test_mode,false);
});
test('logs exclude raw messages, credentials, provider bodies and email',()=>{
  let output;console.error=value=>{output=value;};
  paymentLog('checkout','error',{userId:uid,plan:'starter',email:'private@example.com',error:{status:422,code:'PLAN_NOT_FOUND',debugId:'abc123',message:'secret-password',body:{card:'4111111111111111'}}});
  const entry=JSON.parse(output);assert.equal(entry.providerStatus,422);assert.equal(entry.code,'PLAN_NOT_FOUND');
  for(const secret of ['private@example.com','secret-password','4111111111111111'])assert.ok(!output.includes(secret));
  console.error=originalError;
});
test.after(()=>{global.fetch=original;console.error=originalError;});

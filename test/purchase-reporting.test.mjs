import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/subscription.mjs';
Object.assign(process.env,{PAYPAL_MODE:'live',PAYPAL_CLIENT_ID:'fixture',PAYPAL_CLIENT_SECRET:'fixture',PAYPAL_STARTER_PLAN_ID:'P-STARTER',PAYPAL_WEBHOOK_ID:'WH-TEST',SUPABASE_URL:'https://fixture.test',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture'});
const uid='12345678-1234-1234-1234-123456789abc';
const original=global.fetch;
const json=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
async function verify({mode='live',completed=true}={}){
 process.env.PAYPAL_MODE=mode;
 global.fetch=async url=>{
  if(url.endsWith('/auth/v1/user'))return json({id:uid});
  if(url.includes('/rpc/paid_subscription_for_user'))return json({subscription_id:'I-TEST'});
  if(url.includes('/rpc/ingest_paid_subscription'))return json(true);
  if(url.endsWith('/token'))return json({access_token:'fixture'});
  if(url.includes('/transactions?'))return json({transactions:completed?[{id:'PRIVATE-PAYPAL-ID',status:'COMPLETED',time:new Date().toISOString(),amount_with_breakdown:{gross_amount:{currency_code:'USD',value:'3.99'}}}]:[]});
  return json({status:'ACTIVE',plan_id:'P-STARTER',custom_id:uid,billing_info:{next_billing_time:new Date(Date.now()+86400000).toISOString(),last_payment:{amount:{currency_code:'USD',value:'3.99'},time:new Date().toISOString()}}});
 };
 const res={setHeader(){},status(c){this.code=c;return this;},json(b){this.body=b;return this;}};
 await handler({method:'POST',headers:{authorization:'Bearer fixture'},body:{}},res);return res;
}
test('verified live payment returns stable anonymized purchase receipt',async()=>{
 const a=await verify(),b=await verify();assert.equal(a.code,200);assert.deepEqual(a.body.purchase,b.body.purchase);
 assert.match(a.body.purchase.transaction_id,/^[a-f0-9]{64}$/);assert.equal(a.body.purchase.value,3.99);
 assert.ok(!JSON.stringify(a.body).includes('PRIVATE-PAYPAL-ID'));assert.ok(!JSON.stringify(a.body).includes(uid));
});
test('unpaid verification returns no receipt',async()=>{const r=await verify({completed:false});assert.equal(r.code,403);assert.equal(r.body.purchase,undefined);});
test('sandbox verification never returns revenue receipt',async()=>{const r=await verify({mode:'sandbox'});assert.equal(r.code,200);assert.equal(r.body.purchase,undefined);assert.equal(r.body.active,false);});
test.after(()=>{global.fetch=original;});

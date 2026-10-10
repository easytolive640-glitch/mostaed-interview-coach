import test from 'node:test';
import assert from 'node:assert/strict';
import { validSubscription, verifiedSubscription } from '../lib/server/paypal.mjs';
import evaluate from '../api/evaluate.mjs';
import webhook from '../api/paypal-webhook.mjs';
import { questionBank } from '../practice-questions.mjs';
Object.assign(process.env,{PAYPAL_MODE:'live',PAYPAL_CLIENT_ID:'fixture',PAYPAL_CLIENT_SECRET:'fixture',PAYPAL_PRO_PLAN_ID:'P-EXPECTED',PAYPAL_WEBHOOK_ID:'WH-FIXTURE',SUPABASE_URL:'https://fixture.test',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',OPENAI_API_KEY:'fixture',PAID_AI_ENABLED:'true'});
const uid='12345678-1234-1234-1234-123456789abc';
const active=()=>({id:'I-EXPECTED',status:'ACTIVE',plan_id:'P-EXPECTED',custom_id:uid,quantity:'1',billing_info:{next_billing_time:new Date(Date.now()+86400000).toISOString(),failed_payments_count:0,last_payment:{amount:{currency_code:'USD',value:'7.99'},time:new Date().toISOString()}}});
const response=()=>({code:0,body:null,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;},end(){return this;}});
const body={category:'hr',language:'english',responses:questionBank.hr.slice(0,15).map(q=>({questionId:q.id,question:q.english,answer:'I have relevant experience.'}))};
const original=global.fetch;
function mock(fn){global.fetch=fn;}
const json=data=>new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}});
test('matching active paid subscription passes metadata check',()=>assert.equal(validSubscription(active(),uid),true));
for(const [name,change] of [
 ['wrong account',s=>s.custom_id='another'],['wrong plan',s=>s.plan_id='P-OTHER'],['cancelled',s=>s.status='CANCELLED'],
 ['unpaid',s=>delete s.billing_info.last_payment],['expired billing period',s=>s.billing_info.next_billing_time='2000-01-01'],
 ['wrong amount',s=>s.billing_info.last_payment.amount.value='0'],['wrong currency',s=>s.billing_info.last_payment.amount.currency_code='EGP'],
 ['failed renewal',s=>s.billing_info.failed_payments_count=1]
]) test(name+' is rejected',()=>{const s=active();change(s);assert.equal(validSubscription(s,uid),false);});
test('metadata without completed transaction is rejected',async()=>{mock(async u=>u.endsWith('/token')?json({access_token:'fixture'}):u.includes('/transactions?')?json({transactions:[]}):json(active()));assert.equal(await verifiedSubscription('I-EXPECTED',uid),false);});
test('anonymous direct AI request never calls OpenAI',async()=>{let calls=0;mock(async()=>{calls++;throw Error('Unexpected network');});const res=response();await evaluate({method:'POST',headers:{},body},res);assert.equal(res.code,401);assert.equal(calls,0);});
test('signed-in free account never calls PayPal or OpenAI',async()=>{const calls=[];mock(async u=>{calls.push(u);if(u.endsWith('/auth/v1/user'))return json({id:uid,email:'test@example.com'});if(u.includes('/rpc/paid_subscription_for_user'))return json(null);throw Error('Unexpected provider call');});const res=response();await evaluate({method:'POST',headers:{authorization:'Bearer fixture'},body},res);assert.equal(res.code,403);assert.equal(calls.length,2);});
test('sandbox cannot bill production AI',async()=>{process.env.PAYPAL_MODE='sandbox';let calls=0;mock(async()=>{calls++;throw Error('Unexpected');});const res=response();await evaluate({method:'POST',headers:{},body},res);assert.equal(res.code,503);assert.equal(calls,0);process.env.PAYPAL_MODE='live';});
test('invalid webhook signature cannot write entitlement',async()=>{const calls=[];mock(async u=>{calls.push(u);if(u.endsWith('/token'))return json({access_token:'fixture'});return json({verification_status:'FAILURE'});});const res=response();await webhook({method:'POST',headers:Object.fromEntries(['auth-algo','cert-url','transmission-id','transmission-sig','transmission-time'].map(k=>['paypal-'+k,'fixture'])),body:{event_type:'BILLING.SUBSCRIPTION.ACTIVATED',resource:{id:'I-EXPECTED'}}},res);assert.equal(res.code,400);assert.equal(calls.some(u=>u.includes('/rpc/')),false);});
test.after(()=>{global.fetch=original;});

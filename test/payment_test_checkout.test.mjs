import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { callbackText,verifiedCallback,callbackStatus,paymobTestConfigured } from '../lib/server/paymob-test.mjs';
import checkout from '../api/paymob-checkout.mjs';
import webhook from '../api/paymob-webhook.mjs';
import status from '../api/paymob-test-status.mjs';
import paypal from '../api/paypal-sandbox.mjs';
const uid='12345678-1234-1234-1234-123456789abc';
Object.assign(process.env,{PAYMOB_MODE:'test',PAYMOB_SECRET_KEY:'egy_sk_test_fixture',PAYMOB_PUBLIC_KEY:'egy_pk_test_fixture',PAYMOB_HMAC_SECRET:'test-fixture',PAYMOB_CARD_INTEGRATION_ID:'5957916',SUPABASE_URL:'https://fixture.test',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture',PAYPAL_SANDBOX_CLIENT_ID:'sandbox-fixture',PAYPAL_SANDBOX_CLIENT_SECRET:'sandbox-fixture',PAYPAL_SANDBOX_PRO_PLAN_ID:'P-SANDBOX'});
const original=global.fetch;
const json=(data,code=200)=>new Response(JSON.stringify(data),{status:code});
const res=()=>({code:0,body:null,setHeader(){},status(n){this.code=n;return this;},json(d){this.body=d;return this;}});
const fixture=()=>({amount_cents:41800,created_at:'2026-10-02T20:00:00',currency:'EGP',error_occured:false,has_parent_transaction:false,id:123,integration_id:5957916,is_3d_secure:true,is_auth:false,is_capture:false,is_refunded:false,is_standalone_payment:true,is_voided:false,order:{id:456},owner:789,pending:false,source_data:{pan:'2346',sub_type:'MasterCard',type:'card'},success:true});
const sign=o=>createHmac('sha512','test-fixture').update(callbackText(o)).digest('hex');
const req=(body={})=>({method:'POST',headers:{authorization:'Bearer fixture'},body});
test('Paymob official concatenation order matches independent worked example',()=>{
 const o={...fixture(),amount_cents:100,created_at:'2020-03-25T18:39:44.719228',id:2556706,integration_id:6741,order:{id:4778239},owner:4705};
 assert.equal(callbackText(o),'1002020-03-25T18:39:44.719228EGPfalsefalse25567066741truefalsefalsefalsetruefalse47782394705false2346MasterCardcardtrue');
});
test('tampered amount and missing signed fields fail HMAC verification',()=>{
 const o=fixture(),sig=sign(o);assert.equal(verifiedCallback(o,sig),true);
 o.amount_cents=1;assert.equal(verifiedCallback(o,sig),false);delete o.owner;assert.equal(verifiedCallback(o,sig),false);
 assert.equal(verifiedCallback(fixture(),'bad'),false);
});
test('live Paymob keys or mode cannot enter test checkout',()=>{
 process.env.PAYMOB_SECRET_KEY='egy_sk_live_fixture';assert.equal(paymobTestConfigured(),false);
 process.env.PAYMOB_SECRET_KEY='egy_sk_test_fixture';process.env.PAYMOB_MODE='live';assert.equal(paymobTestConfigured(),false);process.env.PAYMOB_MODE='test';
});
test('pending, failed, refunded, voided and authorization-only payments cannot be paid',()=>{
 assert.equal(callbackStatus({...fixture(),pending:true}),'pending');
 assert.equal(callbackStatus({...fixture(),success:false}),'failed');
 assert.equal(callbackStatus({...fixture(),is_auth:true}),'failed');
 assert.equal(callbackStatus({...fixture(),is_refunded:true}),'held');
 assert.equal(callbackStatus({...fixture(),is_voided:true}),'held');
});
test('forged callback never contacts database',async()=>{
 let calls=0;global.fetch=async()=>{calls++;throw Error('Unexpected');};
 const r=res();await webhook({...req({type:'TRANSACTION',obj:fixture()}),query:{hmac:'bad'}},r);
 assert.equal(r.code,400);assert.equal(calls,0);
});
test('valid test payment updates only test ledger, not entitlements',async()=>{
 const calls=[];global.fetch=async(u,o)=>{calls.push({url:u,body:JSON.parse(o.body)});return json(true);};
 const r=res(),obj=fixture();await webhook({...req({type:'TRANSACTION',obj}),query:{hmac:sign(obj)}},r);
 assert.equal(r.code,200);assert.equal(calls.length,1);assert.match(calls[0].url,/record_paymob_test_payment$/);
 assert.deepEqual(calls[0].body,{p_order_id:'456',p_transaction_id:'123',p_status:'paid'});
});
test('signed callback from wrong amount, currency or integration is rejected without writes',async()=>{
 let calls=0;global.fetch=async()=>{calls++;throw Error('Unexpected');};
 for(const change of [{amount_cents:1},{currency:'USD'},{integration_id:999}]){
 const obj={...fixture(),...change},r=res();await webhook({...req({type:'TRANSACTION',obj}),query:{hmac:sign(obj)}},r);assert.equal(r.code,400);
 }assert.equal(calls,0);
});
test('test order reservation and storage precede exposing checkout token; price fixed server-side',async()=>{
 const calls=[];global.fetch=async(u,o)=>{
 calls.push(u);
 if(u.endsWith('/auth/v1/user'))return json({id:uid,email:'test@example.com'});
 if(u.includes('/rpc/')) return json(true);
 const b=JSON.parse(o.body);assert.equal(b.amount,41800);assert.equal(b.currency,'EGP');assert.equal(b.billing_data.email,'test@example.com');
 return json({intention_order_id:456,client_secret:'egy_csk_test_fixture',payment_methods:[{integration_id:5957916,live:false,currency:'EGP'}]});
 };
 const r=res();await checkout(req({amount:1,billing:{first_name:'Test',last_name:'Buyer',phone_number:'+201010101010',street:'Test street',building:'1',city:'Cairo',state:'Cairo',country:'EG',email:'attacker@example.com'}}),r);
 assert.equal(r.code,200);assert.equal(r.body.amount,418);assert.equal(r.body.testMode,true);assert.equal(calls.length,4);
 assert.match(calls[1],/reserve_paymob_test_checkout$/);assert.match(calls[3],/attach_paymob_test_order$/);
 assert.equal(JSON.stringify(r.body).includes('egy_sk_'),false);
});
test('anonymous checkout cannot contact Paymob or database',async()=>{
 let calls=0;global.fetch=async()=>{calls++;throw Error('Unexpected');};
 const r=res();await checkout({method:'POST',headers:{},body:{}},r);assert.equal(r.code,401);assert.equal(calls,0);
});
test('payment status is requested for authenticated user, never client-supplied account',async()=>{
 global.fetch=async(u,o)=>u.endsWith('/auth/v1/user')?json({id:uid}):(assert.equal(JSON.parse(o.body).p_user_id,uid),json(null));
 const r=res();await status(req({reference:'mostaed-test-'+uid,userId:'other'}),r);assert.equal(r.code,404);
});
test('PayPal sandbox create calls only sandbox host, returns sandbox URL, never writes entitlements',async()=>{
 const calls=[];global.fetch=async(u,o)=>{
 calls.push(u);
 if(u.endsWith('/auth/v1/user'))return json({id:uid});
 if(u.endsWith('/token'))return json({access_token:'fixture'});
 if(u.includes('/plans/'))return json({status:'ACTIVE',billing_cycles:[{tenure_type:'REGULAR',frequency:{interval_unit:'MONTH',interval_count:1},pricing_scheme:{fixed_price:{currency_code:'USD',value:'7.99'}}}]});
 assert.equal(JSON.parse(o.body).custom_id,uid);
 return json({id:'I-SANDBOX',links:[{rel:'approve',href:'https://www.sandbox.paypal.com/approval'}]});
 };
 const r=res();await paypal(req({action:'create'}),r);assert.equal(r.code,200);assert.equal(r.body.testMode,true);
 assert.equal(calls.some(u=>u.includes('api-m.paypal.com') || u.includes('/rpc/')),false);
});
test('PayPal subscription for another customer cannot verify',async()=>{
 global.fetch=async u=>u.endsWith('/auth/v1/user')?json({id:uid}):u.endsWith('/token')?json({access_token:'fixture'}):json({custom_id:'other',status:'ACTIVE'});
 const r=res();await paypal(req({action:'verify',subscriptionId:'I-SANDBOX'}),r);assert.equal(r.body.verified,false);assert.equal(r.body.liveAiUnlocked,false);
});
test('sandbox ACTIVE metadata without completed payment is rejected',async()=>{
 global.fetch=async u=>u.endsWith('/auth/v1/user')?json({id:uid}):u.endsWith('/token')?json({access_token:'fixture'}):u.includes('/transactions?')?json({transactions:[]}):json({custom_id:uid,plan_id:'P-SANDBOX',status:'ACTIVE',billing_info:{next_billing_time:new Date(Date.now()+86400000).toISOString(),last_payment:{time:new Date().toISOString(),amount:{currency_code:'USD',value:'7.99'}}}});
 const r=res();await paypal(req({action:'verify',subscriptionId:'I-SANDBOX'}),r);assert.equal(r.body.verified,false);assert.equal(r.body.liveAiUnlocked,false);
});
test.after(()=>{global.fetch=original;});

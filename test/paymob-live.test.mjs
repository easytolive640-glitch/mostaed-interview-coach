import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import checkout from '../api/checkout.mjs';
import webhook from '../api/paymob-webhook.mjs';
import {callbackText} from '../lib/server/paymob-test.mjs';
Object.assign(process.env,{BILLING_ENABLED:'true',PAYMOB_LIVE_ENABLED:'true',PAYMOB_SECRET_KEY:'egy_sk_live_fixture',PAYMOB_PUBLIC_KEY:'egy_pk_live_fixture',PAYMOB_HMAC_SECRET:'fixture',PAYMOB_CARD_INTEGRATION_ID:'7',SUPABASE_URL:'https://fixture.test'});
const res=()=>({setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
const uid='12345678-1234-1234-1234-123456789abc';
const billing={first_name:'First',last_name:'Last',phone_number:'+201000000000',street:'Street',building:'1',city:'City',state:'State',country:'EG'};
test('checkout uses quoted EGP and does not send the customer to Paymob until the order is stored',async()=>{
 const orig=global.fetch;
 const calls=[];
 try{
  global.fetch=async(url,options)=>{
   calls.push(url);
   if(url.endsWith('/auth/v1/user'))return Response.json({id:uid,email:'test@example.com'});
   if(url.includes('frankfurter'))return Response.json({base:'USD',quote:'EGP',rate:50,date:new Date().toISOString().slice(0,10)});
   if(url.endsWith('/reserve_paymob_order')){
    const body=JSON.parse(options.body);assert.equal(body.p_amount,19950);assert.equal(body.p_user,uid);assert.equal(body.p_kind,'starter');return Response.json(true);
   }
   if(url.endsWith('/attach_paymob_order'))return Response.json(true);
   const body=JSON.parse(options.body);
   assert.equal(body.amount,19950);assert.equal(body.currency,'EGP');
   assert.equal(body.notification_url,'https://mostaedcoach.com/api/paymob-webhook');
   return Response.json({payment_methods:[{integration_id:7,live:true,currency:'EGP'}],intention_order_id:123,client_secret:'egy_csk_live_fixture'});
  };
  const response=res(),req={method:'POST',headers:{authorization:'Bearer fixture'},body:{plan:'starter',billing,quotedAmount:1}};
  await checkout(req,response);assert.equal(response.code,409);assert.equal(calls.length,2);
  req.body.quotedAmount=19950;
  await checkout(req,response);assert.equal(response.code,200);
  assert.equal(new URL(response.body.url).origin,'https://eg.checkout.paymob.com');
  assert.match(calls.at(-1),/attach_paymob_order$/);
 }finally{global.fetch=orig;}
});
test('webhook rejects forged and mismatched callbacks and forwards only signed payment data',async()=>{
 const orig=global.fetch;
 let writes=0;
 try{
  global.fetch=async(url,options)=>{
   writes++;assert.match(url,/\/apply_paymob_payment$/);
   assert.deepEqual(JSON.parse(options.body),{p_order:'123',p_tx:'456',p_amount:19950,p_reversed:false});
   return Response.json(true);
  };
  const obj={amount_cents:19950,created_at:'2026-11-05',currency:'EGP',error_occured:false,has_parent_transaction:false,
   id:456,integration_id:7,is_3d_secure:true,is_auth:false,is_capture:true,is_refunded:false,is_standalone_payment:true,
   is_voided:false,order:{id:123},owner:1,pending:false,source_data:{pan:'1234',sub_type:'MasterCard',type:'card'},success:true};
  const signature=()=>createHmac('sha512','fixture').update(callbackText(obj)).digest('hex');
  const req={method:'POST',query:{hmac:'bad'},body:{type:'TRANSACTION',obj}};
  const response=res();
  await webhook(req,response);assert.equal(response.code,400);
  obj.currency='USD';req.query.hmac=signature();await webhook(req,response);assert.equal(response.code,400);
  assert.equal(writes,0);
  obj.currency='EGP';req.query.hmac=signature();await webhook(req,response);assert.equal(response.code,200);assert.equal(writes,1);
 }finally{global.fetch=orig;}
});

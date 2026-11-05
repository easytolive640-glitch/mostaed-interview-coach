import test from 'node:test';
import assert from 'node:assert/strict';
import topup from '../lib/server/assessment-topup.mjs';
const user='12345678-1234-1234-1234-123456789abc',reference='12345678-1234-4234-8234-123456789abc';
Object.assign(process.env,{BILLING_ENABLED:'true',PAYMOB_LIVE_ENABLED:'true',PAYMOB_SECRET_KEY:'egy_sk_live_fixture',PAYMOB_PUBLIC_KEY:'egy_pk_live_fixture',PAYMOB_HMAC_SECRET:'fixture',PAYMOB_CARD_INTEGRATION_ID:'7',SUPABASE_URL:'https://fixture.test'});
test('top-up confirmation reads the authenticated owner’s verified payment, without creating credit',async()=>{
 const saved=global.fetch;
 try{
  let paid=false;
  global.fetch=async(url,options)=>{
   if(url.endsWith('/auth/v1/user'))return Response.json({id:user});
   assert.match(url,/\/rpc\/paymob_topup_paid$/);
   assert.deepEqual(JSON.parse(options.body),{p_user:user,p_ref:reference,p_order:'123'});
   return Response.json(paid);
  };
  const req={method:'POST',headers:{authorization:'Bearer fixture'},body:{action:'confirm',reference,orderId:'123',user:'someone-else'}};
  const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
  await topup(req,res);assert.equal(res.code,409);
  paid=true;await topup(req,res);assert.equal(res.code,200);assert.equal(res.body.credited,true);
 }finally{global.fetch=saved;}
});

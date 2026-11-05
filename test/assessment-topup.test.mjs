import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../lib/server/assessment-topup.mjs';

const reference = '12345678-1234-4234-8234-123456789abc';
const orderId = 'PAYPALORDER0001';
const captureId = 'PAYPALCAPTURE01';
const originalFetch = global.fetch;
Object.assign(process.env,{BILLING_ENABLED:'true',PAYPAL_MODE:'live',PAYPAL_CLIENT_ID:'fixture',
  PAYPAL_CLIENT_SECRET:'fixture',PAYPAL_PRO_PLAN_ID:'fixture',PAYPAL_WEBHOOK_ID:'fixture',
  SUPABASE_URL:'https://db.example',SUPABASE_PUBLISHABLE_KEY:'fixture',SUPABASE_SERVICE_ROLE_KEY:'fixture'});
const json = value => Response.json(value);
async function confirm({owns = true, value = '0.80'} = {}) {
  const operations = [];
  global.fetch = async (url, options) => {
    if (url.endsWith('/auth/v1/user')) return json({id:'12345678-1234-1234-1234-123456789abc'});
    if (url.endsWith('/rpc/assessment_topup_order')) {
      const body = JSON.parse(options.body);
      assert.equal(body.p_user,'12345678-1234-1234-1234-123456789abc');
      assert.equal(body.p_ref,reference);
      assert.equal(body.p_order,orderId);
      operations.push(body.p_action);
      if (body.p_action === 'credit') assert.equal(body.p_capture,captureId);
      return json(owns);
    }
    if (url.endsWith('/token')) return json({access_token:'fixture'});
    if (url.endsWith('/orders/'+orderId)) return json({id:orderId,status:'COMPLETED',purchase_units:[{
      custom_id:reference,amount:{currency_code:'USD',value},
      payments:{captures:[{id:captureId,status:'COMPLETED',amount:{currency_code:'USD',value}}]},
    }]});
    throw Error('Unexpected request');
  };
  const res = {code:0,setHeader(){},status(code){this.code=code;return this;},json(){return this;}};
  await handler({method:'POST',headers:{authorization:'Bearer fixture'},
    body:{action:'confirm',reference,orderId}},res);
  return {code:res.code,operations};
}
test('only an owned completed $0.80 order can grant a credit',async () => {
  try {
    assert.deepEqual(await confirm(),{code:200,operations:['owned','credit']});
    assert.deepEqual(await confirm({value:'0.01'}),{code:409,operations:['owned']});
    assert.deepEqual(await confirm({owns:false}),{code:404,operations:['owned']});
  } finally { global.fetch = originalFetch; }
});

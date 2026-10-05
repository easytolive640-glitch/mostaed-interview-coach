import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{validateProfile,validPayment,bookingReady,zoomMeeting,coachingMode,coachingPaymentRequest} from '../lib/server/coaching.mjs';
const profile={name:'Sample coach',bio:'Fictional career coaching background',specialty:'Interviews',languages:'English',price:'12.50'};
test('profile validates and converts server-side price',()=>{assert.equal(validateProfile(profile).price_cents,1250);for(const price of ['-1','NaN','1001',''])assert.throws(()=>validateProfile({...profile,price}));assert.throws(()=>validateProfile({...profile,bio:'x'.repeat(1501)}));});
const booking={id:'booking-1',order_id:'order-1',price_cents:799};
const order=()=>({id:'order-1',status:'COMPLETED',purchase_units:[{custom_id:'booking-1',amount:{currency_code:'USD',value:'7.99'},payments:{captures:[{id:'capture-1',status:'COMPLETED',amount:{currency_code:'USD',value:'7.99'}}]}}]});
test('payment requires exact booking, order, currency, amount and completed capture',()=>{assert.equal(validPayment(order(),booking),true);const changes=[o=>o.id='wrong',o=>o.status='APPROVED',o=>o.purchase_units[0].custom_id='other',o=>o.purchase_units[0].amount.value='1.00',o=>o.purchase_units[0].payments.captures[0].status='PENDING',o=>o.purchase_units[0].payments.captures[0].amount.currency_code='EGP',o=>o.purchase_units.push(o.purchase_units[0])];for(const change of changes){const o=order();change(o);assert.equal(validPayment(o,booking),false);}});
test('booking disabled by default',()=>{delete process.env.COACHING_BOOKINGS_ENABLED;assert.equal(bookingReady(),false);});
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(d){this.data=d;return this;}});
test('unauthenticated private bookings are rejected',async()=>{const res=response();await handler({method:'GET',headers:{},query:{mine:'1'}},res);assert.equal(res.code,401);assert.equal(res.headers['Cache-Control'],'no-store');});
test('unsupported method rejected without modifying records',async()=>{const res=response();await handler({method:'DELETE',headers:{},query:{}},res);assert.equal(res.code,405);});
test('Zoom sends scheduled meeting with privacy settings and returns only participant URL',async()=>{const old=global.fetch;const requests=[];process.env.ZOOM_ACCOUNT_ID='test';global.fetch=async(url,opt)=>{requests.push({url,opt});return {ok:true,json:async()=>requests.length===1?{access_token:'dummy'}:{id:123,join_url:'https://zoom.us/j/123?pwd=test',start_url:'secret-host-url'}};};try{const meeting=await zoomMeeting({zoom_host_id:'host@example.com'},{starts_at:'2026-11-01T10:00:00Z',duration_minutes:30});assert.equal(meeting.start_url,undefined);const body=JSON.parse(requests[1].opt.body);assert.equal(body.settings.waiting_room,true);assert.equal(body.settings.auto_recording,'none');assert.equal(body.timezone,'UTC');}finally{global.fetch=old;}});

test('coaching sandbox routes Orders independently of live subscription settings',async()=>{
 const saved={...process.env};const old=global.fetch;const urls=[];
 Object.assign(process.env,{PAYPAL_MODE:'live',COACHING_PAYPAL_MODE:'sandbox',PAYPAL_CLIENT_ID:'live-id',PAYPAL_CLIENT_SECRET:'live-secret',PAYPAL_SANDBOX_CLIENT_ID:'sandbox-id',PAYPAL_SANDBOX_CLIENT_SECRET:'sandbox-secret'});
 global.fetch=async(url,opt)=>{urls.push({url,opt});return {ok:true,status:200,json:async()=>urls.length===1?{access_token:'dummy'}:{id:'order-test'}};};
 try{
  assert.equal(coachingMode(),'sandbox');await coachingPaymentRequest('/v2/checkout/orders',{method:'POST',body:'{}'});
  assert.ok(urls.every(r=>r.url.startsWith('https://api-m.sandbox.paypal.com/')));
  assert.equal(urls[0].opt.headers.Authorization,'Basic '+Buffer.from('sandbox-id:sandbox-secret').toString('base64'));
  assert.equal(process.env.PAYPAL_MODE,'live');
  process.env.COACHING_PAYPAL_MODE='invalid';assert.equal(bookingReady(),false);await assert.rejects(()=>coachingPaymentRequest('/v2/checkout/orders'));
 }finally{global.fetch=old;for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);}
});

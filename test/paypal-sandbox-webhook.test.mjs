import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
let source=await readFile(new URL('../lib/server/paypal-sandbox-webhook.mjs',import.meta.url),'utf8');
source=source.replace("import {sandboxConfigured,sandboxRequest,verifySandboxSubscription} from './paypal-sandbox.mjs';","const sandboxConfigured=()=>true;const sandboxRequest=(...args)=>globalThis.webhookRequest(...args);const verifySandboxSubscription=async()=>true;").replace("import {serviceRpc} from './paid-access.mjs';","const serviceRpc=(...args)=>globalThis.webhookRpc(...args);");
const {default:handler}=await import('data:text/javascript,'+encodeURIComponent(source));
process.env.PAYPAL_SANDBOX_WEBHOOK_ID='sandbox-hook';process.env.PAYPAL_SANDBOX_PRO_PLAN_ID='sandbox-plan';
const req=()=>({method:'POST',query:{},headers:Object.fromEntries(['paypal-auth-algo','paypal-cert-url','paypal-transmission-id','paypal-transmission-sig','paypal-transmission-time'].map(k=>[k,'mock'])),body:{event_type:'BILLING.SUBSCRIPTION.ACTIVATED',resource:{id:'I-TEST'}}});
const res=()=>({setHeader(){},status(code){this.code=code;return this;},end(){}});
test('reject invalid signatures before storing anything',async()=>{
 globalThis.webhookRequest=async()=>({verification_status:'FAILURE'});globalThis.webhookRpc=()=>assert.fail('No database write allowed');
 const r=res();await handler(req(),r);assert.equal(r.code,400);
});
test('valid sandbox subscriptions always remain marked as test mode',async()=>{
 globalThis.webhookRequest=async(path,options)=>{
  if(path.includes('verify-webhook')){assert.equal(JSON.parse(options.body).webhook_id,'sandbox-hook');return {verification_status:'SUCCESS'};}
  return {plan_id:'sandbox-plan',custom_id:'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'};
 };
 globalThis.webhookRpc=async(name,payload)=>{assert.equal(name,'ingest_paid_subscription');assert.equal(payload.p_test_mode,true);assert.equal(payload.p_status,'active');};
 const r=res();await handler(req(),r);assert.equal(r.code,200);
});
test('refund events store a payment hold',async()=>{
 globalThis.webhookRpc=async(name,payload)=>assert.equal(payload.p_status,'payment_hold');
 const q=req();q.body={event_type:'PAYMENT.SALE.REFUNDED',resource:{billing_agreement_id:'I-TEST'}};
 const r=res();await handler(q,r);assert.equal(r.code,200);
});

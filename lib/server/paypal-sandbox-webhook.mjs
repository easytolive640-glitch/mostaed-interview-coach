import {sandboxConfigured,sandboxRequest,verifySandboxSubscription} from './paypal-sandbox.mjs';
import {serviceRpc} from './paid-access.mjs';
export default async function sandboxWebhook(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).end();
 if(!sandboxConfigured() || !process.env.PAYPAL_SANDBOX_WEBHOOK_ID)return res.status(503).end();
 const body=req.body;
 const names=['paypal-auth-algo','paypal-cert-url','paypal-transmission-id','paypal-transmission-sig','paypal-transmission-time'];
 if(!body || JSON.stringify(body).length>131072 || names.some(n=>typeof req.headers[n]!=='string'))return res.status(400).end();
 try{
  const check=await sandboxRequest('/v1/notifications/verify-webhook-signature',{method:'POST',body:JSON.stringify({
   auth_algo:req.headers[names[0]],cert_url:req.headers[names[1]],transmission_id:req.headers[names[2]],
   transmission_sig:req.headers[names[3]],transmission_time:req.headers[names[4]],
   webhook_id:process.env.PAYPAL_SANDBOX_WEBHOOK_ID,webhook_event:body
  })});
  if(check.verification_status!=='SUCCESS')return res.status(400).end();
  const event=body.event_type||'';
  const blocked=['PAYMENT.SALE.REFUNDED','PAYMENT.SALE.REVERSED','BILLING.SUBSCRIPTION.PAYMENT.FAILED'].includes(event);
  const subscriptionEvent=event.startsWith('BILLING.SUBSCRIPTION.');
  if(!subscriptionEvent && event!=='PAYMENT.SALE.COMPLETED' && !blocked)return res.status(200).end();
  const id=subscriptionEvent?body.resource?.id:body.resource?.billing_agreement_id;
  if(!/^I-[A-Z0-9]+$/.test(id||''))return res.status(400).end();
  const subscription=await sandboxRequest('/v1/billing/subscriptions/'+id);
  if(subscription.plan_id!==process.env.PAYPAL_SANDBOX_PRO_PLAN_ID ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subscription.custom_id||''))return res.status(400).end();
  const paid=!blocked && await verifySandboxSubscription(id,subscription.custom_id);
  await serviceRpc('ingest_paid_subscription',{
   p_subscription_id:id,p_user_id:subscription.custom_id,p_plan:'pro',
   p_status:blocked?'payment_hold':paid?'active':'inactive',
   p_test_mode:true,p_updated_at:new Date().toISOString()
  });
  return res.status(200).end();
 }catch{return res.status(503).end();}
}

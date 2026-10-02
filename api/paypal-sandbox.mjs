import { randomUUID } from 'node:crypto';
import { authenticatedUser } from '../lib/server/paid-access.mjs';
import { sandboxConfigured,sandboxRequest,verifySandboxSubscription } from '../lib/server/paypal-sandbox.mjs';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const origin=process.env.ALLOWED_ORIGIN || 'https://mostaed-interview-coach.vercel.app';
  if(req.headers.origin && req.headers.origin!==origin) return res.status(403).json({error:'Origin not allowed'});
  if(!sandboxConfigured()) return res.status(503).json({error:'PayPal sandbox needs separate sandbox client ID, secret and plan ID. Live credentials cannot be used.'});
  try {
    const user=await authenticatedUser(req); if(!user) return res.status(401).json({error:'Sign in first'});
    if(req.body?.action==='verify') {
      const paid=await verifySandboxSubscription(req.body.subscriptionId,user.id);
      return res.status(200).json({verified:paid,testMode:true,liveAiUnlocked:false});
    }
    if(req.body?.action!=='create') return res.status(400).json({error:'Invalid action'});
    const plan=await sandboxRequest('/v1/billing/plans/'+process.env.PAYPAL_SANDBOX_PRO_PLAN_ID);
    const cycle=plan.billing_cycles?.find(c=>c.tenure_type==='REGULAR');
    if(plan.status!=='ACTIVE' || plan.billing_cycles.length!==1 || cycle?.frequency?.interval_unit!=='MONTH' || Number(cycle.frequency.interval_count)!==1 || cycle?.pricing_scheme?.fixed_price?.currency_code!=='USD' || Number(cycle.pricing_scheme.fixed_price.value)!==7.99 || Number(plan.payment_preferences?.setup_fee?.value || 0)!==0) throw Error('Sandbox plan must be USD 7.99 monthly with no trial or setup fee');
    const d=await sandboxRequest('/v1/billing/subscriptions',{method:'POST',headers:{'PayPal-Request-Id':randomUUID()},body:JSON.stringify({plan_id:process.env.PAYPAL_SANDBOX_PRO_PLAN_ID,custom_id:user.id,application_context:{brand_name:'Mostaed TEST',user_action:'SUBSCRIBE_NOW',return_url:origin+'/checkout-test.html?provider=paypal',cancel_url:origin+'/checkout-test.html?provider=paypal&cancelled=true'}})});
    const url=d.links?.find(l=>l.rel==='approve')?.href;
    if(!url || new URL(url).hostname!=='www.sandbox.paypal.com' || new URL(url).protocol!=='https:') throw Error('Invalid sandbox URL');
    return res.status(200).json({url,subscriptionId:d.id,testMode:true});
  } catch {return res.status(503).json({error:'PayPal sandbox unavailable. Check sandbox credentials and the USD 7.99 monthly sandbox plan.'});}
}

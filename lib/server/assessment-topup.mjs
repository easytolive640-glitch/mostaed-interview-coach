import {authenticatedUser,serviceRpc} from './paid-access.mjs';
import {assessmentTerminated} from './assessment-lock.mjs';
import {billingDetails,createPayment,exchangeQuote,liveReady,paymentOrigin,verifiedAccess} from './paymob-live.mjs';
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).end();
  if(req.headers.origin&&req.headers.origin!==paymentOrigin())return res.status(403).end();
  if(!liveReady())return res.status(503).json({error:'Extra attempts checkout is unavailable'});
  try{
    const user=await authenticatedUser(req);
    if(!user)return res.status(401).json({error:'Sign in first'});
    const {action,reference,orderId,quotedAmount,billing}=req.body||{};
    if(action==='confirm'){
      if(!/^[a-f0-9-]{36}$/i.test(reference||'')||!/^\d+$/.test(orderId||''))return res.status(400).json({error:'Invalid payment reference'});
      const paid=await serviceRpc('paymob_topup_paid',{p_user:user.id,p_ref:reference,p_order:orderId});
      return paid?res.status(200).json({credited:true}):res.status(409).json({error:'Payment is awaiting verification. Try again shortly.'});
    }
    const details=billingDetails(billing);
    if(action!=='create'||!details)return res.status(400).json({error:'Enter valid billing details'});
    const saved=await serviceRpc('paid_subscription_for_user',{p_user_id:user.id});
    if(await assessmentTerminated(user)||!await verifiedAccess(saved?.subscription_id,user.id))return res.status(403).json({error:'An eligible active plan is required'});
    const {topup}=await exchangeQuote();
    if(quotedAmount!==topup)return res.status(409).json({error:'The EGP price changed. Try again to review the current price.'});
    return res.status(200).json(await createPayment({user,billing:details,kind:'topup',amount:topup,returnPath:'/paid-practice.html?topup=return'}));
  }catch{return res.status(503).json({error:'Checkout unavailable. Please try again later.'});}
}

import {authenticatedUser} from '../lib/server/paid-access.mjs';
import {billingDetails,createPayment,exchangeQuote,liveReady,paymentOrigin} from '../lib/server/paymob-live.mjs';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method==='GET'){
    const path=req.query?.returnTo;
    const safe=typeof path==='string' && (['/account.html?payment=return','/paid-practice.html?topup=return'].includes(path) ||
      /^\/coaching\.html\?booking=[a-f0-9-]{36}$/i.test(path));
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('Location',safe?path:'/checkout.html');
    return res.status(303).end();
  }
  if(req.method!=='POST')return res.status(405).end();
  if(req.headers.origin && req.headers.origin!==paymentOrigin())return res.status(403).end();
  if(!liveReady())return res.status(503).json({error:'Paymob checkout is not open yet.'});
  const {plan,billing,quotedAmount}=req.body||{};
  const details=billingDetails(billing);
  if(!['starter','pro'].includes(plan)||!details)return res.status(400).json({error:'Select a plan and enter valid billing details.'});
  try{
    const user=await authenticatedUser(req);
    if(!user)return res.status(401).json({error:'Sign in first'});
    const {plans}=await exchangeQuote();
    if(plans[plan]!==quotedAmount)return res.status(409).json({error:'The EGP price changed. Refresh to review the current price.'});
    return res.status(200).json(await createPayment({user,billing:details,kind:plan,amount:plans[plan],returnPath:'/account.html?payment=return'}));
  }catch{return res.status(503).json({error:'Checkout unavailable. Please try again later.'});}
}

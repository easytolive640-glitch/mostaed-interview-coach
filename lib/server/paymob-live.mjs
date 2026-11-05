import {randomUUID} from 'node:crypto';
import {unifiedCheckoutUrl} from './paymob-test.mjs';
import {billingPlans} from './billing-plans.mjs';
import {serviceRpc} from './paid-access.mjs';
import {verifiedSubscription as legacySubscription} from './paypal.mjs';

export const liveReady = () => process.env.BILLING_ENABLED === 'true' &&
  process.env.PAYMOB_LIVE_ENABLED === 'true' &&
  /^(egy_)?sk_live_/.test(process.env.PAYMOB_SECRET_KEY || '') &&
  /^(egy_)?pk_live_/.test(process.env.PAYMOB_PUBLIC_KEY || '') &&
  Boolean(process.env.PAYMOB_HMAC_SECRET) && /^[1-9][0-9]*$/.test(process.env.PAYMOB_CARD_INTEGRATION_ID || '');

export async function exchangeQuote() {
  const response = await fetch('https://api.frankfurter.dev/v2/rate/USD/EGP',{signal:AbortSignal.timeout(4000)});
  if (!response.ok) throw Error('Exchange rate unavailable');
  const {base,quote,rate,date} = await response.json();
  const age = Date.now()-Date.parse(date);
  if (base!=='USD'||quote!=='EGP'||!Number.isFinite(rate)||rate<=0||!Number.isFinite(age)||age<0||age>7*86400000) throw Error('Exchange rate unavailable');
  return {rate,date,plans:Object.fromEntries(Object.entries(billingPlans).map(([plan,d])=>[plan,Math.round(Math.round(d.amount*100)*rate)])),topup:Math.round(80*rate)};
}
export const paymentOrigin = () => new URL(process.env.ALLOWED_ORIGIN || 'https://mostaedcoach.com').origin;
export function billingDetails(input) {
  const out = {};
  for (const key of ['first_name','last_name','phone_number','street','building','city','state','country']) {
    const value = input?.[key];
    if (typeof value !== 'string' || !value.trim() || value.length > 120) return null;
    out[key]=value.trim();
  }
  return /^\+?[0-9 ()-]{7,25}$/.test(out.phone_number) && out.country==='EG' ? out : null;
}
export async function createPayment({user,billing,kind,amount,returnPath,booking=null}) {
  if (!liveReady() || !Number.isSafeInteger(amount) || amount<100) throw Error('Checkout unavailable');
  const origin=paymentOrigin();
  const reference=randomUUID();
  const reserved=await serviceRpc('reserve_paymob_order',{p_id:reference,p_user:user.id,p_kind:kind,p_amount:amount,p_booking:booking});
  if (!reserved) throw Error('Checkout unavailable');
  const response=await fetch('https://accept.paymob.com/v1/intention/',{
    method:'POST',headers:{Authorization:'Token '+process.env.PAYMOB_SECRET_KEY,'Content-Type':'application/json'},
    signal:AbortSignal.timeout(12000),
    body:JSON.stringify({amount,currency:'EGP',payment_methods:[Number(process.env.PAYMOB_CARD_INTEGRATION_ID)],
      items:[{name:{starter:'Mostaed AI Starter — 30 days',pro:'Mostaed AI Pro — 30 days',topup:'Mostaed — one extra assessment',coaching:'Mostaed — career coaching'}[kind],amount,quantity:1}],
      billing_data:{apartment:'NA',floor:'NA',...billing,email:user.email},special_reference:reference,expiration:900,
      notification_url:origin+'/api/paymob-webhook',redirection_url:origin+'/api/checkout?returnTo='+encodeURIComponent(returnPath)})
  });
  if (!response.ok) throw Error('Checkout unavailable');
  const data=await response.json();
  const method=data.payment_methods?.find(x=>Number(x.integration_id)===Number(process.env.PAYMOB_CARD_INTEGRATION_ID));
  if (method?.live!==true||method.currency!=='EGP'||!/^(egy_)?csk_live_/.test(data.client_secret||'')||!Number.isSafeInteger(data.intention_order_id)) throw Error('Unexpected payment environment');
  const orderId=String(data.intention_order_id);
  if (await serviceRpc('attach_paymob_order',{p_id:reference,p_order:orderId})!==true) throw Error('Order could not be saved');
  const url=unifiedCheckoutUrl(process.env.PAYMOB_PUBLIC_KEY,data.client_secret);
  return {url,orderId,reference,amount,currency:'EGP'};
}

export async function verifiedAccess(id,userId) {
  if (typeof id!=='string') return null;
  if (!id.startsWith('paymob:')) return legacySubscription(id,userId);
  const access=await serviceRpc('paymob_paid_access',{p_id:id,p_user:userId});
  return access ? {...access,verifiedPayment:{id:access.transaction_id,value:access.amount/100,currency:'EGP'}} : null;
}

export const sandboxConfigured=()=>Boolean(process.env.PAYPAL_SANDBOX_CLIENT_ID && process.env.PAYPAL_SANDBOX_CLIENT_SECRET && process.env.PAYPAL_SANDBOX_PRO_PLAN_ID);
export async function sandboxRequest(path,options={}) {
  const host='https://api-m.sandbox.paypal.com';
  const r=await fetch(host+'/v1/oauth2/token',{method:'POST',headers:{Authorization:'Basic '+Buffer.from(process.env.PAYPAL_SANDBOX_CLIENT_ID+':'+process.env.PAYPAL_SANDBOX_CLIENT_SECRET).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(10000)});
  if (!r.ok) throw Error('Sandbox authentication unavailable');
  const token=await r.json();
  const response=await fetch(host+path,{...options,headers:{Authorization:'Bearer '+token.access_token,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(10000)});
  if (!response.ok) {
    const error=Error('Sandbox request unavailable');
    error.status=response.status;
    throw error;
  }
  return response.json();
}
export async function verifySandboxSubscription(id,userId) {
  if (!/^I-[A-Z0-9]+$/.test(id || '')) return false;
  let s;
  try {
    s=await sandboxRequest('/v1/billing/subscriptions/'+id);
  } catch(error) {
    if(error.status===404) return false;
    throw error;
  }
  const last=s.billing_info?.last_payment;
  if(s.custom_id!==userId || s.plan_id!==process.env.PAYPAL_SANDBOX_PRO_PLAN_ID || s.status!=='ACTIVE' ||
     last?.amount?.currency_code!=='USD' || Number(last.amount.value)!==7.99 ||
     !Number.isFinite(Date.parse(last.time)) || Date.parse(s.billing_info.next_billing_time)<=Date.now() ||
     !Number.isFinite(Date.parse(s.billing_info.next_billing_time)) || Number(s.billing_info.failed_payments_count || 0)!==0) return false;
  const start=new Date(Date.now()-35*86400000).toISOString();
  const end=new Date().toISOString();
  const tx=await sandboxRequest('/v1/billing/subscriptions/'+id+'/transactions?start_time='+encodeURIComponent(start)+'&end_time='+encodeURIComponent(end));
  return Boolean(tx.transactions?.some(t=>t.status==='COMPLETED' && t.amount_with_breakdown?.gross_amount?.currency_code==='USD' && Number(t.amount_with_breakdown.gross_amount.value)===7.99 && Date.parse(t.time)>=Date.parse(last.time)-60000));
}

import { createHmac, timingSafeEqual } from 'node:crypto';
export const TEST_AMOUNT = 41800;
export function unifiedCheckoutUrl(publicKey,clientSecret) {
  const url=new URL('https://accept.paymob.com/unifiedcheckout/');
  url.search=new URLSearchParams({publicKey,clientSecret});
  return url.href;
}
export const paymobTestConfigured = () => process.env.PAYMOB_MODE === 'test' &&
  /^(egy_)?sk_test_/.test(process.env.PAYMOB_SECRET_KEY || '') &&
  /^(egy_)?pk_test_/.test(process.env.PAYMOB_PUBLIC_KEY || '') &&
  Boolean(process.env.PAYMOB_HMAC_SECRET) && /^[1-9][0-9]*$/.test(process.env.PAYMOB_CARD_INTEGRATION_ID || '');
export const callbackFields = ['amount_cents','created_at','currency','error_occured','has_parent_transaction','id','integration_id','is_3d_secure','is_auth','is_capture','is_refunded','is_standalone_payment','is_voided','order.id','owner','pending','source_data.pan','source_data.sub_type','source_data.type','success'];
export function callbackText(obj) {
  return callbackFields.map(path => {
    const value=path.split('.').reduce((v,k)=>v?.[k],obj);
    if (value === undefined || value === null || !['string','number','boolean'].includes(typeof value)) throw Error('Incomplete callback');
    return String(value);
  }).join('');
}
export function verifiedCallback(obj, signature) {
  if (!process.env.PAYMOB_HMAC_SECRET || typeof signature !== 'string' || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  try {
    const expected=createHmac('sha512',process.env.PAYMOB_HMAC_SECRET).update(callbackText(obj)).digest();
    return timingSafeEqual(expected,Buffer.from(signature,'hex'));
  } catch { return false; }
}
export function callbackStatus(obj) {
  if (obj.is_refunded === true || obj.is_voided === true) return 'held';
  if (obj.pending === true) return 'pending';
  if (obj.success !== true || obj.error_occured !== false || obj.is_auth === true) return 'failed';
  return 'paid';
}
export class PaymobTestError extends Error {
  constructor(code, status) {
    super(code);
    this.code=code;
    this.status=status;
  }
}
export async function createTestIntention(user,billing,reference,origin) {
  const response=await fetch('https://accept.paymob.com/v1/intention/',{
    method:'POST',headers:{Authorization:'Token '+process.env.PAYMOB_SECRET_KEY,'Content-Type':'application/json'},
    signal:AbortSignal.timeout(15000),body:JSON.stringify({amount:TEST_AMOUNT,currency:'EGP',
      payment_methods:[Number(process.env.PAYMOB_CARD_INTEGRATION_ID)],
      items:[{name:'Mostaed AI Pro — one month (TEST)',amount:TEST_AMOUNT,quantity:1,description:'Test only. Does not unlock live AI.'}],
      billing_data:{apartment:'NA',floor:'NA',...billing,email:user.email},special_reference:reference,expiration:3600,
      notification_url:origin+'/api/paymob-webhook',redirection_url:origin+'/api/checkout?returnTo='+encodeURIComponent('/checkout-test.html?provider=paymob')})
  });
  if (!response.ok) {
    const code=[401,403].includes(response.status) ? 'PAYMOB_TEST_AUTH'
      : response.status===404 ? 'PAYMOB_TEST_INTEGRATION'
      : response.status===400 ? 'PAYMOB_TEST_REQUEST'
      : 'PAYMOB_TEST_PROVIDER';
    throw new PaymobTestError(code,response.status);
  }
  const data=await response.json();
  const method=data.payment_methods?.find(m=>Number(m.integration_id)===Number(process.env.PAYMOB_CARD_INTEGRATION_ID));
  if (!method || method.live !== false || method.currency !== 'EGP' || !/^(egy_)?csk_test_/.test(data.client_secret || '') || !Number.isSafeInteger(data.intention_order_id)) throw new PaymobTestError('PAYMOB_TEST_MODE',response.status);
  return data;
}

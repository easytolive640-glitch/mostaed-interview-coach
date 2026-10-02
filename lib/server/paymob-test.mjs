import { createHmac, timingSafeEqual } from 'node:crypto';
export const TEST_AMOUNT = 41800;
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
export async function createTestIntention(user,billing,reference,origin) {
  const response=await fetch('https://accept.paymob.com/v1/intention/',{
    method:'POST',headers:{Authorization:'Token '+process.env.PAYMOB_SECRET_KEY,'Content-Type':'application/json'},
    signal:AbortSignal.timeout(15000),body:JSON.stringify({amount:TEST_AMOUNT,currency:'EGP',
      payment_methods:[Number(process.env.PAYMOB_CARD_INTEGRATION_ID)],
      items:[{name:'Mostaed AI Pro — one month (TEST)',amount:TEST_AMOUNT,quantity:1,description:'Test only. Does not unlock live AI.'}],
      billing_data:{...billing,email:user.email},special_reference:reference,expiration:3600,
      notification_url:origin+'/api/paymob-webhook',redirection_url:origin+'/checkout-test.html?provider=paymob'})
  });
  if (!response.ok) throw Error('Paymob could not create test checkout. Check test credentials and integration configuration.');
  const data=await response.json();
  const method=data.payment_methods?.find(m=>Number(m.integration_id)===Number(process.env.PAYMOB_CARD_INTEGRATION_ID));
  if (!method || method.live !== false || method.currency !== 'EGP' || !/^(egy_)?csk_test_/.test(data.client_secret || '') || !Number.isSafeInteger(data.intention_order_id)) throw Error('Unexpected Paymob checkout mode');
  return data;
}

import { randomUUID } from 'node:crypto';
import { authenticatedUser, serviceRpc } from '../lib/server/paid-access.mjs';
import { paymobTestConfigured, createTestIntention, unifiedCheckoutUrl, TEST_AMOUNT, PaymobTestError } from '../lib/server/paymob-test.mjs';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const origin=new URL(process.env.ALLOWED_ORIGIN || 'https://mostaedcoach.com').origin;
  if (req.headers.origin && req.headers.origin !== origin) return res.status(403).json({error:'Origin not allowed'});
  if (!paymobTestConfigured()) return res.status(503).json({error:'Paymob test credentials are not configured. Live checkout is disabled.'});
  try {
    const user=await authenticatedUser(req); if (!user) return res.status(401).json({error:'Sign in first'});
    const billing={};
    for (const name of ['first_name','last_name','phone_number','street','building','city','state','country']) {
      const value=req.body?.billing?.[name];
      if (typeof value !== 'string' || !value.trim() || value.length>120) return res.status(400).json({error:'Fill in all billing fields'});
      billing[name]=value.trim();
    }
    if (!/^\+?[0-9 ()-]{7,25}$/.test(billing.phone_number) || !/^[A-Z]{2}$/.test(billing.country)) return res.status(400).json({error:'Enter a valid phone number and two-letter country code'});
    const reference='mostaed-test-'+randomUUID();
    // Reserve before contacting Paymob; a missing database migration fails closed.
    const reserved=await serviceRpc('reserve_paymob_test_checkout',{p_reference:reference,p_user_id:user.id});
    if (!reserved) return res.status(429).json({error:'Too many test checkouts. Try later.'});
    const data=await createTestIntention(user,billing,reference,origin);
    const attached=await serviceRpc('attach_paymob_test_order',{p_reference:reference,p_user_id:user.id,p_order_id:String(data.intention_order_id)});
    if (!attached) throw Error('Test order could not be saved');
    const url=unifiedCheckoutUrl(process.env.PAYMOB_PUBLIC_KEY,data.client_secret);
    return res.status(200).json({reference,url,testMode:true,amount:TEST_AMOUNT/100,currency:'EGP'});
  } catch(e) {
    if(e instanceof PaymobTestError){
      console.warn('Paymob test intention rejected',{code:e.code,providerStatus:e.status});
      const messages={
        PAYMOB_TEST_AUTH:'Paymob rejected the sandbox credentials.',
        PAYMOB_TEST_INTEGRATION:'Paymob could not find the configured test card integration.',
        PAYMOB_TEST_REQUEST:'Paymob rejected the test checkout request.',
        PAYMOB_TEST_MODE:'Paymob did not return the expected EGP test checkout.',
        PAYMOB_TEST_PROVIDER:'Paymob could not start the test checkout.',
      };
      return res.status(503).json({error:messages[e.code]+' ('+e.code+')'});
    }
    if(e.message.startsWith('Paid-access database')){
      return res.status(503).json({error:'Test checkout could not access the test payment ledger.'});
    }
    console.warn('Paymob test checkout failed',{kind:e.name});
    return res.status(503).json({error:'Test checkout unavailable. Check Paymob connectivity and try again.'});
  }
}

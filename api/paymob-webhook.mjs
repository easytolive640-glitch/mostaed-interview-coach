import { serviceRpc } from '../lib/server/paid-access.mjs';
import { paymobTestConfigured, verifiedCallback, callbackStatus, TEST_AMOUNT } from '../lib/server/paymob-test.mjs';
import {liveReady} from '../lib/server/paymob-live.mjs';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  if (liveReady()) {
    if (req.body?.type !== 'TRANSACTION') return res.status(200).json({ignored:true});
    const obj=req.body.obj;
    if (!verifiedCallback(obj,req.query?.hmac)) return res.status(400).json({error:'Invalid signature'});
    if (obj.currency!=='EGP'||Number(obj.integration_id)!==Number(process.env.PAYMOB_CARD_INTEGRATION_ID)||
        !/^[0-9]+$/.test(String(obj.order?.id))||!/^[0-9]+$/.test(String(obj.id))) return res.status(400).json({error:'Unexpected payment'});
    const state=callbackStatus(obj);
    if (!['paid','held'].includes(state)) return res.status(200).json({ignored:true});
    try {
      const applied=await serviceRpc('apply_paymob_payment',{p_order:String(obj.order.id),p_tx:String(obj.id),
        p_amount:Number(obj.amount_cents),p_reversed:state==='held'});
      return applied?res.status(200).json({received:true}):res.status(503).json({error:'Payment could not be matched'});
    } catch {return res.status(503).json({error:'Payment could not be recorded'});}
  }
  if (!paymobTestConfigured()) return res.status(503).json({error:'Test mode not configured'});
  if (req.body?.type !== 'TRANSACTION') return res.status(200).json({ignored:true});
  const obj=req.body.obj;
  if (!verifiedCallback(obj,req.query?.hmac)) return res.status(400).json({error:'Invalid signature'});
  if (obj.currency !== 'EGP' || Number(obj.amount_cents)!==TEST_AMOUNT || Number(obj.integration_id)!==Number(process.env.PAYMOB_CARD_INTEGRATION_ID)) return res.status(400).json({error:'Unexpected payment'});
  if (!/^[0-9]+$/.test(String(obj.order?.id)) || !/^[0-9]+$/.test(String(obj.id))) return res.status(400).json({error:'Invalid payment reference'});
  try {
    // Only a test ledger is updated. Never writes paid_subscriptions or grants AI access.
    const applied=await serviceRpc('record_paymob_test_payment',{p_order_id:String(obj.order.id),p_transaction_id:String(obj.id),p_status:callbackStatus(obj)});
    return res.status(200).json({received:true,matched:Boolean(applied),testMode:true});
  } catch { return res.status(503).json({error:'Test payment record unavailable'}); }
}

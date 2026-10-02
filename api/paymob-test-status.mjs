import { authenticatedUser, serviceRpc } from '../lib/server/paid-access.mjs';
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const origin=process.env.ALLOWED_ORIGIN || 'https://mostaed-interview-coach.vercel.app';
  if (req.headers.origin && req.headers.origin !== origin) return res.status(403).json({error:'Origin not allowed'});
  try {
    const user=await authenticatedUser(req); if (!user) return res.status(401).json({error:'Sign in first'});
    if (!/^mostaed-test-[0-9a-f-]{36}$/.test(req.body?.reference || '')) return res.status(400).json({error:'Invalid reference'});
    const result=await serviceRpc('paymob_test_checkout_status',{p_reference:req.body.reference,p_user_id:user.id});
    if (!result) return res.status(404).json({error:'Test checkout not found for this account'});
    return res.status(200).json({status:result.status,testMode:true,liveAiUnlocked:false});
  } catch {return res.status(503).json({error:'Test status unavailable'});}
}

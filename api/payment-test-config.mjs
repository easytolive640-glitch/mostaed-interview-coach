import { paymobTestConfigured } from '../lib/server/paymob-test.mjs';
export default function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).end();
  return res.status(200).json({paymobReady:Boolean(paymobTestConfigured()),testMode:true,liveAiUnlocked:false});
}

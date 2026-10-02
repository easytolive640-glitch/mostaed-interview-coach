import { paymobTestConfigured } from '../lib/server/paymob-test.mjs';
import { sandboxConfigured } from '../lib/server/paypal-sandbox.mjs';
export default function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET') return res.status(405).end();
  return res.status(200).json({paymobReady:Boolean(paymobTestConfigured()),paypalSandboxReady:sandboxConfigured(),testMode:true,liveAiUnlocked:false});
}

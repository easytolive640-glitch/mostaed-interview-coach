import { randomUUID } from 'node:crypto';
import { authenticatedUser } from './paid-access.mjs';
const recent = new Map();
const topics = new Set(['payment','refund','cancellation','privacy','account','other']);
export default async function support(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const origin=process.env.ALLOWED_ORIGIN || 'https://mostaed-interview-coach.vercel.app';
  if(req.headers.origin && req.headers.origin!==origin) return res.status(403).json({error:'Origin not allowed'});
  const reference=randomUUID();
  try {
    const user=await authenticatedUser(req);
    if(!user?.email_confirmed_at || typeof user.email!=='string') return res.status(401).json({error:'Sign in with a verified account to contact support'});
    const {topic,message,consent}=req.body || {};
    if(!topics.has(topic) || typeof message!=='string' || message.trim().length<10 || message.length>1500 || consent!==true) return res.status(400).json({error:'Choose a topic, write 10–1500 characters and agree to send your message'});
    const to=process.env.COACHING_ALERT_EMAIL;
    const admins=(process.env.COACHING_ADMIN_EMAILS || '').split(',').map(v=>v.trim().toLowerCase());
    if(!process.env.RESEND_API_KEY || !to || !admins.includes(to.toLowerCase())) throw Error('Support not configured');
    const now=Date.now(),last=recent.get(user.id);
    if(last && now-last<60000) return res.status(429).json({error:'Please wait one minute before sending another request'});
    for(const [id,time] of recent) if(now-time>60000)recent.delete(id);
    if(recent.size>=1000)return res.status(503).json({error:'Support is temporarily busy. Please try later'});
    recent.set(user.id,now);
    const response=await fetch('https://api.resend.com/emails',{
      method:'POST',headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'support-'+reference},
      body:JSON.stringify({from:process.env.COACHING_ALERT_FROM || 'Mostaed <onboarding@resend.dev>',to:[to],reply_to:user.email,
        subject:'Mostaed support — '+topic+' — '+reference,
        text:'Customer support request\nReference: '+reference+'\nTopic: '+topic+'\nAccount ID: '+user.id+'\nReply to: '+user.email+'\n\n'+message.trim()}),
      signal:AbortSignal.timeout(10000),
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok || !result.id){recent.delete(user.id);throw Error('Support delivery not accepted');}
    console.info(JSON.stringify({event:'mostaed_support',outcome:'accepted',reference}));
    return res.status(202).json({accepted:true,reference});
  }catch{
    console.error(JSON.stringify({event:'mostaed_support',outcome:'error',reference}));
    return res.status(503).json({error:'Your request could not be sent. Please try again',reference});
  }
}

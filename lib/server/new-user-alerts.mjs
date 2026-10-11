import {authenticatedUser,serviceRpc} from './paid-access.mjs';
const RECIPIENT='easytolive640@gmail.com';
export function newUserMessage(firstLogin,{test=false}={}) {
 return {from:process.env.COACHING_ALERT_FROM||'Mostaed <onboarding@resend.dev>',to:[RECIPIENT],
 subject:test?'Mostaed — new-user alerts test':'Mostaed — a new user signed in',
 text:test?'Your first-login email alerts are connected. You will receive an alert when a new user signs in to Mostaed for the first time. Repeat logins are excluded.':
 'A new user signed in to Mostaed for the first time.\n\nFirst login: '+new Date(firstLogin).toISOString()+'\nWebsite: https://mostaedcoach.com\n\nThis confirms a login, not a paid subscription.'};
}
export async function sendNewUserAlert(user,{test=false}={}) {
 if(!process.env.RESEND_API_KEY)throw Error('Email unavailable');
 if(!user?.id||!user.email_confirmed_at)return {sent:false};
 let claim;
 if(!test) {
  claim=await serviceRpc('claim_new_user_login_alert',{p_user:user.id});
  if(!claim)return {sent:false};
 }
 const message=newUserMessage(claim?.first_login_at,{test});
 const dedupe=test?'new-user-alert-test-'+user.id+'-'+new Date().toISOString().slice(0,10):'new-user-first-login-'+user.id;
 for(let attempt=0;attempt<3;attempt++) {
  const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{
   Authorization:'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':dedupe},
   body:JSON.stringify(message),signal:AbortSignal.timeout(8000)}).catch(()=>null);
  if(r?.ok) {
   const result=await r.json();
   if(!result.id)throw Error('Missing email confirmation');
   if(!test)await serviceRpc('finish_new_user_login_alert',{p_user:user.id,p_claim:claim.claim_token,p_email:result.id});
   return {sent:true};
  }
  if(r&&r.status!==429&&r.status<500)break;
 }
 throw Error('Email unavailable');
}
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const origin=process.env.ALLOWED_ORIGIN||'https://mostaedcoach.com';
 if(req.headers.origin&&req.headers.origin!==origin)return res.status(403).json({error:'Use Mostaed'});
 const user=await authenticatedUser(req);
 if(!user)return res.status(401).json({error:'Sign in first'});
 let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{return res.status(400).json({error:'Invalid request'});}
 const test=body?.action==='test';
 if(test&&(!user.email_confirmed_at||!(process.env.COACHING_ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).includes(user.email?.toLowerCase())))return res.status(403).json({error:'Admin access required'});
 try { const result=await sendNewUserAlert(user,{test});return res.status(200).json({sent:result.sent,message:test?'New-user alert test sent to easytolive640@gmail.com.':'Login notification checked.'});}
 catch {console.error('New-user alert delivery unavailable');return res.status(503).json({error:'Email alert temporarily unavailable'});}
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function coachAlertMessage(id,{test=false}={}){
 if(!test&&!UUID.test(id||''))throw Error('Invalid application');
 const base=new URL(process.env.COACHING_SITE_URL||'https://mostaed-interview-coach.vercel.app');
 if(base.protocol!=='https:')throw Error('Secure site URL required');
 const link=new URL('/coaching.html',base);if(!test)link.searchParams.set('review',id);link.hash='adminReview';
 return {from:process.env.COACHING_ALERT_FROM||'Mostaed <onboarding@resend.dev>',to:[process.env.COACHING_ALERT_EMAIL],
 subject:test?'Mostaed — admin email alerts test':'Mostaed — new coach application',
 text:(test?'Your coach application alerts are connected.':'A new coach application is awaiting your review.')+'\n\nReview and approve: '+link.href+'\n\nSign in with your Mostaed administrator account. Review LinkedIn, CV and coaching terms before approving. Opening this link does not approve an application.',
 html:'<h2>Mostaed · Coach review</h2><p>'+(test?'Your admin email alerts are connected.':'A new coach application is awaiting your review.')+'</p><p><a href="'+link.href.replaceAll('&','&amp;')+'">Review and approve application</a></p><p>Sign in with your Mostaed administrator account. Review LinkedIn, CV and coaching terms before approving. Opening this link does not approve an application.</p>'};
}
export async function sendCoachAlert(id,{test=false}={}){
 const key=process.env.RESEND_API_KEY,to=process.env.COACHING_ALERT_EMAIL;
 const admins=(process.env.COACHING_ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase());
 if(!key||!to||!admins.includes(to.toLowerCase()))throw Error('Admin email alerts are not configured.');
 const message=coachAlertMessage(id,{test}),dedupe=test?'coach-alert-test-'+id:'coach-application-'+id;
 for(let attempt=0;attempt<3;attempt++){
  try{
   const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':dedupe},body:JSON.stringify(message),signal:AbortSignal.timeout(8000)});
   if(r.ok){const result=await r.json();if(!result.id)throw Error('Email service returned no confirmation');return result.id;}
   if(r.status!==429&&r.status<500)throw Error('Email service rejected the alert.');
  }catch(e){if(attempt===2||e.message==='Email service rejected the alert.')throw Error('Admin email could not be sent.');}
 }
 throw Error('Admin email could not be sent.');
}

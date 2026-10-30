const SITE = 'https://mostaedcoach.com';
const ADMIN = 'easytolive640@gmail.com';
const FROM = {email:'info@mostaedcoach.com',name:'Mostaed | مستعد'};
const json = (value,status=200) => Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export function welcomeMessage(to) {
  return {from:FROM,to,subject:'Welcome to Mostaed | أهلاً بك في مستعد',
    text:'Welcome to Mostaed!\nStart free interview practice: '+SITE+'/freepractice\nYour account and AI plans: '+SITE+'/account.html\nThis email does not activate a paid subscription.\nQuestions? Reply to info@mostaedcoach.com\n\nأهلاً بك في مستعد! تدرّب على المقابلات مجاناً عبر الرابط أعلاه. هذه الرسالة لا تفعّل اشتراكاً مدفوعاً.',
    html:'<h1>Welcome to Mostaed | أهلاً بك في مستعد</h1><p><a href="'+SITE+'/freepractice">Start free interview practice · ابدأ التدريب المجاني</a></p><p><a href="'+SITE+'/account.html">Your account and AI plans · حسابك وباقات الذكاء الاصطناعي</a></p><p>This email does not activate a paid subscription. هذه الرسالة لا تفعّل اشتراكاً مدفوعاً.</p><p>Contact: info@mostaedcoach.com</p>',replyTo:'info@mostaedcoach.com'};
}
export function eligible(user,now=Date.now()) {
  const created=Date.parse(user?.created_at);
  return Boolean(user?.email_confirmed_at && /^[0-9a-f-]{36}$/i.test(user.id||'') &&
    typeof user.email==='string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) &&
    Number.isFinite(created) && created<=now && now-created<=86400000);
}
async function enqueue(env,id,to,kind,detail='') {
  await env.DB.prepare('INSERT OR IGNORE INTO mail_jobs(id,recipient,kind,detail,created) VALUES(?,?,?,?,?)')
    .bind(id,to,kind,detail,Date.now()).run();
}
async function reserveSend(env) {
  const day=new Date().toISOString().slice(0,10);
  const row=await env.DB.prepare('INSERT INTO send_budget(day,attempts) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET attempts=attempts+1 WHERE attempts<90 RETURNING attempts').bind(day).first();
  return Boolean(row);
}
export async function deliver(env,id) {
  const now=Date.now();
  // A lease prevents concurrent requests and cron runs claiming the same message.
  const job=await env.DB.prepare("UPDATE mail_jobs SET attempts=attempts+1,lease_until=? WHERE id=? AND state='pending' AND attempts<3 AND lease_until<? AND created>? RETURNING *")
    .bind(now+300000,id,now,now-86400000).first();
  if(!job)return {sent:false};
  if(!await reserveSend(env)) {
    await env.DB.prepare('UPDATE mail_jobs SET attempts=attempts-1,lease_until=0 WHERE id=?').bind(id).run();
    return {sent:false,capped:true};
  }
  const message=job.kind==='welcome'?welcomeMessage(job.recipient):{
    from:FROM,to:ADMIN,subject:job.kind==='test'?'Mostaed — notification system test':'Mostaed — website availability alert',
    text:job.detail+'\n\nWebsite: '+SITE+'\nThese checks cover public page availability, not payment completion or AI evaluation.'};
  try {
    const result=await env.EMAIL.send(message);
    // Clear the recipient after delivery; only the user/job ID remains for deduplication.
    await env.DB.prepare("UPDATE mail_jobs SET state='sent',recipient='',detail='',lease_until=0 WHERE id=?").bind(id).run();
    console.log(JSON.stringify({event:'notification_sent',kind:job.kind}));
    return {sent:true};
  } catch {
    // Ambiguous provider failures may have delivered. Bounded retries can duplicate mail.
    await env.DB.prepare('UPDATE mail_jobs SET lease_until=? WHERE id=?').bind(now+900000,id).run();
    console.error(JSON.stringify({event:'notification_failed',kind:job.kind}));
    return {sent:false,retry:true};
  }
}
export async function checkSite(env,fetcher=fetch) {
  for(const path of ['/', '/api/account-config']) {
    let healthy=false;
    try {
      const response=await fetcher(SITE+path,{signal:AbortSignal.timeout(10000),redirect:'error',headers:{'Cache-Control':'no-cache'}});
      healthy=response.ok;
      await response.body?.cancel();
    } catch {}
    const old=await env.DB.prepare('SELECT failures FROM checks WHERE path=?').bind(path).first();
    const failures=healthy?0:(old?.failures||0)+1;
    await env.DB.prepare('INSERT INTO checks(path,failures,checked) VALUES(?,?,?) ON CONFLICT(path) DO UPDATE SET failures=excluded.failures,checked=excluded.checked').bind(path,failures,Date.now()).run();
    if(failures>=2) await enqueue(env,'outage:'+path+':'+new Date().toISOString().slice(0,10),ADMIN,'alert','Public endpoint '+path+' failed at least two consecutive 15-minute checks. Check Vercel and Cloudflare.');
  }
}
export default {
  async fetch(request,env,ctx) {
    const url=new URL(request.url);
    if(url.pathname!=='/api/notifications')return json({error:'Not found'},404);
    if(request.method==='GET')return json({service:'mostaed-notifications',status:'running'});
    if(request.method!=='POST')return json({error:'Method not allowed'},405);
    if(request.headers.get('Origin')!==SITE)return json({error:'Use Mostaed'},403);
    const auth=request.headers.get('Authorization')||'';
    if(!/^Bearer [A-Za-z0-9._~-]{20,4096}$/.test(auth))return json({error:'Sign in first'},401);
    try {
      // Authentication goes directly to the fixed Supabase project, never a caller URL.
      const response=await fetch(env.SUPABASE_URL+'/auth/v1/user',{headers:{apikey:env.SUPABASE_PUBLIC_KEY,Authorization:auth},signal:AbortSignal.timeout(8000)});
      if(!response.ok)return json({error:'Sign in first'},401);
      const user=await response.json();
      const test=url.searchParams.get('test')==='1';
      if(test && (!user.email_confirmed_at||user.email?.toLowerCase()!==ADMIN))return json({error:'Admin only'},403);
      if(!test&&!eligible(user))return json({queued:false});
      const id=test?'test:'+new Date().toISOString().slice(0,10):'welcome:'+user.id;
      await enqueue(env,id,test?ADMIN:user.email,test?'test':'welcome','Your Mostaed branded notifications are connected.');
      ctx.waitUntil(deliver(env,id).catch(()=>console.error(JSON.stringify({event:'delivery_job_failed'}))));
      return json({queued:true},202);
    } catch {return json({error:'Notification temporarily unavailable'},503);}
  },
  async scheduled(controller,env,ctx) {
    // Persisted jobs survive restarts. Process at most ten per scheduled invocation.
    await checkSite(env);
    const jobs=await env.DB.prepare("SELECT id FROM mail_jobs WHERE state='pending' AND attempts<3 AND lease_until<? AND created>? ORDER BY created LIMIT 10").bind(Date.now(),Date.now()-86400000).all();
    for(const job of jobs.results)await deliver(env,job.id);
    await env.DB.prepare("UPDATE mail_jobs SET state='expired',recipient='',detail='' WHERE state='pending' AND (created<? OR attempts>=3) AND lease_until<?").bind(Date.now()-86400000,Date.now()).run();
  }
};

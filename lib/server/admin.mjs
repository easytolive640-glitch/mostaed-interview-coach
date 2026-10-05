import {authenticatedUser} from './paid-access.mjs';
import {isCoachAdmin,db,UUID,coachingMode,bookingReady} from './coaching.mjs';
import {paypalRequest} from './paypal.mjs';
import {sandboxRequest} from './paypal-sandbox.mjs';

const PAGE=500,MAX_PAGES=20;
export async function readAll(table,select,key){
 const rows=[];
 for(let page=0;page<MAX_PAGES;page++){
  const batch=await db(table,new URLSearchParams({select,order:key,limit:String(PAGE),offset:String(page*PAGE)}).toString());
  if(!Array.isArray(batch))throw Error('Invalid records');rows.push(...batch.map(row=>Object.fromEntries(select.split(',').map(k=>[k,row[k]]))));
  if(batch.length<PAGE)return rows;
 }
 throw Error('Dashboard record limit reached');
}
export async function readAccounts(){
 const rows=[],key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key||!process.env.SUPABASE_URL)throw Error('Account service unavailable');
 for(let page=1;page<=MAX_PAGES;page++){
  const r=await fetch(process.env.SUPABASE_URL+'/auth/v1/admin/users?'+new URLSearchParams({page:String(page),per_page:String(PAGE)}),{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(10000)});
  if(!r.ok)throw Error('Account service unavailable');
  const d=await r.json();if(!Array.isArray(d.users))throw Error('Invalid accounts');
  rows.push(...d.users.map(u=>({id:u.id,email:u.email||'',name:u.user_metadata?.full_name||'',created_at:u.created_at,confirmed:Boolean(u.email_confirmed_at)})));
  if(!d.users.length||rows.length>=Number(d.total)||d.users.length<PAGE)return rows;
 }
 throw Error('Dashboard account limit reached');
}
export function summarize(accounts,subscriptions,coaches,bookings){
 const plans={};
 for(const mode of ['live','sandbox']){
  const rows=subscriptions?.filter(s=>s.test_mode===(mode==='sandbox'));
  plans[mode]=Object.fromEntries(['starter','pro'].map(plan=>{
   const items=rows?.filter(s=>s.plan===plan);
   return [plan,{submitted:items?new Set(items.map(s=>s.user_id)).size:null,records:items?.length??null,active:items?new Set(items.filter(s=>s.status==='active').map(s=>s.user_id)).size:null}];
  }));
 }
 const livePaid=new Set(subscriptions?.filter(s=>s.test_mode===false&&s.status==='active').map(s=>s.user_id));
 return {accounts:accounts?.length??null,freeAccounts:accounts&&subscriptions?accounts.filter(u=>!livePaid.has(u.id)).length:null,plans,
  coaches:coaches?Object.fromEntries(['pending','approved','paused'].map(status=>[status,coaches.filter(c=>c.status===status).length])):null,
  sessions:bookings?Object.fromEntries(['live','sandbox'].map(mode=>[mode,bookings.filter(b=>b.test_mode===(mode==='sandbox')).length])):null};
}
export async function dashboard(){
 const sources=[['accounts',()=>readAccounts()],['subscriptions',()=>readAll('paid_subscriptions','subscription_id,user_id,plan,status,test_mode,updated_at','subscription_id')],['coaches',()=>readAll('career_coaches','id,user_id,name,bio,specialty,languages,price_cents,status,linkedin_url,cv_name,photo_path,created_at,zoom_host_id','id')],['slots',()=>readAll('coaching_slots','id,coach_id,starts_at,duration_minutes','id')],['bookings',()=>readAll('coaching_bookings','id,slot_id,user_id,price_cents,status,test_mode,order_id,capture_id,created_at','id')],['paymob',()=>readAll('paymob_test_checkouts','reference,user_id,order_id,status,created_at','reference')]];
 const results=await Promise.allSettled(sources.map(([,fn])=>fn()));
 const data={},warnings=[];
 results.forEach((r,i)=>{const name=sources[i][0];data[name]=r.status==='fulfilled'?r.value:null;if(r.status==='rejected')warnings.push(name);});
 const users=new Map(data.accounts?.map(u=>[u.id,u])||[]),coaches=new Map(data.coaches?.map(c=>[c.id,c])||[]),slots=new Map(data.slots?.map(s=>[s.id,s])||[]);
 const identity=id=>({user_id:id,email:users.get(id)?.email||'',account_name:users.get(id)?.name||''});
 return {generatedAt:new Date().toISOString(),summary:summarize(data.accounts,data.subscriptions,data.coaches,data.bookings),warnings,
  accounts:data.accounts,subscriptions:data.subscriptions?.map(s=>({...s,...identity(s.user_id)}))??null,
  coaches:data.coaches?.map(({photo_path,zoom_host_id,...c})=>({...c,...identity(c.user_id),has_photo:Boolean(photo_path),has_host:Boolean(zoom_host_id)}))??null,
  bookings:data.bookings?.map(b=>{const slot=slots.get(b.slot_id);return {...b,...identity(b.user_id),coach_name:coaches.get(slot?.coach_id)?.name||'',starts_at:slot?.starts_at||null,payment_verified:Boolean(b.capture_id)};})??null,
  paymob:data.paymob?.map(p=>({...p,...identity(p.user_id),test_mode:true,currency:'EGP',amount_cents:41800}))??null,
  bookingEnabled:bookingReady(),coachingMode:coachingMode()||'unconfigured'};
}
export async function subscriptionPayments(id){
 if(!/^I-[A-Z0-9]+$/.test(id||''))return {error:'Invalid subscription',status:400};
 const saved=(await db('paid_subscriptions','subscription_id=eq.'+encodeURIComponent(id)+'&select=subscription_id,test_mode'))[0];
 if(!saved)return {error:'Subscription not found',status:404};
 if(!saved.test_mode&&process.env.PAYPAL_MODE!=='live')return {error:'Live payment lookup unavailable',status:503};
 const request=saved.test_mode?sandboxRequest:paypalRequest;
 const start=new Date(Date.now()-30*86400000).toISOString(),end=new Date().toISOString();
 const [s,t]=await Promise.all([request('/v1/billing/subscriptions/'+id),request('/v1/billing/subscriptions/'+id+'/transactions?'+new URLSearchParams({start_time:start,end_time:end}))]);
 const last=s.billing_info?.last_payment;
 return {subscriptionId:id,test_mode:saved.test_mode,providerStatus:s.status,from:start,to:end,nextBilling:s.billing_info?.next_billing_time||null,lastPayment:last?{amount:last.amount?.value,currency:last.amount?.currency_code,time:last.time}:null,
  transactions:(t.transactions||[]).map(x=>({id:x.id,status:x.status,time:x.time,amount:x.amount_with_breakdown?.gross_amount?.value,currency:x.amount_with_breakdown?.gross_amount?.currency_code})),status:200};
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('Vercel-CDN-Cache-Control','no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});
 try{
  const user=await authenticatedUser(req);if(!user)return res.status(401).json({error:'Sign in first'});
  if(!isCoachAdmin(user))return res.status(403).json({error:'Mostaed administrator access required.'});
  if(req.query?.subscription){const d=await subscriptionPayments(req.query.subscription);return res.status(d.status).json(d);}
  return res.status(200).json(await dashboard());
 }catch{return res.status(503).json({error:'Admin dashboard is temporarily unavailable.'});}
}

import {randomUUID} from 'node:crypto';
import {sendCoachAlert} from './coach-alerts.mjs';
import {authenticatedUser, serviceRpc} from './paid-access.mjs';
import {paypalRequest} from './paypal.mjs';
import {sandboxRequest} from './paypal-sandbox.mjs';
export const coachingMode=()=>process.env.COACHING_PAYPAL_MODE||process.env.PAYPAL_MODE;
export async function coachingPaymentRequest(path,options={}){
 const mode=coachingMode();
 if(mode==='sandbox') return sandboxRequest(path,options);
 if(mode==='live'&&process.env.PAYPAL_MODE==='live') return paypalRequest(path,options);
 throw Error('Coaching payment environment unavailable');
}
export const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateProfile(body){
 const p={};
 for(const [key,max] of [['name',100],['bio',1500],['specialty',150],['languages',150]]){
  if(typeof body?.[key]!=='string'||!body[key].trim()||body[key].length>max) throw Error('Complete the coach profile within the field limits.');
  p[key]=body[key].trim();
 }
 p.price_cents=Math.round(Number(body.price)*100);
 if(!Number.isFinite(Number(body.price))||p.price_cents<100||p.price_cents>100000) throw Error('Enter a session price between USD 1 and USD 1,000.');
 return p;
}

export function isCoachAdmin(user){
 return Boolean(user?.email_confirmed_at && typeof user.email==='string' && (process.env.COACHING_ADMIN_EMAILS||'').split(',').map(e=>e.trim().toLowerCase()).filter(Boolean).includes(user.email.toLowerCase()));
}
export function validateLinkedIn(value){
 let url;try{url=new URL(value);}catch{throw Error('Enter a valid LinkedIn profile URL.');}
 if(url.protocol!=='https:'||!['linkedin.com','www.linkedin.com'].includes(url.hostname)||!/^\/in\/[a-z0-9_%.-]+\/?$/i.test(url.pathname)||url.username||url.password||url.port)throw Error('Enter a valid LinkedIn profile URL.');
 url.search='';url.hash='';return url.toString();
}
export function validateCredentials(body){
 const linkedin_url=validateLinkedIn(body.linkedin_url);
 const cv=body.cv;
 if(!cv||typeof cv.base64!=='string'||cv.base64.length>1398110||!/^[A-Za-z0-9+/]*={0,2}$/.test(cv.base64)||typeof cv.name!=='string'||cv.name.length>150||!cv.name.toLowerCase().endsWith('.pdf'))throw Error('Upload a PDF CV of up to 1 MB.');
 const bytes=Buffer.from(cv.base64,'base64');
 if(bytes.length>1048576||bytes.length<20||bytes.subarray(0,5).toString()!=='%PDF-')throw Error('Upload a PDF CV of up to 1 MB.');
 return {linkedin_url,bytes,cv_name:cv.name.replace(/[\\/\x00-\x1f]/g,'_')};
}
async function storage(path,options={}){
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const r=await fetch(process.env.SUPABASE_URL+'/storage/v1/'+path,{...options,headers:{apikey:key,Authorization:'Bearer '+key,...options.headers},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('CV storage is temporarily unavailable.');
 return r.json();
}
export function validatePhoto(photo){
 if(!photo||typeof photo.base64!=='string'||photo.base64.length>409600||!/^[A-Za-z0-9+/]*={0,2}$/.test(photo.base64))throw Error('Upload a JPG or PNG profile photo of up to 300 KB.');
 const bytes=Buffer.from(photo.base64,'base64');
 if(!bytes.length||bytes.length>307200)throw Error('Upload a JPG or PNG profile photo of up to 300 KB.');
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(!png&&!jpg)throw Error('Upload a JPG or PNG profile photo of up to 300 KB.');
 return {bytes,type:png?'image/png':'image/jpeg',ext:png?'png':'jpg'};
}
async function saveCredentials(body,userId,current){
 const result={linkedin_url:validateLinkedIn(body.linkedin_url)};
 if(body.cv){
  const c=validateCredentials(body),path=userId+'/'+randomUUID()+'.pdf';
  await storage('object/coach-cvs/'+path,{method:'POST',headers:{'Content-Type':'application/pdf','x-upsert':'false'},body:c.bytes});
  Object.assign(result,{cv_name:c.cv_name,cv_path:path});
 }else if(!current?.cv_path)throw Error('Upload a PDF CV of up to 1 MB.');
 if(body.photo){
  const p=validatePhoto(body.photo),path=userId+'/'+randomUUID()+'.'+p.ext;
  try{await storage('object/coach-photos/'+path,{method:'POST',headers:{'Content-Type':p.type,'x-upsert':'false'},body:p.bytes});result.photo_path=path;}
  catch(e){if(result.cv_path)await removeCV(result.cv_path);throw e;}
 }
 return result;
}
async function removeCV(path){try{await storage('object/coach-cvs',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({prefixes:[path]})});}catch{}}

export function validPayment(order,b){
 const units=order?.purchase_units;
 const captures=units?.[0]?.payments?.captures;
 return Boolean(order?.id===b.order_id && order.status==='COMPLETED' && units?.length===1 && units[0].custom_id===b.id &&
  units[0].amount?.currency_code==='USD' && Math.round(Number(units[0].amount.value)*100)===b.price_cents &&
  captures?.length===1 && captures[0].status==='COMPLETED' && captures[0].amount?.currency_code==='USD' &&
  Math.round(Number(captures[0].amount.value)*100)===b.price_cents && captures[0].id);
}
export const bookingReady=()=>process.env.COACHING_BOOKINGS_ENABLED==='true' && ['live','sandbox'].includes(coachingMode()) &&
 Boolean((coachingMode()==='sandbox' ? process.env.PAYPAL_SANDBOX_CLIENT_ID&&process.env.PAYPAL_SANDBOX_CLIENT_SECRET : process.env.PAYPAL_MODE==='live'&&process.env.PAYPAL_CLIENT_ID&&process.env.PAYPAL_CLIENT_SECRET)&&process.env.ZOOM_ACCOUNT_ID&&process.env.ZOOM_CLIENT_ID&&process.env.ZOOM_CLIENT_SECRET);
export async function db(table,query='',options={}){
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!key||!process.env.SUPABASE_URL) throw Error('Coaching database unavailable');
 const r=await fetch(process.env.SUPABASE_URL+'/rest/v1/'+table+(query?'?'+query:''),{...options,headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json',Prefer:'return=representation',...options.headers},signal:AbortSignal.timeout(10000)});
 if(!r.ok) throw Error('Coaching database unavailable');
 return r.status===204?[]:r.json();
}
export async function zoomMeeting(coach,slot){
 const token=await fetch('https://zoom.us/oauth/token?'+new URLSearchParams({grant_type:'account_credentials',account_id:process.env.ZOOM_ACCOUNT_ID}),{
  method:'POST',headers:{Authorization:'Basic '+Buffer.from(process.env.ZOOM_CLIENT_ID+':'+process.env.ZOOM_CLIENT_SECRET).toString('base64')},signal:AbortSignal.timeout(10000)});
 if(!token.ok) throw Error('Meeting service unavailable');
 const auth=await token.json();
 const response=await fetch('https://api.zoom.us/v2/users/'+encodeURIComponent(coach.zoom_host_id)+'/meetings',{
  method:'POST',headers:{Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json'},
  body:JSON.stringify({topic:'Mostaed private career coaching',type:2,start_time:slot.starts_at,duration:slot.duration_minutes,timezone:'UTC',settings:{waiting_room:true,join_before_host:false,auto_recording:'none'}}),signal:AbortSignal.timeout(10000)});
 if(!response.ok) throw Error('Meeting service unavailable');
 const meeting=await response.json();
 const url=new URL(meeting.join_url);
 if(url.protocol!=='https:'||!/(^|\.)zoom\.us$/.test(url.hostname)) throw Error('Invalid meeting response');
 return {zoom_meeting_id:String(meeting.id),zoom_join_url:meeting.join_url};
}
function cleanBooking(b){const {capture_id,order_id,zoom_meeting_id,user_id,...out}=b;return out;}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method)) return res.status(405).json({error:'Method not allowed'});
 try{
  if(req.method==='GET'&&req.query?.photo){
   if(!UUID.test(req.query.photo))return res.status(404).end();
   const profile=(await db('career_coaches','id=eq.'+req.query.photo+'&status=eq.approved&select=photo_path'))[0];
   if(!profile?.photo_path)return res.status(404).end();
   const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
   const image=await fetch(process.env.SUPABASE_URL+'/storage/v1/object/authenticated/coach-photos/'+profile.photo_path,{headers:{apikey:key,Authorization:'Bearer '+key},signal:AbortSignal.timeout(10000)});
   if(!image.ok)return res.status(404).end();
   res.setHeader('Content-Type',profile.photo_path.endsWith('.png')?'image/png':'image/jpeg');res.setHeader('X-Content-Type-Options','nosniff');
   return res.status(200).end(Buffer.from(await image.arrayBuffer()));
  }
  if(req.method==='GET'&&!req.query?.mine&&!req.query?.review){
   const coaches=await db('career_coaches','status=eq.approved&zoom_host_id=not.is.null&select=id,name,bio,specialty,languages,price_cents,linkedin_url,photo_path&limit=50');
   const slots=await db('coaching_slots','starts_at=gt.'+encodeURIComponent(new Date(Date.now()+7200000).toISOString())+'&select=id,coach_id,starts_at,duration_minutes&order=starts_at&limit=300');
   const reserved=await db('coaching_bookings','status=neq.cancelled&select=slot_id&limit=10000');
   const taken=new Set(reserved.map(b=>b.slot_id));
   return res.status(200).json({coaches:coaches.map(({photo_path,...c})=>({...c,has_photo:Boolean(photo_path)})),slots:slots.filter(s=>!taken.has(s.id)&&coaches.some(c=>c.id===s.coach_id)),bookingEnabled:bookingReady(),sandbox:coachingMode()==='sandbox'});
  }
  const user=await authenticatedUser(req);
  if(!user) return res.status(401).json({error:'Sign in to your Mostaed account first.'});
  if(req.method==='GET'&&req.query?.review){
   if(!isCoachAdmin(user))return res.status(403).json({error:'Mostaed administrator access required.'});
   const applications=await db('career_coaches','status=in.(pending,paused)&select=id,name,bio,specialty,languages,price_cents,status,linkedin_url,cv_name,photo_path,created_at&order=created_at&limit=100');
   return res.status(200).json({applications:applications.map(({photo_path,...c})=>({...c,has_photo:Boolean(photo_path)}))});
  }
  const coach=(await db('career_coaches','user_id=eq.'+user.id))[0];
  if(req.method==='GET'){
   const bookings=await db('coaching_bookings','user_id=eq.'+user.id+'&order=created_at.desc&limit=100');
   async function details(rows){
    if(!rows.length) return [];
    const ids=[...new Set(rows.map(b=>b.slot_id))];
    const slots=await db('coaching_slots','id=in.('+ids.join(',')+')');
    const coaches=slots.length?await db('career_coaches','id=in.('+[...new Set(slots.map(s=>s.coach_id))].join(',')+')&select=id,name'):[];
    return rows.map(b=>{const slot=slots.find(s=>s.id===b.slot_id);return {...cleanBooking(b),starts_at:slot?.starts_at,coach_name:coaches.find(c=>c.id===slot?.coach_id)?.name};});
   }
   let coachBookings=[];
   if(coach){const slots=await db('coaching_slots','coach_id=eq.'+coach.id);if(slots.length) coachBookings=await db('coaching_bookings','slot_id=in.('+slots.map(s=>s.id).join(',')+')&status=in.(paid,meeting_creating,confirmed,meeting_review)&limit=100');
    return res.status(200).json({isAdmin:isCoachAdmin(user),coach,slots,bookings:await details(bookings),coachBookings:await details(coachBookings)});}
   return res.status(200).json({isAdmin:isCoachAdmin(user),coach:null,slots:[],bookings:await details(bookings),coachBookings:[]});
  }
  if(req.headers.origin && req.headers.origin!==new URL(process.env.COACHING_SITE_URL||'https://mostaed-interview-coach.vercel.app').origin) return res.status(403).json({error:'Use the Mostaed website.'});
  if(!(req.headers['content-type']||'').startsWith('application/json')) return res.status(415).json({error:'JSON required'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||JSON.stringify(body).length>(['register','credentials'].includes(body.action)?1900000:8000)) return res.status(400).json({error:'Invalid request'});
  if(body.action==='alert_test'){
   if(!isCoachAdmin(user))return res.status(403).json({error:'Mostaed administrator access required.'});
   await sendCoachAlert(randomUUID(),{test:true});return res.status(200).json({message:'Test alert sent to the configured admin email.'});
  }
  if(body.action==='register'){
   if(coach) return res.status(409).json({error:'Your coach application is already saved.'});
   if(body.consent!=='on')return res.status(400).json({error:'Consent is required before submitting your coach application.'});
   const profile=validateProfile(body);
   const credentials=await saveCredentials(body,user.id);
   const applicationId=randomUUID();
   try{await db('career_coaches','',{method:'POST',body:JSON.stringify({id:applicationId,...profile,...credentials,user_id:user.id,status:'pending'})});}catch(e){await removeCV(credentials.cv_path);throw e;}
   try{await sendCoachAlert(applicationId);}catch{console.error('Coach admin email failed; application saved:',applicationId);}
   return res.status(201).json({message:'Application received. Mostaed will review your profile before it appears publicly.'});
  }
  if(body.action==='credentials'){
   if(!coach||coach.status==='approved')return res.status(403).json({error:'Only pending or paused applications can update credentials.'});
   const credentials=await saveCredentials(body,user.id,coach);
   try{await db('career_coaches','id=eq.'+coach.id,{method:'PATCH',body:JSON.stringify({...credentials,status:'pending'})});}catch(e){await removeCV(credentials.cv_path);throw e;}
   if(credentials.cv_path&&coach.cv_path)await removeCV(coach.cv_path);
   return res.status(200).json({message:'Credentials saved for review.'});
  }
  if(['cv','photo'].includes(body.action)){
   if(!UUID.test(body.coach_id||''))return res.status(400).json({error:'Invalid coach'});
   const profile=(await db('career_coaches','id=eq.'+body.coach_id))[0];
   if(!profile||(!isCoachAdmin(user)&&profile.user_id!==user.id))return res.status(403).json({error:'CV access denied.'});
   const photo=body.action==='photo',path=photo?profile.photo_path:profile.cv_path;
   if(!path)return res.status(404).json({error:photo?'No profile photo uploaded yet.':'No CV uploaded yet.'});
   const signed=await storage('object/sign/'+(photo?'coach-photos/':'coach-cvs/')+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:60,download:photo?'profile-photo':profile.cv_name})});
   return res.status(200).json({url:process.env.SUPABASE_URL+'/storage/v1'+signed.signedURL});
  }
  if(body.action==='review'){
   if(!isCoachAdmin(user))return res.status(403).json({error:'Mostaed administrator access required.'});
   if(!UUID.test(body.coach_id||'')||!['approved','paused'].includes(body.status))return res.status(400).json({error:'Invalid review'});
   const profile=(await db('career_coaches','id=eq.'+body.coach_id))[0];
   if(!profile)return res.status(404).json({error:'Coach not found.'});
   if(body.status==='approved'&&(!profile.cv_path||!profile.linkedin_url||body.review_confirmed!==true))return res.status(400).json({error:'Review LinkedIn and CV and confirm coaching and payout terms.'});
   await db('career_coaches','id=eq.'+profile.id,{method:'PATCH',body:JSON.stringify({status:body.status,...(body.status==='approved'?{zoom_host_id:null}:{}),reviewed_by:user.id,reviewed_at:new Date().toISOString()})});
   return res.status(200).json({message:body.status==='approved'?'Application approved. Complete Zoom setup in the admin dashboard to activate bookings.':'Application paused; not publicly listed.'});
  }
  if(body.action==='activate'){
   if(!isCoachAdmin(user))return res.status(403).json({error:'Mostaed administrator access required.'});
   if(!UUID.test(body.coach_id||''))return res.status(400).json({error:'Invalid coach'});
   const profile=(await db('career_coaches','id=eq.'+body.coach_id))[0];
   if(!profile||profile.status!=='approved')return res.status(409).json({error:'Approve the application before activating bookings.'});
   if(body.zoom_ready!==true||typeof body.zoom_host_id!=='string'||!/^([^\s@/]{1,100}@[^\s@/]{1,100}\.[^\s@/]{2,30}|[A-Za-z0-9_-]{5,100})$/.test(body.zoom_host_id))return res.status(400).json({error:'Enter the managed Zoom host email or ID and confirm the coach accepted the invitation and has the required hosting licence.'});
   await db('career_coaches','id=eq.'+profile.id,{method:'PATCH',body:JSON.stringify({zoom_host_id:body.zoom_host_id})});
   return res.status(200).json({message:'Coach activated for bookings.'});
  }
  if(body.action==='slot'){
   if(!coach||coach.status!=='approved'||!coach.zoom_host_id) return res.status(403).json({error:'Your coach profile must be approved first.'});
   const start=Date.parse(body.starts_at);
   if(!Number.isFinite(start)||start<Date.now()+7200000||start>Date.now()+90*86400000) return res.status(400).json({error:'Choose a time between two hours and 90 days from now.'});
   // Fixed 30-minute sessions; exact and partial overlaps are rejected.
   const slots=await db('coaching_slots','coach_id=eq.'+coach.id+'&starts_at=gt.'+encodeURIComponent(new Date(start-1800000).toISOString())+'&starts_at=lt.'+encodeURIComponent(new Date(start+1800000).toISOString()));
   if(slots.length) return res.status(409).json({error:'This time overlaps an existing slot.'});
   await db('coaching_slots','',{method:'POST',body:JSON.stringify({coach_id:coach.id,starts_at:new Date(start).toISOString(),ends_at:new Date(start+1800000).toISOString()})});
   return res.status(201).json({message:'Availability added.'});
  }
  if(!['checkout','confirm'].includes(body.action)) return res.status(400).json({error:'Unknown action'});
  if(!bookingReady()) return res.status(503).json({error:'Paid session bookings are not open yet.'});
  const test=coachingMode()==='sandbox';
  if(body.action==='checkout'){
   if(!UUID.test(body.slot_id||'')) return res.status(400).json({error:'Invalid slot'});
   const b=await serviceRpc('reserve_coaching_slot',{p_slot:body.slot_id,p_user:user.id,p_test:test});
   if(b.status!=='pending_payment') return res.status(409).json({error:'This booking is already paid. View it in My sessions.'});
   const origin=new URL(process.env.COACHING_SITE_URL||'https://mostaed-interview-coach.vercel.app').origin;
   const order=await coachingPaymentRequest('/v2/checkout/orders',{method:'POST',headers:{'PayPal-Request-Id':b.id},body:JSON.stringify({intent:'CAPTURE',purchase_units:[{custom_id:b.id,description:'Mostaed 30-minute career coaching',amount:{currency_code:'USD',value:(b.price_cents/100).toFixed(2)}}],payment_source:{paypal:{experience_context:{shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW',return_url:origin+'/coaching.html?booking='+b.id,cancel_url:origin+'/coaching.html?cancelled=1'}}}})});
   if(b.order_id&&b.order_id!==order.id) throw Error('Order mismatch');
   await db('coaching_bookings','id=eq.'+b.id,{method:'PATCH',body:JSON.stringify({order_id:order.id})});
   const link=order.links?.find(l=>['approve','payer-action'].includes(l.rel))?.href;
   if(!link||!/^https:\/\/(www\.)?(sandbox\.)?paypal\.com\//.test(link)) throw Error('Checkout link unavailable');
   return res.status(200).json({url:link,bookingId:b.id});
  }
  if(!UUID.test(body.booking_id||'')) return res.status(400).json({error:'Invalid booking'});
  let b=(await db('coaching_bookings','id=eq.'+body.booking_id+'&user_id=eq.'+user.id))[0];
  if(!b||b.test_mode!==test||!b.order_id) return res.status(404).json({error:'Booking not found in this payment environment.'});
  if(b.status==='confirmed') return res.status(200).json({booking:cleanBooking(b)});
  if(b.status==='cancelled') return res.status(409).json({error:'This booking was cancelled. Contact Mostaed if you have already paid.'});
  if(b.status==='pending_payment'){
   const bookedSlot=(await db('coaching_slots','id=eq.'+b.slot_id))[0];
   if(!bookedSlot||Date.parse(bookedSlot.starts_at)<=Date.now()) return res.status(409).json({error:'This session time has passed. Contact Mostaed before making a payment.'});
   let order=await coachingPaymentRequest('/v2/checkout/orders/'+b.order_id);
   if(order.status==='APPROVED'){
    await coachingPaymentRequest('/v2/checkout/orders/'+b.order_id+'/capture',{method:'POST',headers:{'PayPal-Request-Id':'capture-'+b.id},body:'{}'});
    order=await coachingPaymentRequest('/v2/checkout/orders/'+b.order_id);
   }
   if(!validPayment(order,b)) return res.status(409).json({error:'Payment has not been verified. No meeting has been confirmed.'});
   await db('coaching_bookings','id=eq.'+b.id+'&status=eq.pending_payment',{method:'PATCH',body:JSON.stringify({status:'paid',capture_id:order.purchase_units[0].payments.captures[0].id})});
  }
  const claimed=await db('coaching_bookings','id=eq.'+b.id+'&status=eq.paid',{method:'PATCH',body:JSON.stringify({status:'meeting_creating'})});
  if(!claimed.length) return res.status(202).json({message:'Payment received. Meeting setup is in progress or needs support review. Check My sessions.'});
  const slot=(await db('coaching_slots','id=eq.'+b.slot_id))[0];
  const host=(await db('career_coaches','id=eq.'+slot.coach_id))[0];
  try{
   const meeting=await zoomMeeting(host,slot);
   const rows=await db('coaching_bookings','id=eq.'+b.id,{method:'PATCH',body:JSON.stringify({...meeting,status:'confirmed'})});
   return res.status(200).json({booking:cleanBooking(rows[0]),message:test?'Sandbox payment verified; this is a test booking.':'Session confirmed. Your private Zoom link is in My sessions.'});
  }catch{
   await db('coaching_bookings','id=eq.'+b.id,{method:'PATCH',body:JSON.stringify({status:'meeting_review'})});
   return res.status(202).json({message:'Payment verified. Meeting setup needs support review; you will not be charged again.'});
  }
 }catch(error){
  const safe=/^(Complete the coach|Enter a session price|Enter a valid LinkedIn|Upload a PDF CV|Upload a JPG or PNG|CV storage)/.test(error.message)?error.message:'Career coaching is temporarily unavailable. Please try again or contact Mostaed.';
  return res.status(503).json({error:safe});
 }
}

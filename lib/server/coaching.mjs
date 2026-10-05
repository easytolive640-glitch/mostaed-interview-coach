import {authenticatedUser, serviceRpc} from './paid-access.mjs';
import {paypalRequest} from './paypal.mjs';
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
export function validPayment(order,b){
 const units=order?.purchase_units;
 const captures=units?.[0]?.payments?.captures;
 return Boolean(order?.id===b.order_id && order.status==='COMPLETED' && units?.length===1 && units[0].custom_id===b.id &&
  units[0].amount?.currency_code==='USD' && Math.round(Number(units[0].amount.value)*100)===b.price_cents &&
  captures?.length===1 && captures[0].status==='COMPLETED' && captures[0].amount?.currency_code==='USD' &&
  Math.round(Number(captures[0].amount.value)*100)===b.price_cents && captures[0].id);
}
export const bookingReady=()=>process.env.COACHING_BOOKINGS_ENABLED==='true' && ['live','sandbox'].includes(process.env.PAYPAL_MODE) &&
 Boolean(process.env.PAYPAL_CLIENT_ID&&process.env.PAYPAL_CLIENT_SECRET&&process.env.ZOOM_ACCOUNT_ID&&process.env.ZOOM_CLIENT_ID&&process.env.ZOOM_CLIENT_SECRET);
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
  if(req.method==='GET'&&!req.query?.mine){
   const coaches=await db('career_coaches','status=eq.approved&select=id,name,bio,specialty,languages,price_cents&limit=50');
   const slots=await db('coaching_slots','starts_at=gt.'+encodeURIComponent(new Date(Date.now()+7200000).toISOString())+'&select=id,coach_id,starts_at,duration_minutes&order=starts_at&limit=300');
   const reserved=await db('coaching_bookings','status=neq.cancelled&select=slot_id&limit=10000');
   const taken=new Set(reserved.map(b=>b.slot_id));
   return res.status(200).json({coaches,slots:slots.filter(s=>!taken.has(s.id)&&coaches.some(c=>c.id===s.coach_id)),bookingEnabled:bookingReady(),sandbox:process.env.PAYPAL_MODE!=='live'});
  }
  const user=await authenticatedUser(req);
  if(!user) return res.status(401).json({error:'Sign in to your Mostaed account first.'});
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
    return res.status(200).json({coach,slots,bookings:await details(bookings),coachBookings:await details(coachBookings)});}
   return res.status(200).json({coach:null,slots:[],bookings:await details(bookings),coachBookings:[]});
  }
  if(req.headers.origin && req.headers.origin!==new URL(process.env.COACHING_SITE_URL||'https://mostaed-interview-coach.vercel.app').origin) return res.status(403).json({error:'Use the Mostaed website.'});
  if(!(req.headers['content-type']||'').startsWith('application/json')) return res.status(415).json({error:'JSON required'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
  if(!body||JSON.stringify(body).length>8000) return res.status(400).json({error:'Invalid request'});
  if(body.action==='register'){
   if(coach) return res.status(409).json({error:'Your coach application is already saved.'});
   const profile=validateProfile(body);
   await db('career_coaches','',{method:'POST',body:JSON.stringify({...profile,user_id:user.id,status:'pending'})});
   return res.status(201).json({message:'Application received. Mostaed will review your profile before it appears publicly.'});
  }
  if(body.action==='slot'){
   if(!coach||coach.status!=='approved') return res.status(403).json({error:'Your coach profile must be approved first.'});
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
  const test=process.env.PAYPAL_MODE!=='live';
  if(body.action==='checkout'){
   if(!UUID.test(body.slot_id||'')) return res.status(400).json({error:'Invalid slot'});
   const b=await serviceRpc('reserve_coaching_slot',{p_slot:body.slot_id,p_user:user.id,p_test:test});
   if(b.status!=='pending_payment') return res.status(409).json({error:'This booking is already paid. View it in My sessions.'});
   const origin=new URL(process.env.COACHING_SITE_URL||'https://mostaed-interview-coach.vercel.app').origin;
   const order=await paypalRequest('/v2/checkout/orders',{method:'POST',headers:{'PayPal-Request-Id':b.id},body:JSON.stringify({intent:'CAPTURE',purchase_units:[{custom_id:b.id,description:'Mostaed 30-minute career coaching',amount:{currency_code:'USD',value:(b.price_cents/100).toFixed(2)}}],payment_source:{paypal:{experience_context:{shipping_preference:'NO_SHIPPING',user_action:'PAY_NOW',return_url:origin+'/coaching.html?booking='+b.id,cancel_url:origin+'/coaching.html?cancelled=1'}}}})});
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
   let order=await paypalRequest('/v2/checkout/orders/'+b.order_id);
   if(order.status==='APPROVED'){
    await paypalRequest('/v2/checkout/orders/'+b.order_id+'/capture',{method:'POST',headers:{'PayPal-Request-Id':'capture-'+b.id},body:'{}'});
    order=await paypalRequest('/v2/checkout/orders/'+b.order_id);
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
  const safe=/^(Complete the coach|Enter a session price)/.test(error.message)?error.message:'Career coaching is temporarily unavailable. Please try again or contact Mostaed.';
  return res.status(503).json({error:safe});
 }
}

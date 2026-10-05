const $=id=>document.getElementById(id);
const copy={
 badge:['A PERSON TO HELP YOU MOVE FORWARD','شخص يساعدك على الخطوة القادمة'],title:['Your next career step. One conversation at a time.','خطوتك المهنية القادمة تبدأ بحوار شخصي.'],intro:['Work with a career coach on interview preparation, your CV or a focused career plan.','استعد للمقابلات وحسّن سيرتك الذاتية وخطتك المهنية مع مدرب مهني.'],terms:['30-minute sessions · Price shown per coach · Separate from AI subscriptions','جلسات 30 دقيقة · السعر حسب المدرب · مستقلة عن اشتراك الذكاء الاصطناعي'],account:['Sign in','تسجيل الدخول'],browse:['Explore coaches','استكشف المدربين'],applyLink:['Register as a coach','التسجيل كمدرب'],choose:['Find your coach','اختر مدربك'],chooseBody:['Select a coach, then choose a date and an available time.','اختر المدرب ثم التاريخ والوقت المتاح.'],date:['Choose a date','اختر التاريخ'],paymentNote:['Bookings are confirmed only after verified payment. Zoom links are private to the customer and coach.','يتم تأكيد الحجز بعد التحقق من الدفع. روابط زووم خاصة بالعميل والمدرب.'],sessions:['My sessions','جلساتي'],sessionsBody:['Sign in using your Mostaed account to see bookings and private Zoom links.','سجل الدخول بحساب مستعد لعرض حجوزاتك وروابط زووم الخاصة.'],refresh:['Refresh my sessions','تحديث جلساتي'],applyTitle:['Bring your career expertise to Mostaed.','شارك خبرتك المهنية على مستعد.'],applyBody:['Apply as a coach. Profiles are reviewed before publication; submitting this form does not guarantee approval.','تقدم كمدرب. تتم مراجعة الملفات قبل النشر ولا يضمن إرسال الطلب الموافقة.'],name:['Professional name','الاسم المهني'],specialty:['Coaching specialities','تخصصات التدريب'],languages:['Session languages','لغات الجلسة'],price:['Price per 30-minute session (USD)','سعر جلسة 30 دقيقة بالدولار'],bio:['Experience and coaching approach','الخبرة وطريقة التدريب'],consent:['I agree that my name, bio, specialities, languages and price may appear publicly after approval. Mostaed may contact me about this application through my account email.','أوافق على نشر اسمي ونبذتي وتخصصاتي ولغاتي وسعري بعد الموافقة والتواصل معي بشأن الطلب عبر بريد حسابي.'],coachTerms:['Coach fees, payout terms and a Zoom host account must be agreed with Mostaed before bookings open. Do not include confidential client information.','يجب الاتفاق مع مستعد على الأتعاب والتحويلات وحساب مضيف زووم قبل فتح الحجوزات. لا تُدخل معلومات سرية للعملاء.'],submit:['Submit coach application','إرسال طلب المدرب'],dashboard:['Coach dashboard','لوحة المدرب'],slotTime:['Add a 30-minute time slot (your local timezone)','أضف موعداً لمدة 30 دقيقة بتوقيتك المحلي'],addSlot:['Add availability','إضافة موعد'],coachBookings:['Paid coaching bookings','حجوزات التدريب المدفوعة'],empty:['No approved coaches yet. You can submit a coach application below.','لا توجد ملفات مدربين معتمدة بعد. يمكنك تقديم طلب مدرب أدناه.'],unavailable:['Coaching setup is in progress. Registration and paid booking will open once configured.','إعداد خدمة التدريب جارٍ. سيفتح التسجيل والحجز المدفوع بعد اكتمال الإعداد.'],noSlots:['No available times on this date. Try another date.','لا توجد مواعيد متاحة في هذا التاريخ. جرّب تاريخاً آخر.'],select:['View available times','عرض المواعيد'],pay:['Book & pay','احجز وادفع'],closed:['Paid bookings are not open yet.','الحجوزات المدفوعة لم تُفتح بعد.'],signin:['Sign in to your Mostaed account first, then return to this page.','سجل الدخول بحساب مستعد ثم عد لهذه الصفحة.'],none:['No sessions yet.','لا توجد جلسات حتى الآن.'],join:['Join Zoom meeting','دخول جلسة زووم'],ics:['Add to calendar','إضافة إلى التقويم'],sandbox:['Sandbox test — no real payment','اختبار تجريبي — لا يوجد دفع حقيقي'],busy:['Please wait…','يرجى الانتظار…'],confirmed:['Session confirmed. View the Zoom link in My sessions.','تم تأكيد الجلسة. رابط زووم في جلساتي.'],cancelled:['Checkout was cancelled. Your slot remains reserved; contact Mostaed to release it.','تم إلغاء الدفع. لا يزال الموعد محجوزاً؛ تواصل مع مستعد لتحريره.']};
let lang=localStorage.getItem('mostaed_coaching_language')||'en',data={coaches:[],slots:[]},selected=null,personal=null;
Object.assign(copy,{applicationSignin:['Sign in, then return to submit your application','سجّل الدخول ثم عد لإرسال طلبك'],applicationInvalid:['Complete the required fields and check the consent box before submitting.','أكمل الحقول المطلوبة وحدد مربع الموافقة قبل إرسال الطلب.'],applicationLoading:['Connecting to coach registration…','جارٍ الاتصال بخدمة تسجيل المدربين…'],applicationSending:['Submitting your application…','جارٍ إرسال طلبك…'],applicationSuccess:['Application received. Your profile is pending review.','تم استلام طلبك. ملفك بانتظار المراجعة.']});
Object.assign(copy,{
linkedin:['LinkedIn profile URL','رابط الملف الشخصي على لينكدإن'],
coachCV:['Upload your CV (PDF, up to 1 MB)','ارفع سيرتك الذاتية (PDF حتى 1 ميجابايت)'],
cvPrivacy:['Your CV is private. Only you and Mostaed administrators can access it for review.','سيرتك الذاتية خاصة. يمكن لك ولمسؤولي مستعد فقط الوصول إليها للمراجعة.'],
approvalOwner:['Mostaed administrators review your LinkedIn profile and CV before approving your listing.','يراجع مسؤولو مستعد ملف لينكدإن وسيرتك الذاتية قبل الموافقة على نشر ملفك.'],
viewCV:['View private CV','عرض السيرة الذاتية الخاصة'],
saveCredentials:['Save credentials for review','حفظ المستندات للمراجعة'],
adminReview:['Coach applications · Admin review','طلبات المدربين · مراجعة الإدارة'],
reviewInstructions:['Review experience, LinkedIn and CV yourself. Agree coaching and payout terms and assign a managed Zoom host before approval.','راجع الخبرة ولينكدإن والسيرة بنفسك. اتفق على شروط التدريب والتحويلات وحدد مضيف زووم تابعاً لمستعد قبل الموافقة.'],
reviewRefresh:['Refresh applications','تحديث الطلبات'],
approve:['Approve coach','الموافقة على المدرب'],pause:['Pause application','إيقاف الطلب'],
reviewAttest:['I reviewed the LinkedIn profile and CV and agreed coaching and payout terms.','راجعت ملف لينكدإن والسيرة الذاتية واتُّفق على شروط التدريب والتحويلات.'],
zoomHost:['Managed Zoom host email or user ID','بريد مضيف زووم التابع لمستعد أو رقم المستخدم'],
noApplications:['No applications awaiting review.','لا توجد طلبات بانتظار المراجعة.'],
cvError:['Choose a PDF CV of up to 1 MB.','اختر سيرة ذاتية PDF حتى 1 ميجابايت.']
});
copy.consent=['I agree that my name, bio, specialities, languages, price and LinkedIn link may appear publicly after approval. My CV is used privately by Mostaed for application review.','أوافق على نشر اسمي ونبذتي وتخصصاتي ولغاتي وسعري ورابط لينكدإن بعد الموافقة. تستخدم مستعد سيرتي بشكل خاص لمراجعة الطلب.'];
const t=k=>copy[k]?.[lang==='ar'?1:0]||k;
const say=msg=>$('notice').textContent=msg;
const applicationSay=msg=>{$('applicationNotice').textContent=msg;};
const applicationAuth=()=>{$('applicationAuth').hidden=Boolean(session());};
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
const session=()=>{try{const s=JSON.parse(sessionStorage.getItem('mostaed_account')||'null');return s?.expires_at*1000>Date.now()?s:null;}catch{return null;}};
async function api(body,mine=false){const s=session();const r=await fetch('/api/coaching'+(mine?'?mine=1':''),{method:body?'POST':'GET',headers:{...(s?{Authorization:'Bearer '+s.access_token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();if(!r.ok)throw Error(d.error||t('unavailable'));return d;}
function apply(){document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';$('language').value=lang;document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));applicationAuth();renderCoaches();if(selected)renderSlots();if(personal)renderMine();}
$('language').onchange=()=>{lang=$('language').value;localStorage.setItem('mostaed_coaching_language',lang);apply();};
const money=c=>new Intl.NumberFormat(lang,{style:'currency',currency:'USD'}).format(c/100);
const dateLabel=s=>new Date(s).toLocaleString(lang,{dateStyle:'medium',timeStyle:'short'});
function renderCoaches(){const root=$('coaches');root.replaceChildren();if(!data.coaches.length)root.append(node('p',t('empty')));for(const c of data.coaches){const card=node('article',null,'card');card.append(node('h3',c.name),node('p',c.specialty),node('p',c.bio),node('p',c.languages),node('p',money(c.price_cents)+' / 30 min','price'));const b=node('button',t('select'),'btn secondary');b.onclick=()=>{selected=c;$('calendar').hidden=false;const first=data.slots.find(s=>s.coach_id===c.id);$('date').value=first?localDate(first.starts_at):localDate(new Date());renderSlots();$('calendar').scrollIntoView({behavior:'smooth',block:'start'});};if(c.linkedin_url){const a=node('a','LinkedIn','btn secondary');a.href=c.linkedin_url;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}card.append(b);root.append(card);}}
function localDate(d){const x=new Date(d);return [x.getFullYear(),String(x.getMonth()+1).padStart(2,'0'),String(x.getDate()).padStart(2,'0')].join('-');}
function renderSlots(){$('calendarTitle').textContent=selected.name+' · '+money(selected.price_cents);$('timezone').textContent=Intl.DateTimeFormat().resolvedOptions().timeZone;$('slots').replaceChildren();const rows=data.slots.filter(s=>s.coach_id===selected.id&&localDate(s.starts_at)===$('date').value);if(!rows.length)$('slots').append(node('p',t('noSlots')));for(const s of rows){const b=node('button',new Date(s.starts_at).toLocaleTimeString(lang,{hour:'2-digit',minute:'2-digit'})+' · '+t('pay'),'btn primary');b.disabled=!data.bookingEnabled;b.onclick=async()=>{if(!session())return say(t('signin'));b.disabled=true;say(t('busy'));try{const r=await api({action:'checkout',slot_id:s.id});location.assign(r.url);}catch(e){say(e.message);b.disabled=false;}};$('slots').append(b);}if(!data.bookingEnabled)$('slots').append(node('p',t('closed')));}
$('date').onchange=renderSlots;
function bookingCard(b){const c=node('article',null,'card');c.append(node('h3',b.coach_name||'Mostaed'),node('p',b.starts_at?dateLabel(b.starts_at):b.id),node('p',money(b.price_cents)),node('p',b.status.replaceAll('_',' ')));if(b.test_mode)c.append(node('p',t('sandbox')));if(b.status==='pending_payment'){const verify=node('button',lang==='ar'?'التحقق من الدفع':'Verify payment','btn secondary');verify.onclick=()=>confirm(b.id);c.append(verify);}if(b.status==='confirmed'&&b.zoom_join_url){const a=node('a',t('join'),'btn primary');a.href=b.zoom_join_url;a.target='_blank';a.rel='noopener noreferrer';c.append(a);const ics=node('button',t('ics'),'btn secondary');ics.onclick=()=>downloadCalendar(b);c.append(ics);}return c;}
function renderMine(){$('adminReview').hidden=!personal.isAdmin;$('bookings').replaceChildren(...personal.bookings.map(bookingCard));if(!personal.bookings.length)$('bookings').append(node('p',t('none')));$('dashboard').hidden=!personal.coach;$('application').hidden=Boolean(personal.coach);if(personal.coach){$('credentialUpdate').hidden=personal.coach.status==='approved';$('myCV').hidden=!personal.coach.cv_name;$('profileStatus').textContent=personal.coach.name+' · '+personal.coach.status;$('availability').hidden=personal.coach.status!=='approved';$('coachSlots').replaceChildren(...personal.slots.map(s=>node('p',dateLabel(s.starts_at))));$('coachBookings').replaceChildren(...personal.coachBookings.map(bookingCard));}}
async function mine(){if(!session())return say(t('signin'));try{personal=await api(null,true);renderMine();if(personal.isAdmin)await loadReviews();}catch(e){say(e.message);}}
$('refresh').onclick=mine;
$('application').onsubmit=async e=>{
 e.preventDefault();
 const form=e.target;
 if(!form.checkValidity()){applicationSay(t('applicationInvalid'));form.reportValidity();return;}
 if(!session()){applicationAuth();applicationSay(t('signin'));$('applicationNotice').focus();return;}
 const b=form.querySelector('button');b.disabled=true;b.textContent=t('applicationSending');applicationSay(t('applicationSending'));
 try{await api({action:'register',...await credentialsPayload(form)});applicationSay(t('applicationSuccess'));say(t('applicationSuccess'));form.reset();await mine();}
 catch(e){applicationSay(e.message);$('applicationNotice').focus();}
 finally{b.disabled=false;b.textContent=t('submit');}
};
$('availability').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{const r=await api({action:'slot',starts_at:new Date($('slotTime').value).toISOString()});say(r.message);await mine();await load();}catch(e){say(e.message);}finally{b.disabled=false;}};
async function confirm(id){say(t('busy'));try{const r=await api({action:'confirm',booking_id:id});say(r.message||t('confirmed'));await mine();}catch(e){say(e.message);}}
function downloadCalendar(b){if(!b.starts_at)return;const dt=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');const esc=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Mostaed//Career Coaching//EN','BEGIN:VEVENT','UID:'+b.id+'@mostaed','DTSTAMP:'+dt(Date.now()),'DTSTART:'+dt(b.starts_at),'DTEND:'+dt(Date.parse(b.starts_at)+1800000),'SUMMARY:'+esc('Mostaed career coaching'),'DESCRIPTION:'+esc(b.zoom_join_url),'LOCATION:'+esc(b.zoom_join_url),'END:VEVENT','END:VCALENDAR'];const url=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar'}));const a=node('a');a.href=url;a.download='mostaed-session.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

async function credentialsPayload(form){
 const fields=Object.fromEntries(new FormData(form)),file=fields.cv;
 if(!(file instanceof File)||file.size>1048576||!file.size||!file.name.toLowerCase().endsWith('.pdf'))throw Error(t('cvError'));
 const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error(t('cvError')));reader.readAsDataURL(file);});
 return {...fields,cv:{name:file.name,base64}};
}
async function viewCV(id){
 const r=await api({action:'cv',coach_id:id});
 const a=node('a');a.href=r.url;a.target='_blank';a.rel='noopener noreferrer';a.click();
}
$('myCV').onclick=()=>viewCV(personal.coach.id).catch(e=>say(e.message));
$('credentialUpdate').onsubmit=async e=>{
 e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;$('credentialNotice').textContent=t('busy');
 try{const r=await api({action:'credentials',...await credentialsPayload(e.target)});$('credentialNotice').textContent=r.message;e.target.reset();await mine();}
 catch(err){$('credentialNotice').textContent=err.message;}finally{b.disabled=false;}
};
async function loadReviews(){
 const r=await fetch('/api/coaching?review=1',{headers:{Authorization:'Bearer '+session()?.access_token}}),d=await r.json();
 if(!r.ok){$('reviewNotice').textContent=d.error;return;}
 const root=$('applications');root.replaceChildren();if(!d.applications.length)root.append(node('p',t('noApplications')));
 for(const c of d.applications){
  const card=node('article',null,'card');card.append(node('h3',c.name),node('p',c.specialty),node('p',c.bio),node('p',c.languages),node('p',money(c.price_cents)),node('p',c.status));
  if(c.linkedin_url){const a=node('a','LinkedIn','btn secondary');a.href=c.linkedin_url;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}
  const cv=node('button',t('viewCV'),'btn secondary');cv.type='button';cv.disabled=!c.cv_name;cv.onclick=()=>viewCV(c.id).catch(e=>$('reviewNotice').textContent=e.message);card.append(cv);
  const form=node('form',null,'coaching-form'),hostLabel=node('label',t('zoomHost')),host=node('input');host.name='zoom_host_id';host.required=true;hostLabel.append(host);form.append(hostLabel);
  const attLabel=node('label',null,'full checkbox'),att=node('input');att.type='checkbox';att.required=true;attLabel.append(att,node('span',t('reviewAttest')));form.append(attLabel);
  const approve=node('button',t('approve'),'btn primary');approve.type='submit';form.append(approve);
  form.onsubmit=async e=>{e.preventDefault();approve.disabled=true;try{const r=await api({action:'review',coach_id:c.id,status:'approved',zoom_host_id:host.value.trim(),review_confirmed:att.checked});$('reviewNotice').textContent=r.message;await loadReviews();await load();}catch(err){$('reviewNotice').textContent=err.message;}finally{approve.disabled=false;}};
  const pause=node('button',t('pause'),'btn secondary');pause.type='button';pause.onclick=async()=>{pause.disabled=true;try{const r=await api({action:'review',coach_id:c.id,status:'paused'});$('reviewNotice').textContent=r.message;await loadReviews();}catch(e){$('reviewNotice').textContent=e.message;}finally{pause.disabled=false;}};form.append(pause);card.append(form);root.append(card);
 }
}
$('reviewRefresh').onclick=loadReviews;

async function load(){applicationSay(t('applicationLoading'));try{data=await api();$('application').querySelector('button').disabled=false;applicationSay(session()?'':t('signin'));applicationAuth();renderCoaches();if(data.sandbox&&data.bookingEnabled)say(t('sandbox'));}catch{say(t('unavailable'));applicationSay(t('unavailable'));$('application').querySelector('button').disabled=true;$('coaches').replaceChildren(node('p',t('unavailable')));}}
apply();await load();if(session())await mine();const params=new URLSearchParams(location.search);if(params.get('cancelled'))say(t('cancelled'));if(params.get('booking')){if(session())await confirm(params.get('booking'));else say(t('signin'));}

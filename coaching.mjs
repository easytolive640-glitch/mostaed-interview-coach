import {languages,preferredLanguage,rememberLanguage,normalizeLanguage,translate} from './locales.mjs';
import {coachingCopy as copy} from './coaching-copy.mjs';
import {localizeMessage} from './localized-messages.mjs';
import {syncLanguageLinks} from './language-navigation.mjs';
const $=id=>document.getElementById(id);
let language=preferredLanguage(),lang=languages[language].code,data={coaches:[],slots:[]},selected=null,personal=null;
const t=k=>copy[k]?.[Object.keys(languages).indexOf(language)]||k;
const localMessage=m=>localizeMessage(m,language);
for(const [key,value] of Object.entries(languages)){const option=document.createElement('option');option.value=value.code;option.textContent=value.name;$('language').append(option);}
const noticeSources=new Map();
const showMessage=(id,msg)=>{noticeSources.set(id,msg);$(id).textContent=msg?localMessage(msg):'';};
const say=msg=>showMessage('notice',msg);
const applicationSay=msg=>showMessage('applicationNotice',msg);
const applicationAuth=()=>{$('applicationAuth').hidden=Boolean(session());};
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
const session=()=>{try{const s=JSON.parse(sessionStorage.getItem('mostaed_account')||'null');return s?.expires_at*1000>Date.now()?s:null;}catch{return null;}};
async function api(body,mine=false){const s=session();const r=await fetch('/api/coaching'+(mine?'?mine=1':''),{method:body?'POST':'GET',headers:{...(s?{Authorization:'Bearer '+s.access_token}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(45000)});let d;try{d=await r.json();}catch{throw Error(r.status===413?t('cvError'):t('unavailable'));}if(!r.ok)throw Error(d.error||t('unavailable'));return d;}
function apply(){document.title=t('coachingPageTitle');document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';$('language').value=lang;document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));document.querySelectorAll('[data-t-placeholder]').forEach(el=>el.placeholder=t(el.dataset.tPlaceholder));$('language').setAttribute('aria-label',translate('language',language));syncLanguageLinks(language);applicationAuth();renderCoaches();if(selected)renderSlots();if(personal)renderMine();for(const [id,msg] of noticeSources)showMessage(id,msg);}
$('language').onchange=()=>{lang=$('language').value;language=normalizeLanguage(lang);rememberLanguage(language);apply();if(personal?.isAdmin)loadReviews().catch(e=>say(e.message));};
const money=c=>new Intl.NumberFormat(lang,{style:'currency',currency:'USD'}).format(c/100);
const dateLabel=s=>new Date(s).toLocaleString(lang,{dateStyle:'medium',timeStyle:'short'});
function renderCoaches(){const root=$('coaches');root.replaceChildren();if(!data.coaches.length)root.append(node('p',t('empty')));for(const c of data.coaches){const card=node('article',null,'card');if(c.has_photo){const img=node('img',null,'coach-photo');img.src='/api/coaching?photo='+encodeURIComponent(c.id);img.alt=c.name;img.loading='lazy';card.append(img);}else{card.append(node('div',c.name.trim().slice(0,1),'coach-avatar'));}card.append(node('h3',c.name),node('p',c.specialty),node('p',c.bio.slice(0,240)),node('p',c.languages),node('p',money(c.price_cents)+' / '+t('duration'),'price'));const b=node('button',t('select'),'btn secondary');b.onclick=()=>{selected=c;$('calendar').hidden=false;const first=data.slots.find(s=>s.coach_id===c.id);$('date').value=first?localDate(first.starts_at):localDate(new Date());renderSlots();$('calendar').scrollIntoView({behavior:'smooth',block:'start'});};if(c.linkedin_url){const a=node('a','LinkedIn','btn secondary');a.href=c.linkedin_url;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}card.append(b);root.append(card);}}
function localDate(d){const x=new Date(d);return [x.getFullYear(),String(x.getMonth()+1).padStart(2,'0'),String(x.getDate()).padStart(2,'0')].join('-');}
function renderSlots(){$('calendarTitle').textContent=selected.name+' · '+money(selected.price_cents);$('timezone').textContent=Intl.DateTimeFormat().resolvedOptions().timeZone;$('slots').replaceChildren();const rows=data.slots.filter(s=>s.coach_id===selected.id&&localDate(s.starts_at)===$('date').value);if(!rows.length)$('slots').append(node('p',t('noSlots')));for(const s of rows){const b=node('button',new Date(s.starts_at).toLocaleTimeString(lang,{hour:'2-digit',minute:'2-digit'})+' · '+t('pay'),'btn primary');b.disabled=!data.bookingEnabled;b.onclick=async()=>{if(!session())return say(t('signin'));b.disabled=true;say(t('busy'));try{const r=await api({action:'checkout',slot_id:s.id});location.assign(r.url);}catch(e){say(e.message);b.disabled=false;}};$('slots').append(b);}if(!data.bookingEnabled)$('slots').append(node('p',t('closed')));}
$('date').onchange=renderSlots;
function bookingCard(b){const c=node('article',null,'card');c.append(node('h3',b.coach_name||'Mostaed'),node('p',b.starts_at?dateLabel(b.starts_at):b.id),node('p',money(b.price_cents)),node('p',t(b.status)));if(b.test_mode)c.append(node('p',t('sandbox')));if(b.status==='pending_payment'){const verify=node('button',t('verifyPayment'),'btn secondary');verify.onclick=()=>confirm(b.id);c.append(verify);}if(b.status==='confirmed'&&b.zoom_join_url){const a=node('a',t('join'),'btn primary');a.href=b.zoom_join_url;a.target='_blank';a.rel='noopener noreferrer';c.append(a);const ics=node('button',t('ics'),'btn secondary');ics.onclick=()=>downloadCalendar(b);c.append(ics);}return c;}
function renderMine(){$('adminReview').hidden=!personal.isAdmin;$('bookings').replaceChildren(...personal.bookings.map(bookingCard));if(!personal.bookings.length)$('bookings').append(node('p',t('none')));$('coachApplication').hidden=!personal.coach;$('dashboard').hidden=!(personal.coach?.status==='approved'&&personal.coach?.zoom_host_id);$('adminDashboardLink').hidden=!personal.isAdmin;$('application').hidden=Boolean(personal.coach);if(personal.coach){$('currentCredentials').textContent=personal.coach.cv_name?t('savedCV')+personal.coach.cv_name:t('noSavedCV');$('credentialUpdate').elements.cv.required=!personal.coach.cv_name;const linkedinInput=$('credentialUpdate').elements.linkedin_url;if(!linkedinInput.value)linkedinInput.value=personal.coach.linkedin_url||'';$('credentialUpdate').hidden=personal.coach.status==='approved';$('myCV').hidden=!personal.coach.cv_name;$('profileStatus').textContent=personal.coach.name+' · '+t(personal.coach.status==='approved'&&!personal.coach.zoom_host_id?'awaitingZoom':personal.coach.status);$('availability').hidden=personal.coach.status!=='approved'||!personal.coach.zoom_host_id;$('coachSlots').replaceChildren(...personal.slots.map(s=>node('p',dateLabel(s.starts_at))));$('coachBookings').replaceChildren(...personal.coachBookings.map(bookingCard));}}
async function mine(){if(!session())return say(t('signin'));try{personal=await api(null,true);renderMine();if(personal.isAdmin)await loadReviews();}catch(e){say(e.message);}}
$('refresh').onclick=mine;
$('application').onsubmit=async e=>{
 e.preventDefault();
 const form=e.target;
 if(!form.checkValidity()){applicationSay(t('applicationInvalid'));form.reportValidity();return;}
 if(!session()){applicationAuth();applicationSay(t('signin'));$('applicationNotice').focus();return;}
 const b=form.querySelector('button');b.disabled=true;b.textContent=t('applicationSending');applicationSay(t('applicationSending'));
 try{await api({action:'register',...await credentialsPayload(form)});applicationSay(t('applicationSuccess'));say(t('applicationSuccess'));form.reset();submittedHome();}
 catch(e){applicationSay(e.message);$('applicationNotice').focus();}
 finally{b.disabled=false;b.textContent=t('submit');}
};
$('availability').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{const r=await api({action:'slot',starts_at:new Date($('slotTime').value).toISOString()});say(r.message);await mine();await load();}catch(e){say(e.message);}finally{b.disabled=false;}};
async function confirm(id){say(t('busy'));try{const r=await api({action:'confirm',booking_id:id});say(r.message||t('confirmed'));await mine();}catch(e){say(e.message);}}
function downloadCalendar(b){if(!b.starts_at)return;const dt=d=>new Date(d).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z/,'Z');const esc=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Mostaed//Career Coaching//EN','BEGIN:VEVENT','UID:'+b.id+'@mostaed','DTSTAMP:'+dt(Date.now()),'DTSTART:'+dt(b.starts_at),'DTEND:'+dt(Date.parse(b.starts_at)+1800000),'SUMMARY:'+esc(t('coachingPageTitle')),'DESCRIPTION:'+esc(b.zoom_join_url),'LOCATION:'+esc(b.zoom_join_url),'END:VEVENT','END:VCALENDAR'];const url=URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],{type:'text/calendar'}));const a=node('a');a.href=url;a.download='mostaed-session.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

async function credentialsPayload(form){
 const fields=Object.fromEntries(new FormData(form)),file=fields.cv,photo=fields.photo;
 const read=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error(t('cvError')));reader.readAsDataURL(blob);});
 delete fields.cv;delete fields.photo;
 if(file instanceof File&&file.size){
  if(file.size>1048576||!file.name.toLowerCase().endsWith('.pdf'))throw Error(t('cvError'));
  fields.cv={name:file.name,base64:await read(file)};
 }else if(!personal?.coach?.cv_name)throw Error(t('cvError'));
 if(photo instanceof File&&photo.size){
  if(photo.size>307200||!['image/jpeg','image/png'].includes(photo.type))throw Error(t('photoError'));
  fields.photo={base64:await read(photo)};
 }
 return fields;
}
function submittedHome(){
 sessionStorage.setItem('mostaed_coach_submission','submitted');
 location.assign('/?lang='+language+'#career-coaching');
}
async function viewCV(id,photo=false){
 const r=await api({action:photo?'photo':'cv',coach_id:id});
 const a=node('a');a.href=r.url;a.target='_blank';a.rel='noopener noreferrer';a.click();
}
$('myCV').onclick=()=>viewCV(personal.coach.id).catch(e=>say(e.message));
$('credentialUpdate').onsubmit=async e=>{
 e.preventDefault();const form=e.target,b=form.querySelector('button'),notice=$('credentialNotice');
 const show=message=>{showMessage('credentialNotice',message);notice.scrollIntoView({behavior:'smooth',block:'center'});};
 if(!form.checkValidity()){show(t('credentialsRequired'));form.reportValidity();return;}
 if(!session()){show(t('signin'));return;}
 b.disabled=true;b.textContent=t('credentialsSaving');form.setAttribute('aria-busy','true');show(t('credentialsSaving'));
 try{
  await api({action:'credentials',...await credentialsPayload(form)});
  form.reset();submittedHome();
 }catch(err){show(err.name==='TimeoutError'?t('unavailable'):err.message);notice.focus();}
 finally{b.disabled=false;b.textContent=t('saveCredentials');form.setAttribute('aria-busy','false');}
};
async function loadReviews(){
 const r=await fetch('/api/coaching?review=1',{headers:{Authorization:'Bearer '+session()?.access_token}}),d=await r.json();
 if(!r.ok){showMessage('reviewNotice',d.error);return;}
 const root=$('applications');root.replaceChildren();const test=node('button',t('testEmail'),'btn secondary');test.type='button';test.onclick=async()=>{test.disabled=true;try{const r=await api({action:'alert_test'});showMessage('reviewNotice',r.message);}catch(e){showMessage('reviewNotice',e.message);}finally{test.disabled=false;}};root.append(test);if(!d.applications.length)root.append(node('p',t('noApplications')));
 for(const c of d.applications){
  const card=node('article',null,'card');card.id='application-'+c.id;card.append(node('h3',c.name),node('p',c.specialty),node('p',c.bio),node('p',c.languages),node('p',money(c.price_cents)),node('p',t(c.status)));
  if(c.linkedin_url){const a=node('a','LinkedIn','btn secondary');a.href=c.linkedin_url;a.target='_blank';a.rel='noopener noreferrer';card.append(a);}
  const cv=node('button',t('viewCV'),'btn secondary');cv.type='button';cv.disabled=!c.cv_name;cv.onclick=()=>viewCV(c.id).catch(e=>showMessage('reviewNotice',e.message));card.append(cv);if(c.has_photo){const photo=node('button',t('viewPhoto'),'btn secondary');photo.type='button';photo.onclick=()=>viewCV(c.id,true).catch(e=>showMessage('reviewNotice',e.message));card.append(photo);}
  const form=node('form',null,'coaching-form'),hostLabel=node('label',t('zoomHost')),host=node('input');host.name='zoom_host_id';hostLabel.append(host);
  const attLabel=node('label',null,'full checkbox'),att=node('input');att.type='checkbox';att.required=true;attLabel.append(att,node('span',t('reviewAttest')));form.append(attLabel);
  const approve=node('button',t('approve'),'btn primary');approve.type='submit';form.append(approve);
  form.onsubmit=async e=>{e.preventDefault();approve.disabled=true;try{const r=await api({action:'review',coach_id:c.id,status:'approved',review_confirmed:att.checked});showMessage('reviewNotice',r.message);await loadReviews();await load();}catch(err){showMessage('reviewNotice',err.message);}finally{approve.disabled=false;}};
  const pause=node('button',t('pause'),'btn secondary');pause.type='button';pause.onclick=async()=>{pause.disabled=true;try{const r=await api({action:'review',coach_id:c.id,status:'paused'});showMessage('reviewNotice',r.message);await loadReviews();}catch(e){showMessage('reviewNotice',e.message);}finally{pause.disabled=false;}};form.append(pause);card.append(form);root.append(card);
 }
 const requested=new URLSearchParams(location.search).get('review');if(requested&&/^[0-9a-f-]{36}$/i.test(requested)){const target=document.getElementById('application-'+requested);if(target){target.style.outline='3px solid #7c3aed';target.scrollIntoView({block:'center'});}}
}
$('reviewRefresh').onclick=loadReviews;

async function load(){applicationSay(t('applicationLoading'));try{data=await api();$('application').querySelector('button').disabled=false;applicationSay(session()?'':t('signin'));applicationAuth();renderCoaches();if(data.sandbox&&data.bookingEnabled)say(t('sandbox'));}catch{say(t('unavailable'));applicationSay(t('unavailable'));$('application').querySelector('button').disabled=true;$('coaches').replaceChildren(node('p',t('unavailable')));}}
apply();await load();if(session())await mine();const params=new URLSearchParams(location.search);if(params.get('coach')){selected=data.coaches.find(c=>c.id===params.get('coach'))||null;if(selected){$('calendar').hidden=false;const first=data.slots.find(s=>s.coach_id===selected.id);$('date').value=first?localDate(first.starts_at):localDate(new Date());renderSlots();}}if(params.get('cancelled'))say(t('cancelled'));if(params.get('booking')){if(session())await confirm(params.get('booking'));else say(t('signin'));}

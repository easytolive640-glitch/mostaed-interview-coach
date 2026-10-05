
const root=document.getElementById('approvedCoaches'),select=document.getElementById('landingLanguage');
const languages={english:'en',arabic:'ar',french:'fr',spanish:'es',german:'de'};
const words={empty:['Coach applications are open. Approved profiles will appear here.','تسجيل المدربين متاح. ستظهر الملفات المعتمدة هنا.','Les candidatures sont ouvertes. Les profils approuvés apparaîtront ici.','El registro está abierto. Los perfiles aprobados aparecerán aquí.','Coach-Bewerbungen sind geöffnet. Freigegebene Profile erscheinen hier.'],view:['View available sessions','عرض الجلسات المتاحة','Voir les séances disponibles','Ver sesiones disponibles','Verfügbare Termine ansehen'],error:['The coach directory is temporarily unavailable.','دليل المدربين غير متاح مؤقتاً.','Le répertoire est temporairement indisponible.','El directorio no está disponible temporalmente.','Das Verzeichnis ist vorübergehend nicht verfügbar.']};
let coaches=[],failed=false;
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
function render(){
 const index=Object.keys(languages).indexOf(select.value),i=Math.max(0,index);root.replaceChildren();
 if(!coaches.length){root.append(node('p',words[failed?'error':'empty'][i]));return;}
 for(const c of coaches){
  const card=node('article',null,'card');
  if(c.has_photo){const photo=node('img',null,'coach-photo');photo.src='/api/coaching?photo='+encodeURIComponent(c.id);photo.alt=c.name;photo.loading='lazy';card.append(photo);}
  else card.append(node('div',c.name.trim().slice(0,1),'coach-avatar'));
  card.append(node('h3',c.name),node('p',c.specialty),node('p',c.bio.slice(0,240),'coach-brief'),node('p',c.languages));
  const price=new Intl.NumberFormat(languages[select.value]||'en',{style:'currency',currency:'USD'}).format(c.price_cents/100);
  card.append(node('p',price+' / 30 min'));
  const link=node('a',words.view[i],'btn secondary');link.href='/coaching.html?coach='+encodeURIComponent(c.id)+'#calendar';card.append(link);root.append(card);
 }
}
if(sessionStorage.getItem('mostaed_coach_submission')){document.getElementById('coachSubmissionNotice').hidden=false;sessionStorage.removeItem('mostaed_coach_submission');}
select.addEventListener('change',render);
try{const r=await fetch('/api/coaching');if(!r.ok)throw Error();const d=await r.json();coaches=d.coaches;}catch{failed=true;}
render();

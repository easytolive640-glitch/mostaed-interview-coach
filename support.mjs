import './trust-ui.mjs';
import {trustText} from './trust-copy.mjs';
import {currentLanguage} from './app-localization.mjs';
const form=document.getElementById('supportForm'),notice=document.getElementById('supportNotice'),send=document.getElementById('sendSupport');
let session;
try{session=JSON.parse(sessionStorage.getItem('mostaed_account') || 'null');}catch{}
if(!session?.access_token || session.expires_at*1000<Date.now()){
  form.hidden=true;notice.dataset.trust='signIn';notice.textContent=trustText('signIn',currentLanguage());
}
form.addEventListener('submit',async event=>{
  event.preventDefault();send.disabled=true;
  delete notice.dataset.trust;
  try{
    if(!session?.access_token || session.expires_at*1000<Date.now())throw Error('signIn');
    const response=await fetch('/api/support',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},
      body:JSON.stringify({topic:form.elements.topic.value,message:form.elements.message.value.trim(),consent:form.elements.consent.checked}),signal:AbortSignal.timeout(15000)});
    const result=await response.json();
    if(!response.ok || !result.accepted){notice.textContent=trustText(response.status===401?'signIn':'failed',currentLanguage())+(result.reference?' '+result.reference:'');return;}
    notice.textContent=trustText('sent',currentLanguage())+' '+result.reference;
    form.reset();
  }catch(error){notice.textContent=trustText(error.message==='signIn'?'signIn':'failed',currentLanguage());}
  finally{send.disabled=false;}
});

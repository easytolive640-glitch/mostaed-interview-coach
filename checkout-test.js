import {initLocalization,currentLanguage} from './app-localization.mjs';
import {localizeMessage} from './localized-messages.mjs';
initLocalization();
const $=id=>document.getElementById(id);
let session;
const statusMessages=new Map();
function say(id,message){statusMessages.set(id,message);$(id).removeAttribute('data-i18n');$(id).textContent=localizeMessage(message,currentLanguage());}
document.getElementById('uiLanguage').addEventListener('change',()=>{for(const [id,message] of statusMessages)say(id,message);});
async function api(path,body) {
  if(!session) throw Error('Sign in to Mostaed first.');
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify(body)});
  const data=await response.json(); if(!response.ok) throw Error(data.error || 'Test unavailable'); return data;
}
async function checkCard() {
  try {
    const reference=sessionStorage.getItem('mostaed_paymob_test_reference');
    if(!reference) throw Error('Start a card test first.');
    const d=await api('/api/paymob-test-status',{reference});
    const messages={paid:'Test payment verified by the signed Paymob webhook. No live AI access was granted.',pending:'Waiting for the signed Paymob webhook. Check again shortly.',failed:'Test payment failed. No AI access was granted.',held:'Test payment refunded or voided. No AI access was granted.'};
    say('cardNotice',messages[d.status] || 'Test status unavailable');
  }catch(e){say('cardNotice',e.message);}
}
$('billing').onsubmit=async e=>{
  e.preventDefault();$('cardStart').disabled=true;
  try {
    const billing=Object.fromEntries(new FormData($('billing')));
    const d=await api('/api/paymob-checkout',{billing});
    if(d.testMode!==true) throw Error('Only test checkout is allowed.');
    sessionStorage.setItem('mostaed_paymob_test_reference',d.reference);
    location.assign(d.url);
  }catch(e){say('cardNotice',e.message);$('billing').hidden=false;$('cardStart').disabled=false;}
};
$('cardStatus').onclick=checkCard;

try {
  session=JSON.parse(sessionStorage.getItem('mostaed_account') || 'null');
  if(!session?.access_token || session.expires_at*1000<Date.now()) session=null;
  $('signIn').hidden=Boolean(session);
  const r=await fetch('/api/payment-test-config',{cache:'no-store',signal:AbortSignal.timeout(10000)});const config=await r.json();if(!r.ok) throw Error('Test settings unavailable');
  say('paymobConfig',config.paymobReady?'Test keys detected. Database setup is also required.':'Paymob test credentials are not ready.');
  const canStart=Boolean(session && config.paymobReady);
  $('billing').hidden=!canStart;
  $('cardStart').disabled=!canStart;
  $('cardStatus').hidden=!sessionStorage.getItem('mostaed_paymob_test_reference');
  // Redirect query parameters are never trusted for paid status.
  const params=new URLSearchParams(location.search);const provider=params.get('provider');
  if(location.search) history.replaceState(null,'','/checkout-test.html?lang='+currentLanguage());
  if(session && provider==='paymob') await checkCard();
}catch(e){say('cardNotice',e.message);}

import {initLocalization,currentLanguage} from './app-localization.mjs';
import {localizeMessage} from './localized-messages.mjs';
initLocalization();
const $=id=>document.getElementById(id);
let session,config,pixelLoaded;
const statusMessages=new Map();
function say(id,message){statusMessages.set(id,message);$(id).removeAttribute('data-i18n');$(id).textContent=localizeMessage(message,currentLanguage());}
document.getElementById('uiLanguage').addEventListener('change',()=>{for(const [id,message] of statusMessages)say(id,message);});
async function api(path,body) {
  if(!session) throw Error('Sign in to Mostaed first.');
  const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+session.access_token},body:JSON.stringify(body)});
  const data=await response.json(); if(!response.ok) throw Error(data.error || 'Test unavailable'); return data;
}
async function loadPixel() {
  if(window.Pixel) return;
  pixelLoaded ||= new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.type='module';script.src='https://cdn.jsdelivr.net/npm/paymob-pixel@1.2.7/main.js';
    script.onload=()=>window.Pixel?resolve():reject(Error('Card form SDK did not load.'));script.onerror=()=>reject(Error('Card form could not load. Please reload.'));document.head.append(script);
  });
  return pixelLoaded;
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
    await loadPixel();
    const billing=Object.fromEntries(new FormData($('billing')));
    const d=await api('/api/paymob-checkout',{billing});
    if(d.testMode!==true) throw Error('Only test checkout is allowed.');
    sessionStorage.setItem('mostaed_paymob_test_reference',d.reference);
    $('billing').hidden=true;$('paymob-elements').hidden=false;$('cardStatus').hidden=false;
    new window.Pixel({publicKey:d.publicKey,clientSecret:d.clientSecret,paymentMethods:['card'],elementId:'paymob-elements',showSaveCard:false,forceSaveCard:false,
      customStyle:{Color_Primary:'#6434b8',Radius_Border:'10',Width_of_Container:'100%'},
      afterPaymentComplete:async()=>{await checkCard();}});
    say('cardNotice','Test card form ready. Use Paymob test cards only. Live AI remains locked.');
  }catch(e){say('cardNotice',e.message);$('billing').hidden=false;$('cardStart').disabled=false;}
};
$('cardStatus').onclick=checkCard;

try {
  session=JSON.parse(sessionStorage.getItem('mostaed_account') || 'null');
  if(!session?.access_token || session.expires_at*1000<Date.now()) session=null;
  $('signIn').hidden=Boolean(session);
  const r=await fetch('/api/payment-test-config');config=await r.json();if(!r.ok) throw Error('Test settings unavailable');
  say('paymobConfig',config.paymobReady?'Test keys detected. Database setup is also required.':'Paymob test credentials are not ready.');
  $('cardStart').disabled=!session || !config.paymobReady;
  $('cardStatus').hidden=!sessionStorage.getItem('mostaed_paymob_test_reference');
  // Redirect query parameters are never trusted for paid status.
  const params=new URLSearchParams(location.search);const provider=params.get('provider');const cancelled=params.get('cancelled');
  if(location.search) history.replaceState(null,'','/checkout-test.html?lang='+currentLanguage());
  if(session && provider==='paymob') await checkCard();
}catch(e){say('cardNotice',e.message);}

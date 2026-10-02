const $=id=>document.getElementById(id);
let session,config,pixelLoaded;
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
    $('cardNotice').textContent=messages[d.status] || 'Test status unavailable';
  }catch(e){$('cardNotice').textContent=e.message;}
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
    $('cardNotice').textContent='Test card form ready. Use Paymob test cards only. Live AI remains locked.';
  }catch(e){$('cardNotice').textContent=e.message;$('billing').hidden=false;$('cardStart').disabled=false;}
};
$('cardStatus').onclick=checkCard;
$('paypalStart').onclick=async()=>{
  $('paypalStart').disabled=true;
  try{const d=await api('/api/paypal-sandbox',{action:'create'});sessionStorage.setItem('mostaed_paypal_sandbox_subscription',d.subscriptionId);location.assign(d.url);}
  catch(e){$('paypalNotice').textContent=e.message;$('paypalStart').disabled=false;}
};
async function checkPaypal(){
  try{const d=await api('/api/paypal-sandbox',{action:'verify',subscriptionId:sessionStorage.getItem('mostaed_paypal_sandbox_subscription')});$('paypalNotice').textContent=d.verified?'Sandbox subscription payment verified. No live AI access was granted.':'No completed sandbox subscription payment found yet. Live AI remains locked.';}
  catch(e){$('paypalNotice').textContent=e.message;}
}
$('paypalStatus').onclick=checkPaypal;
try {
  session=JSON.parse(sessionStorage.getItem('mostaed_account') || 'null');
  if(!session?.access_token || session.expires_at*1000<Date.now()) session=null;
  $('signIn').hidden=Boolean(session);
  const r=await fetch('/api/payment-test-config');config=await r.json();if(!r.ok) throw Error('Test settings unavailable');
  $('paymobConfig').textContent=config.paymobReady?'Test keys detected. Database setup is also required.':'Paymob test credentials are not ready.';
  $('paypalConfig').textContent=config.paypalSandboxReady?'Sandbox credentials detected.':'Sandbox is not configured yet. Separate sandbox client ID, secret and USD 7.99 monthly plan ID are required.';
  $('cardStart').disabled=!session || !config.paymobReady;$('paypalStart').disabled=!session || !config.paypalSandboxReady;
  $('cardStatus').hidden=!sessionStorage.getItem('mostaed_paymob_test_reference');
  $('paypalStatus').hidden=!sessionStorage.getItem('mostaed_paypal_sandbox_subscription');
  // Redirect query parameters are never trusted for paid status.
  const params=new URLSearchParams(location.search);const provider=params.get('provider');const cancelled=params.get('cancelled');
  if(location.search) history.replaceState(null,'','/checkout-test.html');
  if(session && provider==='paymob') await checkCard();
  if(session && provider==='paypal') {if(cancelled==='true') $('paypalNotice').textContent='Sandbox checkout cancelled. No AI access was granted.';else await checkPaypal();}
}catch(e){$('cardNotice').textContent=e.message;$('paypalNotice').textContent=e.message;}

const $ = id => document.getElementById(id);
let config, session;
const notice = text => { $('notice').textContent = text; };
function render() { $('login').hidden = Boolean(session); $('member').hidden = !session;
  $('identity').textContent = session?.user?.email || ''; $('subscribe').disabled = !config?.billingEnabled;
}
async function api(path, body) {
  const response = await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token || ''}`}, body:JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw Error(data.error || 'Request unavailable'); return data;
}
async function authenticate(signup) {
  const response = await fetch(`${config.url}/auth/v1/${signup ? 'signup' : 'token?grant_type=password'}`, {
    method:'POST', headers:{apikey:config.key,'Content-Type':'application/json'},
    body:JSON.stringify({email:$('email').value,password:$('password').value}),
  });
  const data = await response.json(); $('password').value = '';
  if (!response.ok) throw Error(data.msg || data.error_description || 'Sign-in failed');
  if (!data.access_token) return notice('Check your email to confirm your account, then sign in.');
  session = data; sessionStorage.setItem('mostaed_account', JSON.stringify(data)); render(); notice('Signed in. Paid AI requires a verified subscription.');
}
$('login').onsubmit = async e => {e.preventDefault();try {await authenticate(false);}catch(e){notice(e.message);}};
$('signup').onclick = async () => {if (!$('login').reportValidity()) return;try{await authenticate(true);}catch(e){notice(e.message);}};
$('logout').onclick = async () => { if(session) await fetch(`${config.url}/auth/v1/logout`,{method:'POST',headers:{apikey:config.key,Authorization:`Bearer ${session.access_token}`}}).catch(()=>{});session=null;sessionStorage.removeItem('mostaed_account');render();notice('Signed out.');};
$('subscribe').onclick = async () => { $('subscribe').disabled=true;try{const d=await api('/api/checkout',{plan:'pro'});sessionStorage.setItem('mostaed_pending_subscription',d.subscriptionId);location.assign(d.url);}catch(e){notice(e.message);$('subscribe').disabled=!config.billingEnabled;}};
$('verify').onclick = async () => {try{const d=await api('/api/subscription',{subscriptionId:sessionStorage.getItem('mostaed_pending_subscription')});notice(d.sandbox?'Sandbox payment verified. Live AI remains disabled.':'Payment verified for your account.');}catch(e){notice(e.message);}};
try{const r=await fetch('/api/account-config');config=await r.json();if(!r.ok)throw Error(config.error);session=JSON.parse(sessionStorage.getItem('mostaed_account')||'null');if(session?.expires_at*1000<Date.now()){session=null;sessionStorage.removeItem('mostaed_account');}render();notice(config.billingEnabled?'Sign in before subscribing.':'Free practice is available. Paid subscriptions are not open yet.');}catch(e){$('login').querySelectorAll('button').forEach(b=>b.disabled=true);notice(e.message);}

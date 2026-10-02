import { createPkce, googleAuthorizeUrl, customerSession } from './google-auth.mjs';
const $ = id => document.getElementById(id);
let config, session, recoveryToken;
const notice = text => { $('notice').textContent = text; };
function render() { $('google').hidden = Boolean(session) || Boolean(recoveryToken); $('googleNotice').hidden = Boolean(session) || Boolean(recoveryToken); $('login').hidden = Boolean(session) || Boolean(recoveryToken); $('member').hidden = !session || Boolean(recoveryToken); $('reset').hidden = !recoveryToken;
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
  session = customerSession(data); sessionStorage.setItem('mostaed_account', JSON.stringify(session)); render(); notice('Signed in. Paid AI requires a verified subscription.');
}
$('login').onsubmit = async e => {e.preventDefault();try {await authenticate(false);}catch(e){notice(e.message);}};
$('signup').onclick = async () => {if (!$('login').reportValidity()) return;try{await authenticate(true);}catch(e){notice(e.message);}};
$('logout').onclick = async () => { if(session) await fetch(`${config.url}/auth/v1/logout`,{method:'POST',headers:{apikey:config.key,Authorization:`Bearer ${session.access_token}`}}).catch(()=>{});session=null;sessionStorage.removeItem('mostaed_account');render();notice('Signed out.');};
$('subscribe').onclick = async () => { $('subscribe').disabled=true;try{const d=await api('/api/checkout',{plan:'pro'});sessionStorage.setItem('mostaed_pending_subscription',d.subscriptionId);location.assign(d.url);}catch(e){notice(e.message);$('subscribe').disabled=!config.billingEnabled;}};
$('verify').onclick = async () => {try{const d=await api('/api/subscription',{subscriptionId:sessionStorage.getItem('mostaed_pending_subscription')});notice(d.sandbox?'Sandbox payment verified. Live AI remains disabled.':'Payment verified for your account.');}catch(e){notice(e.message);}};

$('google').onclick = async () => {
  $('google').disabled = true;
  try {
    const { verifier, challenge } = await createPkce();
    sessionStorage.setItem('mostaed_google_pkce', JSON.stringify({ verifier, created: Date.now() }));
    location.assign(googleAuthorizeUrl(config.url, location.origin + '/account.html', challenge));
  } catch (e) { notice(e.message); $('google').disabled = false; }
};
async function googleCallback() {
  const params = new URLSearchParams(location.search);
  if (params.has('error')) {
    sessionStorage.removeItem('mostaed_google_pkce');
    history.replaceState(null, '', '/account.html');
    throw Error('Google sign-in was cancelled or unavailable. Please try again.');
  }
  const code = params.get('code');
  if (!code) return false;
  const pending = JSON.parse(sessionStorage.getItem('mostaed_google_pkce') || 'null');
  sessionStorage.removeItem('mostaed_google_pkce');
  history.replaceState(null, '', '/account.html');
  if (!pending?.verifier || Date.now() - pending.created > 10 * 60000) throw Error('Google sign-in expired. Please start again in this tab.');
  const r = await fetch(config.url + '/auth/v1/token?grant_type=pkce', {
    method: 'POST', headers: { apikey: config.key, 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_code: code, code_verifier: pending.verifier }),
  });
  const data = await r.json();
  if (!r.ok) throw Error('Google sign-in could not be completed. Please try again.');
  session = customerSession(data);
  sessionStorage.setItem('mostaed_account', JSON.stringify(session));
  return true;
}
try {
  const r=await fetch('/api/account-config'); config=await r.json();
  if(!r.ok) throw Error(config.error);
  const settingsResponse = await fetch(config.url + '/auth/v1/settings', { headers: { apikey: config.key } }).catch(() => ({ok:false}));
  const settings = settingsResponse.ok ? await settingsResponse.json() : {};
  $('google').disabled = settings.external?.google !== true;
  $('googleNotice').textContent = settings.external?.google === true
    ? 'Use your Google account or sign in with email below.'
    : 'Google sign-in is being configured. Email sign-in is available below.';
  session=JSON.parse(sessionStorage.getItem('mostaed_account')||'null');
  if(session?.expires_at*1000<Date.now()){session=null;sessionStorage.removeItem('mostaed_account');}
  const fragment = new URLSearchParams(location.hash.slice(1));
  if (fragment.get('type') === 'recovery') {
    recoveryToken = fragment.get('access_token');
    history.replaceState(null, '', '/account.html');
    if (!recoveryToken) throw Error('Reset link is invalid. Request a new link.');
    session = null; sessionStorage.removeItem('mostaed_account');
    render(); notice('Choose a new password below. / اختر كلمة مرور جديدة');
  }
  const googleSignedIn = await googleCallback();
  render();
  if (!recoveryToken) notice(googleSignedIn ? 'Signed in with Google. Paid AI requires a verified subscription.'
    : config.billingEnabled ? 'Sign in before subscribing.' : 'Free practice is available. Paid subscriptions are not open yet.');
} catch(e) {
  if (!config?.url || !config?.key) $('login').querySelectorAll('button').forEach(b=>b.disabled=true);
  notice(e.message);
}

$('forgot').onclick = async () => {
  if (!$('email').reportValidity()) return;
  $('forgot').disabled = true;
  try {
    const r = await fetch(config.url + '/auth/v1/recover?redirect_to=' + encodeURIComponent(location.origin + '/account.html'), {
      method:'POST', headers:{apikey:config.key,'Content-Type':'application/json'}, body:JSON.stringify({email:$('email').value.trim()})
    });
    if (!r.ok) { const d=await r.json(); throw Error(d.msg || d.message || 'Reset email could not be sent. Please try again later.'); }
    notice('If this email has an account, you will receive a password reset link. Check your inbox and spam folder. / تحقق من بريدك لإعادة تعيين كلمة المرور');
  } catch(e) { notice(e.message); } finally { $('forgot').disabled=false; }
};
$('reset').onsubmit = async e => {
  e.preventDefault();
  if ($('newPassword').value !== $('confirmPassword').value) return notice('Passwords do not match. / كلمتا المرور غير متطابقتين');
  const button=$('reset').querySelector('button'); button.disabled=true;
  try {
    if (!recoveryToken) throw Error('Request a new password reset link.');
    const r=await fetch(config.url + '/auth/v1/user', {method:'PUT',headers:{apikey:config.key,'Content-Type':'application/json',Authorization:'Bearer '+recoveryToken},body:JSON.stringify({password:$('newPassword').value})});
    const d=await r.json(); if (!r.ok) throw Error(d.msg || d.message || 'Reset link expired or password could not be updated. Request a new link.');
    await fetch(config.url + '/auth/v1/logout',{method:'POST',headers:{apikey:config.key,Authorization:'Bearer '+recoveryToken}}).catch(()=>{});
    recoveryToken=null; $('reset').reset(); render(); notice('Password updated. Sign in with your new password. / تم تحديث كلمة المرور');
  } catch(e) { notice(e.message); } finally { button.disabled=false; }
};

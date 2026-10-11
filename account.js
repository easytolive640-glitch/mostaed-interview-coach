import {track} from './funnel-analytics.mjs';
import {localizeMessage} from './localized-messages.mjs';
import {initLocalization,currentLanguage,applyLocale} from './app-localization.mjs';
import {translate} from './locales.mjs';
initLocalization();
import { createPkce, googleAuthorizeUrl, customerSession } from './google-auth.mjs';
const $ = id => document.getElementById(id);
let selectedPlan=new URLSearchParams(location.search).get('plan')==='starter'?'starter':'pro';
let config, session, recoveryToken, creatingAccount = false;
let noticeSource='';
const notice = text => { noticeSource=text; $('notice').removeAttribute('data-i18n');$('notice').textContent = localizeMessage(text,currentLanguage()); };
document.getElementById('uiLanguage').addEventListener('change',()=>{if(noticeSource)notice(noticeSource);if(config)render();});
function render() { $('google').hidden = Boolean(session) || Boolean(recoveryToken); $('googleNotice').hidden = Boolean(session) || Boolean(recoveryToken); $('login').hidden = Boolean(session) || Boolean(recoveryToken); $('member').hidden = !session || Boolean(recoveryToken); $('reset').hidden = !recoveryToken;
  $('identity').textContent = [session?.user?.full_name, session?.user?.username ? '@'+session.user.username : '', session?.user?.email].filter(Boolean).join(' · '); $('subscribe').disabled = !config?.plans?.[selectedPlan]?.available; $('planAvailability').textContent=translate(config?.plans?.[selectedPlan]?.available?'planReady':'planUnavailable',currentLanguage());
}
async function checkLoginAlert() {
  if(!session?.access_token)return;
  // Notification failures never prevent sign-in or practice.
  try { await api('/api/account-config?login_alert=1',{}); } catch {}
}
async function api(path, body) {
  const response = await fetch(path, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${session?.access_token || ''}`}, body:JSON.stringify(body) });
  const data = await response.json(); if (!response.ok) throw Error((data.error || 'Request unavailable') + (data.reference ? ' · Reference: '+data.reference : '')); return data;
}
function signupMode(enabled) {
  creatingAccount=enabled; $('signupFields').hidden=!enabled; $('signupFields').disabled=!enabled;
  $('confirmLabel').hidden=!enabled; $('signupConfirm').disabled=!enabled;
  $('signup').hidden=enabled; $('backLogin').hidden=!enabled; $('forgot').hidden=enabled;
  $('authSubmit').dataset.i18n=enabled?'signup':'signIn';applyLocale();
  $('password').autocomplete=enabled?'new-password':'current-password';
  $('password').value=''; $('signupConfirm').value='';
  notice(enabled?'Fill in your details to create your Mostaed account. / أدخل بياناتك لإنشاء الحساب':'Sign in with your email and password.');
}
async function authenticate(signup) {
  if(signup && $('password').value!==$('signupConfirm').value) throw Error('Passwords do not match. / كلمتا المرور غير متطابقتين');
  const body={email:$('email').value.trim(),password:$('password').value};
  if(signup) body.data={full_name:$('fullName').value.trim(),username:$('username').value.trim(),gender:$('gender').value||null,age:$('age').value?Number($('age').value):null};
  if(signup && (!body.data.full_name || !/^[A-Za-z0-9_]{3,30}$/.test(body.data.username))) throw Error('Enter your full name and a valid username.');
  const response = await fetch(signup ? `${config.url}/auth/v1/signup` : '/api/account-config', {
    method:'POST', headers:{...(signup ? {apikey:config.key} : {}),'Content-Type':'application/json'},
    body:JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.msg || data.error_description || data.error || 'Sign-in failed');
  if(signup)track('sign_up',{method:'password'});
  if (!data.access_token) { signupMode(false); return notice('Check your email to confirm your account, then sign in. / أكد بريدك الإلكتروني ثم سجل الدخول'); }
  track('login',{method:'password'});session = customerSession(data); sessionStorage.setItem('mostaed_account', JSON.stringify(session)); void checkLoginAlert(); render(); notice('Signed in. Paid AI requires a verified subscription.');
}
$('login').onsubmit = async e => {
  e.preventDefault();
  if ($('authSubmit').disabled) return;
  $('authSubmit').disabled = true;
  notice('Signing in… / جارٍ تسجيل الدخول');
  try { await authenticate(creatingAccount); }
  catch(e) { notice(e.name === 'TimeoutError' || e.name === 'AbortError'
    ? 'Sign-in timed out. Please try again. / انتهت مهلة تسجيل الدخول، حاول مجدداً'
    : e instanceof TypeError ? 'Could not connect to the account service. Please try again. / تعذر الاتصال بخدمة الحساب'
    : e.message); }
  finally { $('password').value = ''; $('signupConfirm').value = ''; $('authSubmit').disabled = false; }
};
$('signup').onclick = () => signupMode(true);
$('backLogin').onclick = () => signupMode(false);
$('logout').onclick = async () => { if(session) await fetch(`${config.url}/auth/v1/logout`,{method:'POST',headers:{apikey:config.key,Authorization:`Bearer ${session.access_token}`}}).catch(()=>{});session=null;sessionStorage.removeItem('mostaed_account');render();notice('Signed out.');};
$('subscribe').onclick = async () => { $('subscribe').disabled=true;try{track('begin_checkout',{plan:selectedPlan});const d=await api('/api/checkout',{plan:selectedPlan});track('checkout_redirected',{plan:selectedPlan});sessionStorage.setItem('mostaed_pending_subscription',d.subscriptionId);location.assign(d.url);}catch(e){track('checkout_failed',{stage:'checkout'});notice(e.message);render();}};
$('billingPlan').value=selectedPlan;
$('billingPlan').onchange=()=>{selectedPlan=$('billingPlan').value;render();};
$('verify').onclick = async () => {try{const d=await api('/api/subscription',{subscriptionId:sessionStorage.getItem('mostaed_pending_subscription')});track('payment_verified',{environment:d.sandbox?'sandbox':'live'});notice(d.sandbox?'Sandbox payment verified. Live AI remains disabled.':'Payment verified for your account.');}catch(e){track('checkout_failed',{stage:'verification'});notice(e.message);}};

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
  const settingsResponse = await fetch('/api/account-config?settings=1', { signal: AbortSignal.timeout(15000) }).catch(() => ({ok:false}));
  const settings = settingsResponse.ok ? await settingsResponse.json() : {};
  $('google').disabled = settings.external?.google !== true;
  $('googleNotice').dataset.i18n = settings.external?.google === true ? 'googleHelp' : 'googleUnavailable';
  applyLocale();
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
  const googleSignedIn = await googleCallback();if(googleSignedIn)track('login',{method:'google'});
  render();
  if(session&&!recoveryToken)void checkLoginAlert();
  if (!recoveryToken) notice(googleSignedIn ? 'Signed in with Google. Paid AI requires a verified subscription.'
    : config.billingEnabled ? 'Sign in before subscribing.' : 'Free practice is available. Paid subscriptions are not open yet.');
  if(session && new URLSearchParams(location.search).get('login_alert_test')==='1') {
    history.replaceState(null,'','/account.html');
    const result=await api('/api/account-config?login_alert=1',{action:'test'});
    notice(result.message);
  }
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

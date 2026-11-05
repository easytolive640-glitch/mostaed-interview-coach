import {initAssessmentRecording} from './assessment-recording.mjs';
import {initAssessmentFocus} from './assessment-focus.mjs?v=attempt-limits-1';
import {initAssessmentCamera} from './assessment-camera.mjs';
import {track} from './funnel-analytics.mjs';
import {localizeMessage} from './localized-messages.mjs';
import {initLocalization,applyLocale,currentLanguage} from './app-localization.mjs';
import {languages,translate} from './locales.mjs';
initLocalization();
import { paidQuestions } from './practice-questions.mjs';
import { renderEvaluation } from './evaluation-report.mjs?v=pdf-export-1';
const $=id=>document.getElementById(id);
let attemptId, focusGuard, assessmentFinished=false, terminationReported=false, assessmentExpired=false, submitting=false, frozenSubmission=null, pendingSubmission=null, clockInterval;
const terminationKey=()=>`mostaed_terminated_${session?.email||session?.user?.id||'account'}${session?.email?.trim().toLowerCase()==='kat.nin81@gmail.com'?'_reset_20261101_173018':''}`;
function reportTermination(){
  if(assessmentFinished||assessmentExpired||terminationReported||!session)return;
  terminationReported=true;
  try{localStorage.setItem(terminationKey(),'pending');}catch{}
  void fetch('/api/account-config?assessment=1',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({action:'terminate'})}).then(r=>{if(r.ok){try{localStorage.setItem(terminationKey(),'confirmed');}catch{}}else terminationReported=false;}).catch(()=>{terminationReported=false;});
}
const cameraRecording=initAssessmentRecording({video:$('cameraPreview'),status:$('recordingStatus'),onFailure:()=>focusGuard?.leave()});
const camera=initAssessmentCamera({video:$('cameraPreview'),button:$('openCamera'),status:$('cameraStatus'),submit:$('submit'),consent:$('cameraConsent'),canSubmit:()=>!assessmentExpired&&!assessmentFinished&&!!focusGuard?.canSubmit()&&cameraRecording.active,onAvailabilityChange:ready=>{focusGuard?.refresh();if(!ready&&focusGuard?.started&&!assessmentExpired&&!assessmentFinished){cameraRecording.reset();focusGuard.leave();}}});
focusGuard=initAssessmentFocus({start:$('startAssessment'),restart:$('restartAssessment'),status:$('focusStatus'),questions:$('questionFields'),questionExtras:[$('voiceQuestion')],cameraReady:()=>camera.isReady(),beforeStart:reserveStart,onStarted:startAssessmentClock,onStartError:error=>notice(error.message),onChange:()=>{camera.requireCamera();if(focusGuard?.invalid)reportTermination();},onRestart:()=>{cameraRecording.reset();renderQuestions();$('result').hidden=true;}});
let deadline=null, assessmentMinutes=60;
const topUpParams = new URLSearchParams(location.search);
const extraStatus = message => { $('extraAttemptStatus').textContent = message; };
let checkoutReference;
const pendingTopupKey = () => 'mostaed_pending_topup_' + (session?.user?.id || session?.email || 'account');
const pendingTopup = () => {
 if (topUpParams.has('topup') && topUpParams.has('token')) {
  return {reference:topUpParams.get('topup'),orderId:topUpParams.get('token')};
 }
 try { return JSON.parse(localStorage.getItem(pendingTopupKey()) || 'null'); }
 catch { return null; }
};
$('buyExtraAttempt').onclick = async () => {
 const button = $('buyExtraAttempt');
 button.disabled = true;
 try {
  checkoutReference ||= crypto.randomUUID();
  const {url,orderId} = await api('/api/account-config?topup=1',{action:'create',reference:checkoutReference});
  try { localStorage.setItem(pendingTopupKey(),JSON.stringify({reference:checkoutReference,orderId})); } catch {}
  location.assign(url);
 } catch (error) { extraStatus(error.message); }
 finally { button.disabled = false; }
};
$('verifyExtraAttempt').onclick = async () => {
 const button = $('verifyExtraAttempt');
 button.disabled = true;
 try {
  const order = pendingTopup();
  if (!order) return;
  await api('/api/account-config?topup=1',{action:'confirm',...order});
  try { localStorage.removeItem(pendingTopupKey()); } catch {}
  topUpParams.delete('topup');
  topUpParams.delete('token');
  history.replaceState(null,'',location.pathname);
  button.hidden = true;
  extraStatus('One extra test start added. / تمت إضافة محاولة اختبار واحدة.');
 } catch (error) { extraStatus(error.message); }
 finally { button.disabled = false; }
};
function freezeInputs(){for(const el of $('practice').querySelectorAll('textarea,input,select,button'))el.disabled=true;}
function tickAssessment(){
 if(deadline===null||assessmentFinished||assessmentExpired)return;
 const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
 $('assessmentTime').textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
 if(!seconds){assessmentExpired=true;clearInterval(clockInterval);freezeInputs();if(submitting){frozenSubmission=pendingSubmission;return;}void submitAssessment(true);}
}
async function reserveStart(){
 if(!cameraRecording.start())return false;
 try {
  attemptId ||= crypto.randomUUID();
  await api('/api/account-config?assessment=1',{action:'start',attemptId});
  if(document.visibilityState==='visible'&&camera.isReady()&&cameraRecording.active)return true;
  throw Error('Keep this tab visible and the camera on to start the test. / أبقِ التبويب ظاهراً والكاميرا تعمل لبدء الاختبار.');
 } catch(error) {
  cameraRecording.reset();
  throw error;
 }
}
function startAssessmentClock(){if(!focusGuard.canSubmit()||deadline!==null)return;deadline=Date.now()+assessmentMinutes*60000;for(const id of ['language','category','level'])$(id).disabled=true;tickAssessment();clockInterval=setInterval(()=>{if(focusGuard.invalid||assessmentFinished)clearInterval(clockInterval);else tickAssessment();},250);}
$('practice').addEventListener('beforeinput',e=>{tickAssessment();if(assessmentExpired||assessmentFinished)e.preventDefault();},true);
for(const event of ['copy','cut','paste','drop','dragstart']) $('questions').addEventListener(event,e=>{e.preventDefault();});
$('questions').addEventListener('beforeinput',e=>{if(['insertFromPaste','insertFromDrop','insertFromYank'].includes(e.inputType))e.preventDefault();});
let practiceTracked=false;
$('practice').addEventListener('input',e=>{if(!practiceTracked&&e.target.tagName==='TEXTAREA'&&e.target.id.startsWith('answer')&&e.target.value.trim()){practiceTracked=true;track('paid_practice_started',{category:$('category').value,language:$('language').value});}});
let questionCount=15;
let session, questions, recording, stream, timer, voiceBlob, voiceUrl, voiceGeneration=0, selectedCategory, selectedLanguage, selectedLevel;
let noticeSource='';
const notice=text=>{noticeSource=text;$('notice').removeAttribute('data-i18n');$('notice').textContent=typeof text==='function'?text():localizeMessage(text,currentLanguage());};
const voiceQuestions=Object.fromEntries(Object.keys(languages).map(language=>[language,translate('voiceQuestion',language)]));
async function api(path,body){if(!session || session.expires_at*1000<Date.now())throw Error(translate('signInAgain',currentLanguage()));const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw Error(d.error||'Request unavailable');return d;}
function renderQuestions(){selectedCategory=$('category').value;selectedLanguage=$('language').value;selectedLevel=$('level').value;questions=paidQuestions($('category').value,new Date(),selectedLevel).slice(0,questionCount);$('questions').replaceChildren();applyLocale(selectedLanguage);for(const [i,q] of questions.entries()){const section=document.createElement('section');section.className='card';const label=document.createElement('label');label.textContent=`${i+1}. ${(q[$('language').value]||q.english)}`;const input=document.createElement('textarea');input.id=`answer${i}`;input.minLength=2;input.maxLength=2000;input.required=true;label.htmlFor=input.id;section.append(label,input);$('questions').append(section);}$('voiceQuestion').textContent=voiceQuestions[$('language').value];clearVoice();}
function clearVoice(){voiceGeneration++;$('record').disabled=false;$('stop').disabled=true;if(recording?.state==='recording')recording.stop();clearTimeout(timer);stream?.getTracks().forEach(t=>t.stop());voiceBlob=null;if(voiceUrl)URL.revokeObjectURL(voiceUrl);voiceUrl=null;$('playback').hidden=true;$('voiceFile').value='';}
function setVoice(blob){if(blob.size>2000000)throw Error('Recording is larger than 2 MB. Please record a shorter answer.');if(voiceUrl)URL.revokeObjectURL(voiceUrl);voiceBlob=blob;voiceUrl=URL.createObjectURL(blob);$('playback').src=voiceUrl;$('playback').hidden=false;}
$('record').onclick=async()=>{try{if(!navigator.mediaDevices||!window.MediaRecorder||!MediaRecorder.isTypeSupported('audio/webm'))throw Error('Recording is unavailable here. Upload a WAV/WebM/MP4 file instead.');clearVoice();stream=await navigator.mediaDevices.getUserMedia({audio:true});const generation=voiceGeneration;const chunks=[];recording=new MediaRecorder(stream,{mimeType:'audio/webm',audioBitsPerSecond:64000});recording.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recording.onstop=()=>{if(generation!==voiceGeneration)return;clearTimeout(timer);stream.getTracks().forEach(t=>t.stop());$('record').disabled=false;$('stop').disabled=true;try{setVoice(new Blob(chunks,{type:'audio/webm'}));notice('Recording ready. Play it back before submitting.');}catch(e){notice(e.message);}};recording.start();$('record').disabled=true;$('stop').disabled=false;timer=setTimeout(()=>{if(recording.state==='recording')recording.stop();},60000);notice('Recording…');}catch(e){stream?.getTracks().forEach(t=>t.stop());notice(e.message);}};
$('stop').onclick=()=>{if(recording?.state==='recording')recording.stop();};
$('clearVoice').onclick=clearVoice;
$('voiceFile').onchange=async()=>{try{const file=$('voiceFile').files[0];if(!file)return;const ext=file.name.split('.').pop().toLowerCase();if(!['wav','webm','mp4'].includes(ext))throw Error('Choose WAV, WebM or MP4.');setVoice(new Blob([file],{type:{wav:'audio/wav',webm:'audio/webm',mp4:'audio/mp4'}[ext]}));notice('Voice answer ready. Play it back before submitting / الإجابة الصوتية جاهزة.');}catch(e){voiceBlob=null;$('playback').hidden=true;notice(e.message);}};
$('cvFile').onchange=async()=>{try{const f=$('cvFile').files[0];if(!f)return;if(f.size>24000||!f.name.toLowerCase().endsWith('.txt'))throw Error('Choose a small .txt CV file.');const text=await f.text();if(text.length>6000)throw Error('Use up to 6000 characters of relevant CV text.');$('cv').value=text;}catch(e){notice(e.message);}};
for(const id of ['language','category','level'])$(id).onchange=()=>{if($('questions').querySelectorAll('textarea').length && Array.from($('questions').querySelectorAll('textarea')).some(x=>x.value) && !confirm(translate('changeWarning',selectedLanguage))){$('level').value=selectedLevel;$('category').value=selectedCategory;$('language').value=selectedLanguage;applyLocale(selectedLanguage);return;}renderQuestions();if(noticeSource)notice(noticeSource);};
$('practice').onsubmit=e=>{e.preventDefault();tickAssessment();if(!assessmentExpired)void submitAssessment(false);};
async function submitAssessment(timedOut=false){if(submitting||assessmentFinished)return;if(!timedOut&&(!focusGuard.canSubmit()||!camera.requireCamera()))return; if(recording?.state==='recording'){if(!timedOut)return notice('Stop recording before submitting.');voiceGeneration++;recording.stop();stream?.getTracks().forEach(t=>t.stop());}if(!timedOut&&$('voiceFile').files.length && !voiceBlob)return notice('The selected audio was not accepted. Choose WAV, WebM or MP4 before submitting.');let cv=$('cv').value.trim();if(timedOut&&(cv.length<30||!$('consent').checked))cv='';if(cv&&(cv.length<30||!$('consent').checked))return notice('Provide at least 30 characters of CV text and tick consent, or leave CV blank.');submitting=true;track('evaluation_submitted',{category:$('category').value,language:$('language').value});camera.setBusy(true);notice(translate('evaluating',currentLanguage()));try{const body=frozenSubmission||{attemptId,timedOut,cameraReview:cameraRecording.evidence(),level:selectedLevel,category:$('category').value,language:$('language').value,responses:questions.map((q,i)=>({questionId:q.id,question:(q[$('language').value]||q.english),answer:$(`answer${i}`).value.trim()})),...(cv?{cvText:cv,cvConsent:true}:{})};pendingSubmission=body;if(voiceBlob&&!frozenSubmission){const bytes=new Uint8Array(await voiceBlob.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));body.voice={question:voiceQuestions[$('language').value],format:voiceBlob.type.includes('wav')?'wav':voiceBlob.type.includes('mp4')?'mp4':'webm',data:btoa(binary)};}if(timedOut&&!frozenSubmission){frozenSubmission=structuredClone(body);cameraRecording.finish();}if(!timedOut&&(!focusGuard.canSubmit()||!camera.requireCamera()))throw Error('Enable your camera before submitting / شغّل الكاميرا قبل الإرسال');const d=await api('/api/evaluate',body);assessmentFinished=true;clearInterval(clockInterval);freezeInputs();cameraRecording.finish();focusGuard.refresh();track('evaluation_completed',{category:body.category,language:body.language});$('result').replaceChildren();renderEvaluation($('result'),d,body.language,d.category||body.category);$('result').hidden=false;$('result').scrollIntoView({behavior:'smooth'});notice((timedOut?'Time finished. Submitted with unanswered questions left blank. / انتهى الوقت وأُرسل التقييم مع ترك الأسئلة غير المجابة فارغة.\n':'')+translate(d.historySaved?'saved':'notSaved',body.language));}catch(e){track('evaluation_failed',{stage:'evaluation'});notice((assessmentExpired?'Time finished. Answers locked. Retry submitting the same answers. / انتهى الوقت والإجابات مقفلة. أعد إرسال نفس الإجابات.\n':'')+e.message);}finally{submitting=false;camera.setBusy(false);if(assessmentExpired||assessmentFinished)freezeInputs();if(assessmentExpired&&!assessmentFinished&&frozenSubmission){$('retrySubmission').hidden=false;$('retrySubmission').disabled=false;}}}
$('retrySubmission').onclick=()=>void submitAssessment(true);
window.addEventListener('pagehide',()=>{cameraRecording.reset();stream?.getTracks().forEach(t=>t.stop());});
try{session=JSON.parse(sessionStorage.getItem('mostaed_account')||'null');const r=await fetch('/api/account-config');const config=await r.json();if(!r.ok||!config.aiEnabled)throw Error('Paid AI is not open yet. Free practice remains available from the home page.');const pending=(()=>{try{return localStorage.getItem(terminationKey());}catch{return null;}})();if(pending==='pending')await api('/api/account-config?assessment=1',{action:'terminate'});const state=await api('/api/account-config?assessment=1',{action:'status'});if(state.terminated){focusGuard.terminate();throw Error('Assessment terminated. Restarting is not allowed. Contact support / تم إنهاء التقييم ولا يُسمح بإعادة البدء. تواصل مع الدعم');}try{localStorage.removeItem(terminationKey());}catch{}const d=await api('/api/subscription',{});if(!d.active)throw Error('An active paid subscription is required.');assessmentMinutes=d.plan==='pro'?90:60;$('assessmentTime').textContent=`${assessmentMinutes}:00`;questionCount=d.questions || (d.plan==='starter'?10:15);renderQuestions();$('practice').hidden=false;if(!d.testAccess){$('buyExtraAttempt').hidden=false;if(pendingTopup()){$('verifyExtraAttempt').hidden=false;if(topUpParams.has('topup'))void $('verifyExtraAttempt').onclick();}}track('paid_practice_ready');notice(d.testAccess ? ()=>translate('temporaryAccess',currentLanguage(),{limit:d.limit,date:new Date(d.expiresAt).toLocaleString(languages[currentLanguage()].code)}) : translate(d.plan==='starter'?'starterAccess':'proAccess',currentLanguage()));}catch(e){track('paid_access_blocked',{stage:'access'});notice(e.message);}

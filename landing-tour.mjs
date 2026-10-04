import {languages,preferredLanguage} from './locales.mjs';
import {landingCopy} from './landing-copy.mjs';
const button=document.getElementById('voiceTour');
const status=document.getElementById('tourStatus');
let active=false;
function reset(){active=false;button.setAttribute('aria-pressed','false');button.querySelector('.state-icon').textContent='▶';}
function stop(){if('speechSynthesis' in window)window.speechSynthesis.cancel();reset();}
button.addEventListener('click',()=>{
 const language=preferredLanguage();const index=Object.keys(languages).indexOf(language);
 if(!('speechSynthesis' in window)){status.textContent=landingCopy.audioUnavailable[index];return;}
 if(active){stop();return;}
 const speech=new SpeechSynthesisUtterance([landingCopy.tourTitle[index],landingCopy.step1[index],landingCopy.step2[index],landingCopy.step3[index]].join('. '));
 speech.lang=languages[language].code;speech.rate=.92;
 speech.onend=reset;speech.onerror=()=>{reset();status.textContent=landingCopy.audioUnavailable[index];};
 window.speechSynthesis.cancel();status.textContent='';active=true;button.setAttribute('aria-pressed','true');button.querySelector('.state-icon').textContent='■';window.speechSynthesis.speak(speech);
});
document.getElementById('landingLanguage').addEventListener('change',()=>{stop();status.textContent='';});
window.addEventListener('pagehide',stop);

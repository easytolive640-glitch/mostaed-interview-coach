import {languages,translate,preferredLanguage,rememberLanguage} from './locales.mjs';
import {landingCopy} from './landing-copy.mjs';
const select=document.getElementById('landingLanguage');
function apply(){const language=select.value;const index=Object.keys(languages).indexOf(language);document.documentElement.lang=languages[language].code;document.documentElement.dir=language==='arabic'?'rtl':'ltr';rememberLanguage(language);
  for(const el of document.querySelectorAll('[data-copy]'))el.textContent=landingCopy[el.dataset.copy][index];
  for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=translate(el.dataset.i18n,language);
  select.setAttribute('aria-label',translate('language',language));
  for(const link of document.querySelectorAll('a[data-copy="startFree"]')){const url=new URL(link.href);url.searchParams.set('lang',language);link.href=url.href;}
  document.title=['Mostaed | AI Interview Coach & Free Interview Practice','مستعد | تدريب مقابلات العمل وتقييم بالذكاء الاصطناعي','Mostaed | Entraînement aux entretiens et coaching IA','Mostaed | Práctica de entrevistas y orientación con IA','Mostaed | Vorstellungsgespräche üben mit KI'][index];
}
select.value=preferredLanguage();select.addEventListener('change',apply);apply();

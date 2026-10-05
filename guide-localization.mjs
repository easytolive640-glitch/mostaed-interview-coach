import {languages,preferredLanguage,rememberLanguage,translate} from './locales.mjs';
import {guideCopy} from './guide-copy.mjs';
import {syncLanguageLinks} from './language-navigation.mjs';
export function applyGuideCards(language){
  const index=Object.keys(languages).indexOf(language);
  for(const el of document.querySelectorAll('[data-guide]')){
    const text=guideCopy[el.dataset.guide]?.[index];if(text)el.textContent=text;
    el.removeAttribute('lang');el.removeAttribute('dir');
    if(el.closest('article.card')){el.closest('article.card').removeAttribute('lang');el.closest('article.card').removeAttribute('dir');}
  }
}
if(document.documentElement.dataset.guidePage){
 const nav=document.querySelector('main.guide nav'),label=document.createElement('label'),select=document.createElement('select');
 label.className='guide-language';select.id='guideLanguage';label.append(select);nav.append(label);
 for(const [key,value] of Object.entries(languages)){const option=document.createElement('option');option.value=key;option.textContent=value.name;select.append(option);}
 function apply(){
  const language=select.value,index=Object.keys(languages).indexOf(language),page=document.documentElement.dataset.guidePage;
  document.documentElement.lang=languages[language].code;document.documentElement.dir=language==='arabic'?'rtl':'ltr';rememberLanguage(language);
  select.setAttribute('aria-label',translate('language',language));nav.setAttribute('aria-label',translate('mainNavigation',language));applyGuideCards(language);syncLanguageLinks(language);
  document.title=guideCopy[page==='guides'?'guides':page+'Title'][index]+' | Mostaed';
 }
 select.value=preferredLanguage();select.addEventListener('change',apply);apply();
}

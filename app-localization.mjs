import {syncLanguageLinks} from './language-navigation.mjs';
import {languages,translate,preferredLanguage,rememberLanguage,normalizeLanguage} from './locales.mjs';
export function currentLanguage(){return normalizeLanguage(document.getElementById('language')?.value||document.getElementById('uiLanguage')?.value||preferredLanguage());}
export function applyLocale(language=currentLanguage()){
  language=normalizeLanguage(language);document.documentElement.lang=languages[language].code;document.documentElement.dir=language==='arabic'?'rtl':'ltr';rememberLanguage(language);syncLanguageLinks(language);
  for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=translate(el.dataset.i18n,language);
  for(const el of document.querySelectorAll('[data-i18n-placeholder]'))el.placeholder=translate(el.dataset.i18nPlaceholder,language);
  if(document.documentElement.dataset.i18nTitle)document.title=translate(document.documentElement.dataset.i18nTitle,language);
  for(const el of document.querySelectorAll('body [data-i18n-title]'))el.title=translate(el.dataset.i18nTitle,language);
  for(const el of document.querySelectorAll('[data-i18n-label]'))el.setAttribute('aria-label',translate(el.dataset.i18nLabel,language));
}
export function initLocalization(){
  let select=document.getElementById('language');const practice=Boolean(select);
  if(!select){const nav=document.querySelector('.app-nav');if(!nav)return;const label=document.createElement('label');label.className='app-locale';const span=document.createElement('span');span.dataset.i18n='language';label.append(span);select=document.createElement('select');select.id='uiLanguage';select.dataset.i18nLabel='language';label.append(select);nav.append(label);}
  select.replaceChildren();for(const [key,value] of Object.entries(languages)){const option=document.createElement('option');option.value=key;option.textContent=value.name;select.append(option);}
  select.value=preferredLanguage();applyLocale(select.value);
  select.dataset.i18nLabel='language';if(!practice)select.addEventListener('change',()=>applyLocale(select.value));
}

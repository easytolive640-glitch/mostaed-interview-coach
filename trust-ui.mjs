import {trustText} from './trust-copy.mjs';
import {preferredLanguage,normalizeLanguage} from './locales.mjs';
import {initLocalization} from './app-localization.mjs';
import {syncLanguageLinks} from './language-navigation.mjs';
if(document.body.dataset.trustPage)initLocalization();
export function renderTrust(language=preferredLanguage()){
  language=normalizeLanguage(language);
  for(const el of document.querySelectorAll('[data-trust]'))el.textContent=trustText(el.dataset.trust,language);
  syncLanguageLinks(language);
}
renderTrust();
document.addEventListener('change',event=>{
  if(['uiLanguage','landingLanguage','language'].includes(event.target.id))renderTrust(event.target.value);
});

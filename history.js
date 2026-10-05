import {localizeMessage} from './localized-messages.mjs';
import {initLocalization,currentLanguage} from './app-localization.mjs';
import {translate,languages} from './locales.mjs';
initLocalization();
import {renderEvaluation} from './evaluation-report.mjs';
const notice=document.getElementById('notice'), list=document.getElementById('history'), refresh=document.getElementById('refresh');
async function loadHistory(){
  refresh.disabled=true;notice.removeAttribute('data-i18n');
  try{
    const session=JSON.parse(sessionStorage.getItem('mostaed_account')||'null');
    if(!session || session.expires_at*1000<Date.now()) throw Error(translate('signInAgain',currentLanguage()));
    const response=await fetch('/api/account-config?history=1',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
    const data=await response.json();
    if(!response.ok)throw Error(data.error||'History unavailable');
    list.replaceChildren();
    for(const item of data.items){
      const card=document.createElement('details');card.className='card';
      const summary=document.createElement('summary');
      const label=translate(item.category,currentLanguage());
      summary.textContent=new Date(item.created_at).toLocaleString(languages[currentLanguage()].code)+' · '+label+' · '+item.evaluation.score+'/100';
      card.append(summary);renderEvaluation(card,item.evaluation,currentLanguage(),item.category);
      list.append(card);
    }
    notice.textContent=translate(data.items.length?'historyLoaded':'emptyHistory',currentLanguage());
  }catch(error){list.replaceChildren();notice.textContent=localizeMessage(error.message,currentLanguage());}
  finally{refresh.disabled=false;}
}
refresh.addEventListener('click',loadHistory);loadHistory();

document.getElementById('uiLanguage')?.addEventListener('change',loadHistory);

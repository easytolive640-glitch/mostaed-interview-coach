import {renderEvaluation} from './evaluation-report.mjs';
const notice=document.getElementById('notice'), list=document.getElementById('history'), refresh=document.getElementById('refresh');
async function loadHistory(){
  refresh.disabled=true;
  try{
    const session=JSON.parse(sessionStorage.getItem('mostaed_account')||'null');
    if(!session || session.expires_at*1000<Date.now()) throw Error('Please sign in to view your history / سجل الدخول لعرض السجل');
    const response=await fetch('/api/account-config?history=1',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
    const data=await response.json();
    if(!response.ok)throw Error(data.error||'History unavailable');
    list.replaceChildren();
    for(const item of data.items){
      const card=document.createElement('details');card.className='card';
      const summary=document.createElement('summary');
      const label={hr:'HR / الموارد البشرية',customerService:'Customer Service / خدمة العملاء',itCloud:'IT & Cloud / تقنية المعلومات والسحابة'}[item.category]||item.category;
      summary.textContent=new Date(item.created_at).toLocaleString()+' · '+label+' · '+item.evaluation.score+'/100';
      card.append(summary);renderEvaluation(card,item.evaluation,item.language,item.category);
      list.append(card);
    }
    notice.textContent=data.items.length?'Saved evaluations for your account / تقييمات حسابك المحفوظة':'No saved evaluations yet / لا توجد تقييمات محفوظة بعد';
  }catch(error){list.replaceChildren();notice.textContent=error.message;}
  finally{refresh.disabled=false;}
}
refresh.addEventListener('click',loadHistory);loadHistory();

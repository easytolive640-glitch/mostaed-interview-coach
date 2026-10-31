const nav=document.querySelector('header nav');
const links=nav?.querySelector('.nav');
if(nav&&links){
 const style=document.createElement('style');style.textContent=`
 .menu-toggle{display:inline-flex!important;align-items:center;gap:10px;padding:12px 18px;border:1px solid #ffffff30;border-radius:14px;background:#241943;color:#fff;font:inherit;cursor:pointer}
 header nav{justify-content:space-between}
 .site-drawer{position:fixed;inset:0 auto 0 0;margin:0;border:0;border-inline-end:1px solid #ffffff25;background:#17102d;color:#fff;width:min(360px,90vw);max-width:90vw;height:100dvh;max-height:100dvh;padding:24px;box-sizing:border-box;overflow:auto}
 [dir="rtl"] .site-drawer{inset:0 0 0 auto}
 .site-drawer::backdrop{background:#080511bb;backdrop-filter:blur(4px)}
 .drawer-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:24px}
 .drawer-close{background:transparent;color:#fff;border:1px solid #ffffff35;border-radius:10px;padding:8px 14px;font-size:24px;cursor:pointer}
 .site-drawer .nav{display:flex!important;flex-direction:column;align-items:stretch;gap:8px;width:100%;flex-wrap:nowrap}
 .site-drawer .nav a{display:block;padding:13px 14px;border-radius:10px;white-space:normal;color:#f3efff;text-decoration:none}
 .site-drawer .nav a:hover{background:#ffffff12}
 .site-drawer .nav a:focus-visible,.menu-toggle:focus-visible,.drawer-close:focus-visible{outline:3px solid #56f2c3;outline-offset:3px}
 .site-drawer .nav select{width:100%;margin-top:16px;min-height:44px}
 body.drawer-open{overflow:hidden}
 `;document.head.append(style);
 const button=document.createElement('button');button.type='button';button.className='menu-toggle';button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','mostaed-menu');button.setAttribute('aria-haspopup','dialog');
 const dialog=document.createElement('dialog');dialog.id='mostaed-menu';dialog.className='site-drawer';dialog.setAttribute('aria-labelledby','drawer-title');
 const top=document.createElement('div');top.className='drawer-top';
 const title=document.createElement('strong');title.id='drawer-title';
 const close=document.createElement('button');close.type='button';close.className='drawer-close';close.textContent='×';
 top.append(title,close);dialog.append(top,links);document.body.append(dialog);nav.append(button);
 const free=document.createElement('a');free.href='/freepractice';free.dataset.copy='startFree';
 const ai=document.createElement('a');ai.href='#pricing';ai.dataset.copy='startAI';
 links.prepend(free,ai);
 const labels={english:['Menu','Close menu','Free practice','AI coaching · Choose plan'],arabic:['القائمة','إغلاق القائمة','التدريب المجاني','التدريب الذكي · اختر الباقة'],french:['Menu','Fermer le menu','Entraînement gratuit','Coaching IA · Choisir une offre'],spanish:['Menú','Cerrar menú','Práctica gratuita','Coaching con IA · Elegir plan'],german:['Menü','Menü schließen','Kostenlos üben','KI-Coaching · Tarif wählen']};
 const update=()=>{const lang=document.getElementById('landingLanguage')?.value||'english';const v=labels[lang]||labels.english;button.textContent='☰ '+v[0];button.setAttribute('aria-label',v[0]);title.textContent=v[0];close.setAttribute('aria-label',v[1]);free.textContent=v[2];ai.textContent=v[3];free.href='/freepractice?lang='+lang;ai.href='#pricing';};
 update();document.getElementById('landingLanguage')?.addEventListener('change',update);
 const finish=()=>{button.setAttribute('aria-expanded','false');document.body.classList.remove('drawer-open');button.focus();};
 button.addEventListener('click',()=>{dialog.showModal();button.setAttribute('aria-expanded','true');document.body.classList.add('drawer-open');});
 close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',finish);
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}if(e.target.closest('a'))dialog.close();});
}

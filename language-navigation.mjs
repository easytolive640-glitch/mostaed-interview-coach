import {normalizeLanguage} from './locales.mjs';
export function syncLanguageLinks(language){
  for(const link of document.querySelectorAll('a[href]')){
    const raw=link.getAttribute('href');if(!raw||raw.startsWith('#'))continue;
    const url=new URL(raw,location.href);
    const legacyFree=url.origin==='https://easytolive640-glitch.github.io'&&url.pathname.startsWith('/mostaed-interview-coach/');
    if(legacyFree){url.hostname=location.hostname||new URL(location.href).hostname;url.protocol=new URL(location.href).protocol;url.port=new URL(location.href).port;url.pathname='/freepractice';}
    const free=url.origin===location.origin&&['/freepractice','/freepractice/'].includes(url.pathname);
    if(!free&&(url.origin!==location.origin||!(/\.(html)$/.test(url.pathname)||url.pathname==='/'||url.pathname==='/guides/'||url.pathname==='/blogs/')))continue;
    url.searchParams.set('lang',normalizeLanguage(language));link.href=url.href;
  }
}

import {normalizeLanguage} from './locales.mjs';
export function syncLanguageLinks(language){
  for(const link of document.querySelectorAll('a[href]')){
    const raw=link.getAttribute('href');if(!raw||raw.startsWith('#'))continue;
    const url=new URL(raw,location.href);
    const free=url.origin==='https://easytolive640-glitch.github.io'&&url.pathname.startsWith('/mostaed-interview-coach/');
    if(!free&&(url.origin!==location.origin||!(/\.(html)$/.test(url.pathname)||url.pathname==='/'||url.pathname==='/guides/')))continue;
    url.searchParams.set('lang',normalizeLanguage(language));link.href=url.href;
  }
}

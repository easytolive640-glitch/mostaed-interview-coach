const section=document.getElementById('career-news');
const grid=document.getElementById('career-news-items');
const status=document.getElementById('career-news-status');
const copy={
 english:['Career news & fresh reads','Recent career articles and workplace headlines from independent publishers.','Loading recent articles…','Recent items from publisher feeds. Article language: English.','Feeds are temporarily unavailable. Explore the publishers below or our selected career blogs.','Some publisher feeds are unavailable; showing available articles.','Career blog','Workplace news','Read original ↗'],
 arabic:['أخبار المسار المهني وأحدث المقالات','مقالات مهنية وأخبار سوق العمل من ناشرين مستقلين.','جارٍ تحميل أحدث المقالات…','أحدث المواد من خلاصات الناشرين. لغة المقالات: الإنجليزية.','الخلاصات غير متاحة مؤقتاً. تصفح الناشرين أدناه أو مقالاتنا المختارة.','بعض الخلاصات غير متاحة؛ نعرض المقالات المتوفرة.','مقال مهني','أخبار العمل','اقرأ الأصل ↗'],
 french:['Actualités et lectures carrière','Articles récents et actualités du travail de sources indépendantes.','Chargement…','Articles des flux éditeurs. Langue des articles : anglais.','Flux indisponibles. Consultez les éditeurs ci-dessous ou nos articles sélectionnés.','Certains flux sont indisponibles.','Blog carrière','Actualités du travail','Lire l’original ↗'],
 spanish:['Noticias y lecturas profesionales','Artículos recientes y noticias laborales de editores independientes.','Cargando…','Artículos de los editores. Idioma de los artículos: inglés.','Fuentes no disponibles. Visita los editores o nuestros artículos seleccionados.','Algunas fuentes no están disponibles.','Blog profesional','Noticias laborales','Leer original ↗'],
 german:['Karrierenachrichten und neue Artikel','Neue Karriereartikel und Arbeitsweltnachrichten unabhängiger Herausgeber.','Wird geladen…','Artikel aus Herausgeber-Feeds. Artikelsprache: Englisch.','Feeds derzeit nicht verfügbar. Besuche die Herausgeber oder unsere ausgewählten Artikel.','Einige Feeds sind nicht verfügbar.','Karriereblog','Arbeitsweltnachrichten','Original lesen ↗']
};
let data=null,failed=false;
function render(){
 const language=document.getElementById('landingLanguage')?.value||'english';const c=copy[language]||copy.english;
 section.querySelector('h2').textContent=c[0];section.querySelector('.news-lead').textContent=c[1];
 status.textContent=failed||data&&!data.items.length?c[4]:data?(data.partial?c[5]:c[3]):c[2];
 if(!data)return;
 grid.replaceChildren();
 for(const item of data.items){
  const card=document.createElement('article');card.className='card news-card';card.lang='en';card.dir='ltr';
  const meta=document.createElement('p');meta.className='news-meta';
  const date=document.createElement('time');date.dateTime=item.publishedAt;date.textContent=new Intl.DateTimeFormat(document.documentElement.lang||'en',{year:'numeric',month:'short',day:'numeric'}).format(new Date(item.publishedAt));
  meta.append(document.createTextNode(item.source+' · '),date);
  const category=document.createElement('p');category.className='news-category';category.textContent=item.kind==='blog'?c[6]:c[7];
  const title=document.createElement('h3');const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=item.title;title.append(link);
  const read=document.createElement('a');read.href=item.url;read.target='_blank';read.rel='noopener noreferrer';read.textContent=c[8];
  card.append(category,meta,title,read);grid.append(card);
 }
}
if(section){
 document.getElementById('landingLanguage')?.addEventListener('change',render);render();
 fetch('/api/career-feed',{signal:AbortSignal.timeout(12000)}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(value=>{
  if(!Array.isArray(value.items))throw Error();
  data=value;render();
 }).catch(()=>{failed=true;render();});
}

const languageCodes={english:'en',arabic:'ar',french:'fr',spanish:'es',german:'de'};
export const reportPrintStyles=`
@page { size:A4; margin:16mm; @bottom-right { content:counter(page) " / " counter(pages); direction:ltr; unicode-bidi:isolate; font:9pt Arial,sans-serif; color:#64748b; } }
* { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body { margin:0; color:#172033; background:white; font:11pt/1.55 Arial,"Noto Sans Arabic",sans-serif; overflow-wrap:anywhere; }
.pdf-brand { border-bottom:3px solid #6d38ba; padding-bottom:12px; margin-bottom:22px; }
.pdf-brand h1 { margin:0; color:#542a95; font-size:24pt; }
.pdf-brand p { margin:4px 0; font-size:9pt; color:#526078; }
h2 { font-size:20pt; line-height:1.35; margin:0 0 14px; }
h3 { font-size:14pt; color:#542a95; margin:24px 0 10px; break-after:avoid; }
h4,summary { font-size:11pt; font-weight:bold; margin:10px 0 6px; break-after:avoid; }
p { margin:8px 0; } small { font-size:9pt; color:#526078; }
p,li { orphans:3; widows:3; } ul,ol { padding-inline-start:22px; }
.report-answer,.report-skill,.report-plan li { border:1px solid #d9d0e7; border-radius:8px; padding:12px; margin:12px 0; break-inside:avoid; }
.report-skills { display:block; }
.report-draft { background:#f5f0fb; padding:12px; white-space:pre-wrap; border-radius:6px; }
.report-skill meter { width:100%; height:16px; accent-color:#6d38ba; }
summary { display:block; color:#542a95; border-bottom:1px solid #e2d9ed; padding-bottom:8px; }
summary::marker,summary::-webkit-details-marker { display:none; }
section[aria-label] { break-inside:avoid; }
[data-report-export],[data-print-hide] { display:none !important; }
`;

// Clone only the selected result. No form answers, CV uploads, audio or account UI.
export function buildReportPrintDocument(doc,report,{language='english',date=new Date()}={}){
  doc.documentElement.lang=languageCodes[language]||'en';
  doc.documentElement.dir=language==='arabic'?'rtl':'ltr';
  const charset=doc.createElement('meta');charset.setAttribute('charset','utf-8');
  const style=doc.createElement('style');style.textContent=reportPrintStyles;
  doc.head.replaceChildren(charset,style);
  doc.title='Mostaed-coaching-report-'+date.toISOString().slice(0,10);
  const header=doc.createElement('header');header.className='pdf-brand';
  const brand=doc.createElement('h1');brand.textContent='Mostaed | مستعد';
  const source=doc.createElement('p');source.textContent='mostaedcoach.com · '+date.toISOString().slice(0,10);
  source.dir='ltr';source.style.textAlign=language==='arabic'?'right':'left';
  header.append(brand,source);
  const copy=report.cloneNode(true);
  for(const control of copy.querySelectorAll('[data-report-export],[data-print-hide]'))control.remove();
  for(const answer of copy.querySelectorAll('details'))answer.setAttribute('open','');
  doc.body.replaceChildren(header,copy);
  return doc;
}

let activeFrame;
export async function exportReportPdf(report,{language='english'}={}){
  if(activeFrame)return;
  const frame=document.createElement('iframe');
  frame.title='Mostaed PDF export';frame.setAttribute('aria-hidden','true');
  frame.style.cssText='position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0';
  activeFrame=frame;document.body.append(frame);
  let cleanupTimer;
  const cleanup=()=>{clearTimeout(cleanupTimer);frame.remove();if(activeFrame===frame)activeFrame=undefined;};
  try{
    const doc=frame.contentDocument;
    if(!doc||!frame.contentWindow)throw Error('Print is unavailable');
    buildReportPrintDocument(doc,report,{language});
    await doc.fonts?.ready;
    await new Promise(resolve=>frame.contentWindow.requestAnimationFrame(()=>frame.contentWindow.requestAnimationFrame(resolve)));
    frame.contentWindow.addEventListener('afterprint',cleanup,{once:true});
    // Some mobile browsers do not dispatch afterprint after cancelling.
    cleanupTimer=setTimeout(cleanup,300000);
    frame.contentWindow.focus();frame.contentWindow.print();
  }catch(error){cleanup();throw error;}
}

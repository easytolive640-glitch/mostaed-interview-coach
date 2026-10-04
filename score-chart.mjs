import {reportText} from './report-translations.mjs';
export function appendScoreChart(container, evaluation, language = 'english') {
  const arabic = language === 'arabic';
  const t=(en,ar)=>reportText(en,ar,language);
  const section = document.createElement('section');
  section.setAttribute('aria-label', t('Interview score analysis','تحليل درجات المقابلة'));
  section.style.cssText = 'margin:24px 0;padding:20px;border:1px solid #ded5ef;border-radius:16px;background:#faf7ff';
  const heading = document.createElement('h3');
  heading.textContent = t('Score analysis','تحليل الدرجات');
  section.append(heading);
  const rows = [
    [t('Overall','الإجمالي'), evaluation.score, '#6235b5'],
    [t('Text answers','الإجابات المكتوبة'), evaluation.textScore, '#246bb8'],
    [t('Voice answer','الإجابة الصوتية'), evaluation.voiceScore, '#087e72'],
    [t('CV consistency','اتساق السيرة الذاتية'), evaluation.cvScore, '#a44c12'],
  ];
  for (const [label, score, color] of rows) {
    const row = document.createElement('div');
    row.style.cssText = 'margin:16px 0';
    const caption = document.createElement('div');
    caption.style.cssText = 'display:flex;justify-content:space-between;gap:12px;margin-bottom:6px;flex-wrap:wrap';
    const name = document.createElement('span');
    name.textContent = label;
    const value = document.createElement('strong');
    const available = Number.isInteger(score) && score >= 0 && score <= 100;
    value.textContent = available ? score + '/100' : (t('Not evaluated','لم يُقيّم'));
    caption.append(name, value);
    row.append(caption);
    if (available) {
      const track = document.createElement('div');
      track.setAttribute('role', 'meter');
      track.setAttribute('aria-label', label);
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', String(score));
      track.style.cssText = 'height:16px;background:#e7e0ef;border-radius:8px;overflow:hidden';
      const bar = document.createElement('div');
      bar.style.cssText = 'height:100%;border-radius:8px';
      bar.style.width = score + '%';
      bar.style.backgroundColor = color;
      track.append(bar);
      row.append(track);
    }
    section.append(row);
  }
  const note = document.createElement('small');
  note.textContent = t('Scores are out of 100. Overall is weighted, rather than a simple average. “Not evaluated” means that input was absent.','الدرجات من 100. الإجمالي موزون. «لم يُقيّم» يعني أن المدخل غير متوفر.');
  section.append(note);
  container.append(section);
}

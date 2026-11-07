const get = id => document.getElementById(id);
const form = get('reviewForm');
const status = get('reviewStatus');
const result = get('reviewResult');
const language = get('reportLanguage');
const preferred = new URLSearchParams(location.search).get('lang');
if ([...language.options].some(option => option.value === preferred)) language.value = preferred;

function add(parent, tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  parent.append(element);
  return element;
}

function render(report, selectedLanguage) {
  result.replaceChildren();
  result.dir = selectedLanguage === 'arabic' ? 'rtl' : 'ltr';
  const labels = selectedLanguage === 'arabic'
    ? ['اتساق السيرة الذاتية', 'أبرز نقطة قوة', 'أهم تحسين', 'الوظائف المطابقة', 'عرض إعلان الوظيفة', 'متطلبات تحتاج إلى توضيح', 'لم نجد وظائف مطابقة ضمن المصادر المتاحة.', 'مصادر الوظائف التي تم فحصها', 'تعذر الوصول إلى مصادر الوظائف حالياً.']
    : ['CV consistency', 'Strongest evidence', 'Priority improvement', 'Matching job openings', 'View job listing', 'Evidence gaps', 'No matching openings found in the sources checked.', 'Employer boards checked', 'Employer boards could not be reached.'];
  add(result, 'h2', labels[0]);
  add(result, 'p', report.assessment);
  add(result, 'h3', labels[1]);
  add(result, 'p', report.strength);
  add(result, 'h3', labels[2]);
  add(result, 'p', report.improvement);
  const findings = add(result, 'ul', '');
  for (const finding of report.findings) {
    const item = add(findings, 'li', '');
    add(item, 'strong', finding.area + ' — ');
    item.append(finding.evidence);
  }
  add(result, 'h2', labels[3]);
  if (!report.coverage.boards.length) add(result, 'p', labels[8]);
  else {
    add(result, 'p', labels[7] + ' — ' + report.coverage.boards.join(', ') + ' · ' + new Date(report.coverage.checkedAt).toLocaleString());
    if (!report.matches.length) add(result, 'p', labels[6]);
  }
  for (const match of report.matches) {
    const card = add(result, 'article', '');
    add(card, 'h3', match.title + ' · ' + match.score + '/100');
    add(card, 'p', [match.board, match.location].filter(Boolean).join(' · '));
    add(card, 'p', match.evidence);
    add(card, 'p', labels[5] + ' — ' + match.gap);
    const link = add(card, 'a', labels[4]);
    link.href = match.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  result.hidden = false;
  result.focus();
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = get('reviewButton');
  if (button.disabled) return;
  const file = get('cvFile').files[0];
  const format = file?.name.split('.').at(-1).toLowerCase();
  result.hidden = true;
  let token;
  try { token = JSON.parse(sessionStorage.getItem('mostaed_account') || 'null')?.access_token; }
  catch { /* The sign-in message also covers an invalid browser session. */ }
  if (!token) {
    status.textContent = 'Sign in on the Account page, then return to CV Review.';
    return;
  }
  if (!file || !['pdf', 'txt'].includes(format) || file.size > 2_000_000) {
    status.textContent = 'Choose a PDF or TXT file up to 2 MB.';
    return;
  }
  button.disabled = true;
  const selectedLanguage = language.value;
  status.textContent = 'Reviewing your CV and checking job openings…';
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 8192) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
    }
    const response = await fetch('/api/cv-review', {
      method: 'POST', headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + token},
      body: JSON.stringify({file: btoa(binary), format, language: selectedLanguage, location: get('jobLocation').value, consent: get('consent').checked}),
      signal: AbortSignal.timeout(65000),
    });
    const report = await response.json().catch(() => null);
    if (!report) {
      const statusCode = response.status;
      const message = selectedLanguage === 'arabic'
        ? 'تعذّر تحميل نتيجة المراجعة. حدّث الصفحة وحاول مجدداً.'
        : 'The review result could not be loaded. Refresh the page and try again.';
      throw Error(message + ' (HTTP ' + statusCode + ')');
    }
    if (!response.ok) throw Error(report.error || 'CV review is temporarily unavailable.');
    status.textContent = '';
    render(report, selectedLanguage);
  } catch (error) {
    status.textContent = error.name === 'TimeoutError' ? 'The review took too long. Try again later.' : error.message;
  } finally {
    button.disabled = false;
  }
});

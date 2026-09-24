// Product availability is described explicitly: there is no payment or CV upload backend yet.
(() => {
  const copy = (selector, english, arabic) => {
    const target = document.querySelector(selector);
    if (!target) return;
    const en = target.querySelector('[data-en]');
    const ar = target.querySelector('[data-ar]');
    if (en) en.textContent = english;
    if (ar) ar.textContent = arabic;
  };
  const listCopy = (selector, pair, english, arabic) => {
    const target = document.querySelector(selector);
    if (!target) return;
    const en = target.querySelectorAll('[data-en]')[pair];
    const ar = target.querySelectorAll('[data-ar]')[pair];
    if (en) en.textContent = english;
    if (ar) ar.textContent = arabic;
  };

  copy('.hero .badge', 'Free text practice · paid voice coaching planned', 'تدريب كتابي مجاني · تدريب صوتي مدفوع قريباً');
  copy('.hero .lead', 'Practice five realistic interview questions in Arabic or English, then review your on-device score. Planned paid sessions add 10 or 15 text questions plus one scored voice answer.', 'تدرّب على خمسة أسئلة مقابلة بالعربية أو الإنجليزية، ثم راجع تقييمك المحلي. تتضمن الجلسات المدفوعة المخطط لها ١٠ أو ١٥ سؤالاً كتابياً وإجابة صوتية واحدة تدخل في التقييم.');
  copy('.hero .actions .primary', 'Start free text practice', 'ابدأ التدريب الكتابي المجاني');
  copy('.hero .actions .secondary', 'Explore paid voice', 'اكتشف الصوت المدفوع');
  listCopy('.hero .micro', 1, 'Arabic + English text', 'أسئلة كتابية بالعربية والإنجليزية');
  listCopy('.hero .micro', 2, 'Free practice available', 'التدريب المجاني متاح');
  copy('.voice-copy .eyebrow', 'Paid AI plan · in development', 'باقة الذكاء الاصطناعي المدفوعة · قيد التطوير');
  copy('.voice-copy h3', 'One real voice answer, scored with your written answers.', 'إجابة صوتية واحدة تُقيّم مع إجاباتك الكتابية.');
  copy('.voice-copy p', 'Free sessions use five typed questions. Planned AI Starter adds 10 text questions and AI Pro adds 15, each with one recorded question in Arabic or English. There is no speech-to-text in the app; voice scoring awaits secure paid access.', 'تتضمن الجلسة المجانية خمسة أسئلة كتابية. تضيف باقة Starter المخطط لها ١٠ أسئلة كتابية وباقة Pro ١٥ سؤالاً، مع سؤال صوتي مسجّل واحد لكل منهما. لا يوجد تحويل للصوت إلى نص داخل التطبيق؛ يتطلب تقييم الصوت اشتراكاً آمناً.');
  copy('.voice-copy .actions .primary', 'Start free practice', 'ابدأ التدريب المجاني');
  copy('#how .step:nth-child(2) h3', 'Type five answers', 'اكتب خمس إجابات');
  copy('#how .step:nth-child(2) p', 'Free practice is text-only. A separate scored recording will be available with the paid AI plan.', 'التدريب المجاني كتابي فقط. يتوفر تسجيل صوتي منفصل مع تقييمه ضمن باقة الذكاء الاصطناعي المدفوعة.');
  copy('#pricing .head p', 'Free: 5 text questions. Planned AI Starter: 10 text questions + 1 voice answer. Planned AI Pro: 15 text questions + 1 voice answer. Paid access and CV tailoring are not open yet.', 'المجاني: ٥ أسئلة كتابية. باقة Starter المخطط لها: ١٠ أسئلة كتابية + إجابة صوتية. باقة Pro: ١٥ سؤالاً كتابياً + إجابة صوتية. الاشتراكات وتخصيص التدريب بالسيرة الذاتية غير متاحين بعد.');
  listCopy('#pricing .price-card:first-child .price-list', 1, 'Five text questions per session', 'خمسة أسئلة كتابية في كل جلسة');
  copy('#pricing .price-card.starter .usage', 'Proposed limit: up to 20 AI evaluations / month', 'حد مقترح: حتى 20 تقييماً ذكياً شهرياً');
  copy('#pricing .price-card.pro .usage', 'Proposed limit: up to 100 AI evaluations / month', 'حد مقترح: حتى 100 تقييم ذكي شهرياً');
  copy('#pricing .legal-note', 'Paid prices and limits are proposals, not active offers. No payment is accepted here. AI and CV features will open only after subscription verification and privacy controls are in place.', 'الأسعار والحدود المدفوعة مقترحة وليست عروضاً مفعّلة. لا نقبل الدفع هنا. ستُتاح ميزات الذكاء الاصطناعي والسيرة الذاتية بعد التحقق من الاشتراك وتطبيق ضوابط الخصوصية.');
  copy('#android .download p', 'The Android release is in preparation. Try the free web beta today; paid AI, voice scoring, and CV tailoring are not active yet.', 'نسخة أندرويد قيد الإعداد. جرّب نسخة الويب المجانية الآن؛ تقييم الصوت والذكاء الاصطناعي وتخصيص التدريب بالسيرة الذاتية غير مفعّلة بعد.');

  // Make the monthly question policy visible beyond the pricing card.
  document.head.insertAdjacentHTML('beforeend', `<style>
    .monthly-section{padding:75px 0;background:radial-gradient(circle at 82% 10%,#ef5eaf38,transparent 35%),linear-gradient(125deg,#26205f,#103b55);border-block:1px solid #ffffff24}
    .monthly-panel{display:grid;grid-template-columns:1.15fr 1fr;gap:40px;align-items:center;padding:40px;border:1px solid #ffffff30;border-radius:30px;background:#ffffff0d;box-shadow:0 25px 70px #08082c50}
    .monthly-panel h2{font-size:clamp(29px,4vw,49px);line-height:1.13;margin:12px 0 20px;color:#fff}
    .monthly-panel p{color:#e6e4f5;line-height:1.75;margin:0 0 18px}
    .monthly-badge{display:inline-block;background:#ffd268;color:#301a48;border-radius:999px;padding:8px 14px;font-weight:800;font-size:12px}
    .monthly-steps{display:grid;gap:12px}.monthly-step{display:flex;gap:16px;align-items:flex-start;padding:18px;border-radius:17px;background:#ffffff13;border:1px solid #ffffff27;color:#f4f2ff}
    .monthly-step strong{display:block;color:#fff;margin-bottom:5px}.monthly-step b{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:12px;color:#251943;background:linear-gradient(120deg,#ffd268,#6bf1c6)}
    @media(max-width:760px){.monthly-section{padding:50px 0}.monthly-panel{grid-template-columns:1fr;padding:25px;gap:18px}}
  </style>`);
  document.querySelector('#pricing')?.insertAdjacentHTML('beforebegin', `
    <section id="monthly-questions" class="monthly-section"><div class="wrap"><div class="monthly-panel">
      <div><span class="monthly-badge"><span data-en>COMING TO PAID PLANS</span><span data-ar>قريباً في الباقات المدفوعة</span></span>
        <h2><span data-en>New questions each month. Relevant to the role you choose.</span><span data-ar>أسئلة مختلفة كل شهر حسب المجال الذي تختاره.</span></h2>
        <p><span data-en>Starter will have 10 written questions and Pro will have 15. Each paid plan selects a different set each calendar month in Arabic or English. Your questions stay the same throughout an interview.</span><span data-ar>تتضمن باقة Starter عشرة أسئلة كتابية وباقة Pro خمسة عشر سؤالاً. تتغير مجموعة الأسئلة في كل شهر ميلادي بالعربية أو الإنجليزية، وتبقى ثابتة طوال المقابلة.</span></p>
        <p><span data-en>A monthly review is scheduled for HR, customer service and IT/cloud job profiles. We will revise the bank when reviewed requirements change. A new month changes the selection; it does not guarantee every question was newly written. Free practice keeps its five text questions.</span><span data-ar>حُددت مراجعة شهرية لمتطلبات وظائف الموارد البشرية وخدمة العملاء وتقنية المعلومات والسحابة. سنحدّث بنك الأسئلة عند تغير المتطلبات بعد مراجعتها. الشهر الجديد يغيّر مجموعة الأسئلة ولا يعني أن كل سؤال كُتب من جديد. يبقى التدريب المجاني بخمسة أسئلة كتابية.</span></p>
      </div><div class="monthly-steps" aria-label="Monthly question process">
        <div class="monthly-step"><b>01</b><div><strong><span data-en>Choose your role</span><span data-ar>اختر مجالك</span></strong><span data-en>HR, customer service or IT/cloud.</span><span data-ar>الموارد البشرية أو خدمة العملاء أو تقنية المعلومات والسحابة.</span></div></div>
        <div class="monthly-step"><b>02</b><div><strong><span data-en>Practice this month's set</span><span data-ar>تدرّب على مجموعة هذا الشهر</span></strong><span data-en>10 questions in Starter or 15 in Pro, once paid access launches.</span><span data-ar>١٠ أسئلة في Starter أو ١٥ في Pro بعد إطلاق الاشتراكات.</span></div></div>
        <div class="monthly-step"><b>03</b><div><strong><span data-en>Scheduled monthly review</span><span data-ar>مراجعة شهرية مجدولة</span></strong><span data-en>Questions are revised after a source review when roles evolve.</span><span data-ar>تُعدّل الأسئلة بعد مراجعة المصادر عندما تتطور متطلبات الوظائف.</span></div></div>
      </div></div></div></section>`);

  for (const card of document.querySelectorAll('#pricing .price-card.starter, #pricing .price-card.pro')) {
    const pro = card.classList.contains('pro');
    card.querySelector('.price-list')?.insertAdjacentHTML('afterbegin', pro
      ? '<span data-en>15 text questions per paid interview (planned)</span><span data-ar>١٥ سؤالاً كتابياً لكل مقابلة مدفوعة (قريباً)</span>'
      : '<span data-en>10 text questions per paid interview (planned)</span><span data-ar>١٠ أسئلة كتابية لكل مقابلة مدفوعة (قريباً)</span>');
    card.querySelector('.price-list')?.insertAdjacentHTML('beforeend', '<span data-en>One voice answer included in AI scoring (planned)</span><span data-ar>تقييم إجابة صوتية واحدة ضمن النتيجة الذكية (قريباً)</span><span data-en>Optional CV-tailored practice (planned)</span><span data-ar>تدريب مخصص بالسيرة الذاتية (قريباً)</span>');
    card.querySelector('.price-list')?.insertAdjacentHTML('beforeend', '<span data-en>Questions rotate monthly; role profiles are reviewed before updates (planned)</span><span data-ar>تتغير الأسئلة شهرياً؛ وتُراجع متطلبات الوظائف قبل تحديثها (قريباً)</span>');
  }
  // Existing bilingual CSS displays spans according to the selected language.
  const pricing = document.querySelector('#pricing');
  if (!pricing) return;
  document.querySelector('.nav a[href="#pricing"]')?.insertAdjacentHTML('afterend', '<a href="#cv"><span data-en>CV preview</span><span data-ar>معاينة السيرة</span></a>');
  pricing.insertAdjacentHTML('afterend', `
    <section id="cv" class="cv-section"><div class="wrap"><div class="cv-panel">
      <div class="cv-copy"><span class="eyebrow"><span data-en>CV-informed practice · planned for paid AI</span><span data-ar>تدريب مخصص بالسيرة الذاتية · قريباً للباقة المدفوعة</span></span>
        <h2><span data-en>Bring your CV into the conversation.</span><span data-ar>اجعل سيرتك الذاتية جزءاً من التدريب.</span></h2>
        <p><span data-en>Choose a PDF or DOCX to see how CV selection will work. Today your file stays on this device: it is not uploaded, saved, read, or analyzed. Tailored questions will require a verified paid account and a secure upload flow.</span><span data-ar>اختر ملف PDF أو DOCX لتجربة اختيار السيرة الذاتية. حالياً يبقى الملف على جهازك: لا يُرفع أو يُحفظ أو يُقرأ أو يُحلّل. ستتطلب الأسئلة المخصصة اشتراكاً مدفوعاً مؤكداً وآلية رفع آمنة.</span></p>
      </div><div class="cv-picker"><label class="cv-drop" for="cv-file"><span class="cv-symbol" aria-hidden="true">↥</span><strong><span data-en>Choose your CV</span><span data-ar>اختر سيرتك الذاتية</span></strong><small>PDF / DOCX · 5 MB max</small></label>
        <input id="cv-file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" aria-describedby="cv-status cv-privacy">
        <p id="cv-status" role="status" aria-live="polite"><span data-en>No file selected.</span><span data-ar>لم يتم اختيار ملف.</span></p>
        <button id="cv-clear" class="cv-clear" type="button" hidden><span data-en>Remove selection</span><span data-ar>إزالة الاختيار</span></button>
        <p id="cv-privacy" class="cv-privacy"><span data-en>Private preview only. Nothing is sent to our servers.</span><span data-ar>معاينة محلية فقط. لا يُرسل أي ملف إلى خوادمنا.</span></p>
      </div></div></div></section>`);

  const input = document.getElementById('cv-file');
  const status = document.getElementById('cv-status');
  const clear = document.getElementById('cv-clear');
  const say = (en, ar) => {
    status.querySelector('[data-en]').textContent = en;
    status.querySelector('[data-ar]').textContent = ar;
  };
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (!file) { say('No file selected.', 'لم يتم اختيار ملف.'); clear.hidden = true; return; }
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx'].includes(extension) || file.size > 5 * 1024 * 1024 || file.size === 0) {
      input.value = '';
      clear.hidden = true;
      say('Choose a PDF or DOCX smaller than 5 MB.', 'اختر ملف PDF أو DOCX أقل من 5 ميجابايت.');
      return;
    }
    // textContent prevents a filename from injecting markup. The file is never read or sent.
    say(`${file.name} selected locally · not uploaded`, `تم اختيار ${file.name} محلياً · لم يُرفع`);
    clear.hidden = false;
  });
  clear.addEventListener('click', () => { input.value = ''; clear.hidden = true; say('No file selected.', 'لم يتم اختيار ملف.'); });
})();

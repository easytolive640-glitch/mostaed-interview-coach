// Browser visibility is a deterrent, not proof of cheating or a locked browser.
export function createAttemptGuard(onChange = () => {}) {
  let started = false, invalid = false;
  return {
    start() { if (invalid) return false; started = true; onChange(); return true; },
    leave() { if (started) { invalid = true; onChange(); } },
    reset() { started = false; invalid = false; onChange(); },
    canSubmit() { return started && !invalid; },
    get started() { return started; },
    get invalid() { return invalid; }
  };
}
export function initAssessmentFocus({start, restart, status, questions, questionExtras = [], onChange, onRestart, cameraReady = () => true, beforeStart = () => true}) {
  const refreshVisibility = () => {
    const locked = !guard.canSubmit() || !cameraReady();
    questions.disabled = locked;
    questions.hidden = locked;
    for(const element of questionExtras) element.hidden = locked;
    start.disabled = guard.started || !cameraReady();
  };
  const guard = createAttemptGuard(() => {
    refreshVisibility();
    restart.hidden = !guard.started;
    status.textContent = guard.invalid
      ? 'The assessment was interrupted (tab or camera). Submission is blocked. Restart to begin a new attempt; your current answers will be cleared. / انقطع التقييم (التبويب أو الكاميرا). الإرسال محظور. أعد البدء لمحاولة جديدة؛ ستُمسح الإجابات الحالية.'
      : guard.started
        ? 'Assessment started. Keep this tab visible until you submit. / بدأ التقييم. أبقِ هذا التبويب ظاهراً حتى الإرسال.'
        : 'Before starting, prepare your CV and enable your camera. Switching tabs, minimizing the browser, or locking the screen after starting blocks submission. Other open tabs cannot be inspected. / جهّز السيرة وشغّل الكاميرا قبل البدء. تبديل التبويب أو تصغير المتصفح أو قفل الشاشة بعد البدء يمنع الإرسال. لا يمكن فحص التبويبات الأخرى.';
    onChange();
  });
  start.addEventListener('click', () => { if (document.visibilityState === 'visible' && cameraReady() && beforeStart()) guard.start(); });
  restart.addEventListener('click', () => {
    if (!confirm('Restart and clear your answers? / إعادة البدء ومسح الإجابات؟')) return;
    onRestart(); guard.reset();
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') guard.leave(); });
  window.addEventListener('pagehide', () => guard.leave());
  guard.reset();
  return Object.assign(guard,{refresh:refreshVisibility});
}

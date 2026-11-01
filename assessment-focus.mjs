// Browser visibility is a deterrent, not proof of cheating or a locked browser.
export function createAttemptGuard(onChange = () => {}) {
  let started = false, invalid = false;
  return {
    start() { if (invalid) return false; started = true; onChange(); return true; },
    leave() { if (started && !invalid) { invalid = true; onChange(); } },
    terminate() { if(!invalid){invalid=true;onChange();} },
    reset() { if(invalid)return false; started = false; onChange(); return true; },
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
    start.disabled = guard.invalid || guard.started || !cameraReady();
  };
  const guard = createAttemptGuard(() => {
    refreshVisibility();
    restart.hidden = true;
    status.textContent = guard.invalid
      ? 'Assessment terminated. Submission and restarting are blocked. Contact support for an authorised new attempt. / تم إنهاء التقييم. الإرسال وإعادة البدء محظوران. تواصل مع الدعم للسماح بمحاولة جديدة.'
      : guard.started
        ? 'Assessment started. Keep this tab visible until you submit. / بدأ التقييم. أبقِ هذا التبويب ظاهراً حتى الإرسال.'
        : 'Before starting, prepare your CV and enable your camera. Switching tabs, minimizing the browser, or locking the screen after starting blocks submission. Other open tabs cannot be inspected. / جهّز السيرة وشغّل الكاميرا قبل البدء. تبديل التبويب أو تصغير المتصفح أو قفل الشاشة بعد البدء يمنع الإرسال. لا يمكن فحص التبويبات الأخرى.';
    onChange();
  });
  start.addEventListener('click', () => { if (document.visibilityState === 'visible' && cameraReady() && beforeStart()) guard.start(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') guard.leave(); });
  window.addEventListener('pagehide', () => guard.leave());
  guard.reset();
  return Object.assign(guard,{refresh:refreshVisibility});
}

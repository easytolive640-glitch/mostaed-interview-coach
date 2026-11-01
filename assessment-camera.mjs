// Local camera presence is a browser safeguard, not proof of identity or honesty.
export function cameraIsLive(stream) {
  return !!stream?.getVideoTracks().some(track => track.readyState === 'live' && track.enabled && !track.muted);
}
export function initAssessmentCamera({video, button, status, submit, consent, canSubmit = () => true}) {
  let stream, opening = false, busy = false, disposed = false;
  const message = (en, ar) => `${en} / ${ar}`;
  const update = () => {
    const ready = consent.checked && cameraIsLive(stream);
    submit.disabled = busy || !ready || !canSubmit();
    status.textContent = ready
      ? message('Camera active. Keep it on until submission.', 'الكاميرا تعمل. أبقها مفتوحة حتى إرسال التقييم.')
      : message('Camera required. Submission is blocked until your camera is active.', 'الكاميرا مطلوبة. لن يُرسل التقييم حتى تعمل الكاميرا.');
    button.disabled = opening || ready || !consent.checked;
    video.hidden = !ready;
    return ready;
  };
  const stop = () => { stream?.getTracks().forEach(track => track.stop()); stream = null; video.srcObject = null; update(); };
  consent.addEventListener('change', () => { if (!consent.checked) stop(); else update(); });
  button.addEventListener('click', async () => {
    if (opening || !consent.checked || disposed) return;
    opening = true; update();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
      const next = await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
      if (disposed || !consent.checked) { next.getTracks().forEach(track => track.stop()); return; }
      stop(); stream = next; video.srcObject = stream;
      for (const track of stream.getVideoTracks()) for (const event of ['ended','mute','unmute']) track.addEventListener(event, update);
      await video.play();
    } catch {
      stop();
      status.textContent = message('Camera unavailable. Allow camera permission, close other camera apps, and retry. Your answers are kept on this page.', 'تعذر تشغيل الكاميرا. اسمح باستخدامها وأغلق التطبيقات الأخرى ثم حاول مجدداً. إجاباتك محفوظة في هذه الصفحة.');
    } finally { opening = false; button.disabled = !consent.checked || cameraIsLive(stream); }
  });
  const interval = setInterval(update, 1000);
  window.addEventListener('pagehide', () => { disposed = true; clearInterval(interval); stop(); });
  update();
  return {requireCamera: update, setBusy(value) { busy = value; update(); }};
}

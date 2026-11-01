// Video is temporary browser memory. Only a bounded sample of JPEG frames is submitted.
export function initAssessmentRecording({video, status, onFailure}) {
  let recorder, chunks=[], bytes=0, samples=[], seen=0, startedAt=0, timer, active=false;
  const fail=()=>{active=false;clearInterval(timer);if(recorder?.state==='recording')recorder.stop();status.textContent='Camera recording interrupted. Restart the assessment. / انقطع تسجيل الكاميرا. أعد بدء التقييم.';onFailure();};
  function capture() {
    if(!active || !video.videoWidth || video.readyState<2) return false;
    const canvas=document.createElement('canvas');canvas.width=480;canvas.height=Math.round(480*video.videoHeight/video.videoWidth);
    const context=canvas.getContext('2d');if(!context)return false;
    context.drawImage(video,0,0,canvas.width,canvas.height);
    const image=canvas.toDataURL('image/jpeg',0.55);if(image.length>100000)return false;
    const frame={seconds:Math.round((Date.now()-startedAt)/1000),image};
    seen++;if(samples.length<10)samples.push(frame);else{const index=Math.floor(Math.random()*seen);if(index<10)samples[index]=frame;}
    return true;
  }
  function reset() { active=false;clearInterval(timer);if(recorder?.state==='recording')recorder.stop();recorder=null;chunks=[];bytes=0;samples=[];seen=0; }
  return {
    start() {
      reset();
      try {
        if(!window.MediaRecorder || !video.srcObject || video.readyState<2)throw Error();
        const mime=['video/webm;codecs=vp8','video/webm','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));if(!mime)throw Error();
        recorder=new MediaRecorder(video.srcObject,{mimeType:mime,videoBitsPerSecond:100000});
        const current=recorder;
        recorder.ondataavailable=e=>{if(current!==recorder)return;if(e.data.size){bytes+=e.data.size;if(bytes>64000000){reset();fail();return;}chunks.push(e.data);}};
        recorder.onerror=()=>{if(current===recorder)fail();};recorder.onstop=()=>{if(current===recorder&&active)fail();};
        recorder.start(1000);startedAt=Date.now();active=true;
        if(!capture())throw Error();timer=setInterval(()=>{if(!capture())fail();},10000);
        status.textContent='Camera recording active. Sampled frames will be reviewed after submission. / تسجيل الكاميرا يعمل. ستُراجع صور مختارة بعد الإرسال.';
        return true;
      } catch {reset();status.textContent='Recording unavailable. Enable the camera and use a browser supporting video recording. / التسجيل غير متاح. شغّل الكاميرا واستخدم متصفحاً يدعم تسجيل الفيديو.';return false;}
    },
    evidence() {
      if(!active || recorder?.state!=='recording' || !capture())throw Error('Camera recording required / تسجيل الكاميرا مطلوب');
      return {consent:true,recording:true,durationSeconds:Math.round((Date.now()-startedAt)/1000),frames:[...samples].sort((a,b)=>a.seconds-b.seconds)};
    },
    get active(){return active && recorder?.state==='recording';},
    reset,
    finish(){reset();status.textContent='Camera review submitted. Temporary recording cleared. / أُرسلت صور المراجعة ومُسح التسجيل المؤقت.';}
  };
}
export function renderCameraReview(container, review) {
  const section=document.createElement('section');section.className='card';
  const heading=document.createElement('h2');heading.textContent='Camera observations — human review required / ملاحظات الكاميرا — تتطلب مراجعة بشرية';
  const limits=document.createElement('p');limits.textContent='AI reviews sampled images only, not the full video. These observations do not prove cheating, verify identity, or affect answer scores. / يراجع الذكاء الاصطناعي صوراً مختارة فقط وليس الفيديو الكامل. الملاحظات لا تثبت الغش أو الهوية ولا تؤثر على درجات الإجابات.';
  section.append(heading,limits);
  const labels={one_person_visible:'One person visible / شخص واحد ظاهر',person_not_visible:'No person visible / لا يوجد شخص ظاهر',multiple_people:'More than one person visible / أكثر من شخص ظاهر',phone_visible:'Phone visible / هاتف ظاهر',unclear:'Image unclear / الصورة غير واضحة'};
  if(review?.status==='completed')for(const item of review.observations){const p=document.createElement('p');p.textContent=`${item.seconds}s: ${labels[item.event]||labels.unclear}`;section.append(p);}
  else {const p=document.createElement('p');p.textContent='Camera review unavailable. No conclusion can be drawn. / مراجعة الكاميرا غير متاحة ولا يمكن استنتاج نتيجة.';section.append(p);}
  container.append(section);
}

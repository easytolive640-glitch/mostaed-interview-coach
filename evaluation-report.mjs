import {reportText} from './report-translations.mjs';
import {appendScoreChart} from './score-chart.mjs';
const labels={
  communication:['Communication','التواصل'],motivation:['Motivation','الدافع المهني'],teamwork:['Teamwork','العمل الجماعي'],selfAwareness:['Self-awareness','الوعي بالذات'],
  empathy:['Empathy','التعاطف'],resolution:['Problem resolution','حل المشكلات'],ownership:['Ownership','تحمل المسؤولية'],
  technicalAccuracy:['Technical accuracy','الدقة التقنية'],troubleshooting:['Troubleshooting','استكشاف الأعطال'],security:['Security','الأمان'],reliability:['Reliability','الموثوقية'],
};
function node(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function paragraph(container,label,text){if(!text)return;const p=node('p');p.append(node('strong',label+' '),node('span',text));container.append(p);}
export function renderEvaluation(container,evaluation,language='english',category) {
  const ar=language==='arabic';const t=(en,arabic)=>reportText(en,arabic,language);
  const section=node('section',undefined,'evaluation-report');section.dir=ar?'rtl':'ltr';
  section.append(node('h2',t('Your coaching report','تقريرك التدريبي')+' · '+evaluation.score+'/100'));
  const categories={hr:['HR','الموارد البشرية'],customerService:['Customer Service','خدمة العملاء'],itCloud:['IT & Cloud','تقنية المعلومات والسحابة']};
  const cat=categories[category];if(cat)section.append(node('p',t('Interview category: ','نوع المقابلة: ')+t(cat[0],cat[1])));
  if(evaluation.summary)section.append(node('p',evaluation.summary,'report-summary'));
  appendScoreChart(section,evaluation,language);
  if(evaluation.scoringWeights){const w=evaluation.scoringWeights;section.append(node('small',reportText(
    'Text is the average of individual answer scores. Overall weights: text {text}%, voice {voice}%, CV {cv}%. Skill scores below are separate diagnostics.',
    'درجة الكتابة هي متوسط درجات الإجابات. أوزان الإجمالي: الكتابة {text}٪، الصوت {voice}٪، السيرة {cv}٪. درجات المهارات مؤشرات مستقلة.',language,w)));
  }
  for(const [heading,items] of [[t('What you do well','نقاط قوتك'),evaluation.strengths],[t('Your main opportunities','فرص التحسين الرئيسية'),evaluation.improvements]]){
    if(!items?.length)continue;section.append(node('h3',heading));const ul=node('ul');for(const item of items)ul.append(node('li',item));section.append(ul);
  }
  if(evaluation.competencies?.length){
    section.append(node('h3',t('Skills for this interview category','مهارات نوع المقابلة')));
    const grid=node('div',undefined,'report-skills');
    for(const c of evaluation.competencies){const card=node('section',undefined,'report-skill');const label=labels[c.key]?t(...labels[c.key]):c.key;
      card.append(node('h4',label+' · '+c.score+'/100'));const meter=node('meter');meter.min=0;meter.max=100;meter.value=c.score;meter.setAttribute('aria-label',label);card.append(meter,node('p',c.explanation));grid.append(card);
    }section.append(grid);
  }
  if(evaluation.answers?.length){
    section.append(node('h3',t('Question-by-question coaching','تدريب لكل سؤال')));
    section.append(node('small',t('Open a question to see why it received its score and how to improve it.','افتح السؤال لمعرفة سبب الدرجة وكيفية تحسين إجابتك.')));
    for(const a of evaluation.answers){const detail=node('details',undefined,'report-answer');
      detail.append(node('summary',t('Question ','السؤال ')+a.questionNumber+' · '+a.score+'/100'));
      detail.append(node('h4',a.question));paragraph(detail,t('Why this score:','سبب الدرجة:'),a.rationale);
      paragraph(detail,t('What worked:','ما نجح:'),a.strength);paragraph(detail,t('Improve next:','التحسين التالي:'),a.improvement);
      detail.append(node('h4',t('Suggested answer draft','مسودة إجابة مقترحة')),node('p',a.suggestedAnswer,'report-draft'));
      detail.append(node('small',t('Adapt this draft to your own experience. Replace brackets with true details and verify every fact.','عدّل المسودة لتناسب خبرتك. استبدل الأقواس بتفاصيل حقيقية وتحقق من كل معلومة.')));
      paragraph(detail,t('Practice follow-up:','سؤال متابعة للتدريب:'),a.followUp);section.append(detail);
    }
  }
  if(evaluation.reportVersion>=2){for(const [heading,feedback,missing,note] of [
    [t('Voice answer coaching','تدريب الإجابة الصوتية'),evaluation.voiceFeedback,t('No voice answer was submitted.','لم تُرسل إجابة صوتية.'),t('This assesses answer content, not accent or vocal delivery.','هذا تقييم لمحتوى الإجابة وليس للهجة أو الأداء الصوتي.')],
    [t('CV consistency coaching','تدريب اتساق السيرة الذاتية'),evaluation.cvFeedback,t('No CV context was submitted.','لم تُرسل معلومات السيرة الذاتية.'),t('This compares interview evidence with the supplied CV; it is not a hiring decision.','يقارن هذا القسم أدلة الإجابات بالسيرة المقدمة، ولا يمثل قرار توظيف.')],
  ]){section.append(node('h3',heading),node('small',note));if(!feedback){section.append(node('p',missing));continue;}
    section.append(node('p',feedback.assessment));paragraph(section,t('Strength:','نقطة قوة:'),feedback.strength);paragraph(section,t('Next improvement:','التحسين التالي:'),feedback.improvement);paragraph(section,t('Exercise:','تمرين:'),feedback.exercise);
  }}
  if(evaluation.practicePlan?.length){section.append(node('h3',t('Your next practice plan','خطة تدريبك التالية')));
    const plan=node('ol',undefined,'report-plan');for(const step of evaluation.practicePlan){const li=node('li');li.append(node('h4',step.focus));paragraph(li,t('Action:','الإجراء:'),step.action);paragraph(li,t('Exercise:','التمرين:'),step.exercise);paragraph(li,t('Success looks like:','مقياس النجاح:'),step.successCriteria);plan.append(li);}section.append(plan);
    section.append(node('p',t('Revise the lowest-scoring answers, rehearse the follow-ups, then repeat the practice to compare progress in your history.','حسّن الإجابات الأقل درجة وتدرّب على أسئلة المتابعة، ثم أعد التدريب لمقارنة تقدمك في سجل حسابك.')));
  }
  container.append(section);
}

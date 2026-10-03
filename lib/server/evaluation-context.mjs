import { questionBank } from '../../practice-questions.mjs';

export const categoryRubrics = {
  hr: {label:'HR', focus:'Assess professional communication, motivation, self-awareness, teamwork, adaptability, and evidence of achievements. Motivation, future goals, introductory and hypothetical questions do not require a past STAR example or invented metrics.'},
  customerService: {label:'Customer Service', focus:'Assess empathy, listening, de-escalation, clear communication, ownership, realistic commitments, escalation, accurate resolution, and customer privacy. Reward relevant service evidence and metrics when appropriate; generic HR answers that do not answer the customer-service question should score lower for relevance.'},
  itCloud: {label:'IT & Cloud', focus:'Assess technical correctness, systematic troubleshooting, security and least privilege, reliability, recovery, deployment risk, monitoring, and justified technical tradeoffs. Conceptual technical questions require accurate explanations, not STAR stories or invented performance metrics.'},
};

export function validCategoryQuestions(body) {
  const bank = questionBank[body?.category];
  if (!bank || !['english','arabic'].includes(body.language) || !Array.isArray(body.responses)) return false;
  const seen = new Set();
  return body.responses.every(item => {
    const question = bank.find(q => q.id === item?.questionId);
    if (!question || seen.has(question.id) || item.question !== question[body.language]) return false;
    seen.add(question.id);
    return true;
  });
}

export function evaluationContext(body, voiceAnswer) {
  return {
    category: categoryRubrics[body.category].label,
    language: body.language,
    responses: body.responses.map((item,index) => ({questionNumber:index+1,
      question:questionBank[body.category].find(q=>q.id===item.questionId)[body.language],answer:item.answer})),
    ...(body.cvText ? {cvText:body.cvText.trim()} : {}),
    ...(voiceAnswer ? {voice:{question:body.voice.question,answer:voiceAnswer}} : {}),
  };
}

export function readableFeedback(items, body) {
  const numberById = new Map(body.responses.map((item,index)=>[item.questionId,index+1]));
  return items.map(item => item.replace(/\b(?:hr|cs|it)_\d+\b/g, id => {
    const number = numberById.get(id);
    if (!number) throw new Error('Feedback referenced a question outside the submitted interview');
    return body.language === 'arabic' ? `السؤال ${number}` : `Question ${number}`;
  }));
}

import {levelQuestionBank,assessmentLevels,levelRubrics} from '../../level-questions.mjs';
import {validLanguage,translate} from '../../locales.mjs';
import { questionBank } from '../../practice-questions.mjs';
import { previousQuestionBanks } from './question-bank-history.mjs';

// Use only published canonical wording, including the wording an open client saw.
function canonicalQuestion(body, item) {
  for (const bank of [questionBank, ...previousQuestionBanks, Object.fromEntries(Object.entries(levelQuestionBank).map(([c,levels])=>[c,Object.values(levels).flat()]))]) {
    const question = bank[body.category]?.find(q => q.id === item?.questionId);
    if (question && (question[body.language] || (question.level ? question.english : undefined)) === item.question) return question[body.language] || question.english;
  }
  return undefined;
}

export const categoryRubrics = {
  marketing: {label:'Marketing',focus:'Assess audience insight, positioning, channel selection, campaign experimentation, measurement and attribution limits, budget allocation, truthful claims and consent. Require justified metrics; never invent results.'},
  sales: {label:'Sales',focus:'Assess discovery, qualification, customer value, objection handling, negotiation, pipeline evidence, responsible commitments, margin and handoff. Reward listening and evidence rather than pressure tactics or fabricated revenue.'},
  softwareDevelopment: {label:'Software Development',focus:'Assess technical correctness, decomposition, algorithmic tradeoffs, debugging, testing, API and data design, secure coding, maintainability and reliability. Conceptual questions need accurate reasoning rather than forced STAR stories; assess tradeoffs at the selected level.'},
  hr: {label:'HR', focus:'Assess professional communication, motivation, self-awareness, teamwork, adaptability, and evidence of achievements. Motivation, future goals, introductory and hypothetical questions do not require a past STAR example or invented metrics.'},
  customerService: {label:'Customer Service', focus:'Assess empathy, listening, de-escalation, clear communication, ownership, realistic commitments, escalation, accurate resolution, and customer privacy. Reward relevant service evidence and metrics when appropriate; generic HR answers that do not answer the customer-service question should score lower for relevance.'},
  itCloud: {label:'IT & Cloud', focus:'Assess technical correctness, systematic troubleshooting, security and least privilege, reliability, recovery, deployment risk, monitoring, and justified technical tradeoffs. Conceptual technical questions require accurate explanations, not STAR stories or invented performance metrics.'},
};

export function validCategoryQuestions(body) {
  const bank = body?.level ? levelQuestionBank[body.category]?.[body.level]?.filter(q=>q.access==='paid') : questionBank[body?.category];
  if (!bank || !validLanguage(body.language) || !Array.isArray(body.responses)) return false;
  const seen = new Set();
  return body.responses.every(item => {
    const question = bank.find(q => q.id === item?.questionId);
    if (!question || seen.has(question.id) || canonicalQuestion(body, item) === undefined) return false;
    seen.add(question.id);
    return true;
  });
}

export function evaluationContext(body, voiceAnswer) {
  if (!validCategoryQuestions(body)) throw new Error('Invalid canonical interview questions');
  return {
    category: categoryRubrics[body.category].label,
    language: body.language,
    ...(body.level ? {level:assessmentLevels[body.level][0],levelExpectations:levelRubrics[body.level]} : {}),
    responses: body.responses.map((item,index) => ({questionNumber:index+1,
      question:canonicalQuestion(body,item),answer:item.answer})),
    ...(body.cvText ? {cvText:body.cvText.trim()} : {}),
    ...(voiceAnswer ? {voice:{question:body.voice.question,answer:voiceAnswer}} : {}),
  };
}

export function readableFeedback(items, body) {
  const numberById = new Map(body.responses.map((item,index)=>[item.questionId,index+1]));
  return items.map(item => item.replace(/\b(?:(?:hr|cs|it)_\d+|(?:hr|customerService|itCloud|marketing|sales|dev)_(?:entry|mid|expert|consultant)_\d+_\d+)\b/g, id => {
    const number = numberById.get(id);
    if (!number) throw new Error('Feedback referenced a question outside the submitted interview');
    return `${translate('question',body.language)} ${number}`;
  }));
}

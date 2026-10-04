import {test} from 'node:test';
import assert from 'node:assert/strict';
import {languages,validLanguage,normalizeLanguage,translate,ui,preferredLanguage,rememberLanguage} from '../locales.mjs';
import {landingCopy} from '../landing-copy.mjs';
import {questionBank,paidQuestions} from '../practice-questions.mjs';
import {validCategoryQuestions,evaluationContext,readableFeedback} from '../lib/server/evaluation-context.mjs';
import {reportText} from '../report-translations.mjs';
test('every question and visible copy has nonempty translations for all five languages',()=>{
  assert.equal(Object.keys(languages).length,5);
  for(const bank of Object.values(questionBank))for(const q of bank)for(const language of Object.keys(languages))assert.ok(q[language]?.trim().length>5,q.id+' '+language);
  for(const [key,row] of Object.entries({...ui,...landingCopy})){assert.equal(row.length,5,key);assert.ok(row.every(value=>typeof value==='string'&&value.trim()),key);}
});
test('all monthly sets retain IDs and accept only exact questions in their chosen language',()=>{
  for(const category of Object.keys(questionBank))for(const language of Object.keys(languages))for(const month of [0,1,9,11]){
    const questions=paidQuestions(category,new Date(Date.UTC(2026,month,1)));
    const body={category,language,responses:questions.map(q=>({questionId:q.id,question:q[language],answer:'An answer'}))};
    assert.equal(validCategoryQuestions(body),true);assert.equal(new Set(questions.map(q=>q.id)).size,15);
    assert.equal(evaluationContext(body,null).responses[0].question,questions[0][language]);
    assert.equal(readableFeedback([questions[0].id],body)[0],translate('question',language)+' 1');
    body.responses[0].question=questions[0][language==='english'?'french':'english'];assert.equal(validCategoryQuestions(body),false);
  }
  assert.equal(validLanguage('constructor'),false);assert.equal(validLanguage('italian'),false);
});
test('language preferences support old English/Arabic values and safe fallback',()=>{
  assert.equal(normalizeLanguage('ar'),'arabic');assert.equal(normalizeLanguage('fr'),'french');assert.equal(normalizeLanguage('unknown'),'english');
  const data=new Map([['mostaed-lang','ar']]);globalThis.localStorage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
  assert.equal(preferredLanguage(),'arabic');rememberLanguage('german');assert.equal(preferredLanguage(),'german');
  assert.equal(translate('progress','spanish',{count:2,total:15}),'2 / 15 respuestas completadas');
  delete globalThis.localStorage;
});
test('report headings and skill names use the selected locale',()=>{
  assert.equal(reportText('Your coaching report','تقريرك','french'),'Votre rapport de coaching');
  assert.equal(reportText('Technical accuracy','الدقة التقنية','spanish'),'Precisión técnica');
  assert.equal(reportText('Not evaluated','لم يُقيّم','german'),'Nicht bewertet');
});

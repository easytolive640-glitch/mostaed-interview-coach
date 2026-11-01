import {test} from 'node:test';
import assert from 'node:assert/strict';
import {paidQuestions} from '../practice-questions.mjs';
import {previousQuestionBanks} from '../lib/server/question-bank-history.mjs';
import {validCategoryQuestions,evaluationContext,readableFeedback,categoryRubrics} from '../lib/server/evaluation-context.mjs';
const makeBody=(category,language='english')=>({category,language,responses:paidQuestions(category).map(q=>({questionId:q.id,question:q[language],answer:'A sample answer'}))});
test('open sessions retain published wording after a question refresh in all five languages',()=>{
  for(const bank of previousQuestionBanks) for(const category of ['hr','customerService','itCloud']) {
    for(const language of ['english','arabic','french','spanish','german']) {
      const body={category,language,responses:bank[category].slice(0,15).map(q=>({questionId:q.id,question:q[language],answer:'An answer to the original question'}))};
      assert.equal(validCategoryQuestions(body),true);
      assert.deepEqual(evaluationContext(body,null).responses.map(x=>x.question),body.responses.map(x=>x.question));
      body.responses[0].question += ' injected wording';
      assert.equal(validCategoryQuestions(body),false);
      assert.throws(()=>evaluationContext(body,null),/Invalid canonical/);
    }
  }
});
test('all categories and languages preserve their canonical questions and visible numbering',()=>{
  for(const category of ['hr','customerService','itCloud']) for(const language of ['english','arabic']) {
    const body=makeBody(category,language);assert.equal(validCategoryQuestions(body),true);
    const context=evaluationContext(body,null);assert.equal(context.category,categoryRubrics[category].label);
    assert.equal(context.responses.length,15);assert.equal(context.responses[14].questionNumber,15);
    assert.equal(context.responses[0].questionId,undefined);
  }
});
test('category and question mismatch, altered text and duplicate IDs are rejected',()=>{
  const body=makeBody('hr');body.category='customerService';assert.equal(validCategoryQuestions(body),false);
  const changed=makeBody('hr');changed.responses[0].question='Different question';assert.equal(validCategoryQuestions(changed),false);
  const duplicates=makeBody('hr');duplicates.responses[1]=duplicates.responses[0];assert.equal(validCategoryQuestions(duplicates),false);
});
test('feedback refers to visible question positions rather than bank IDs',()=>{
  const body=makeBody('customerService');const id=body.responses[5].questionId;
  assert.deepEqual(readableFeedback([`Improve ${id}`],body),['Improve Question 6']);
  body.language='arabic';assert.deepEqual(readableFeedback([`Improve ${id}`],body),['Improve السؤال 6']);
  assert.throws(()=>readableFeedback(['Improve hr_1'],body));
});

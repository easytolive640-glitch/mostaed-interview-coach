import test from 'node:test';
import assert from 'node:assert/strict';
import {assessmentLevels,levelQuestionBank} from '../level-questions.mjs';
import {freeQuestions,paidQuestions} from '../practice-questions.mjs';
import {validCategoryQuestions,evaluationContext} from '../lib/server/evaluation-context.mjs';
test('every category and level has separate complete free and paid sets with valid canonical questions',()=>{
for(const category of Object.keys(levelQuestionBank)) for(const level of Object.keys(assessmentLevels)) {
 const free=freeQuestions(category,new Date('2026-11-01'),level);
 const paid=paidQuestions(category,new Date('2026-11-01'),level);
 assert.equal(free.length,5);assert.equal(paid.length,15);
 assert.equal(new Set([...free,...paid].map(q=>q.id)).size,20);
 for(const language of ['english','arabic','french','spanish','german']) {
 const body={category,level,language,responses:paid.map(q=>({questionId:q.id,question:q[language],answer:'example'}))};
 assert.ok(validCategoryQuestions(body));assert.equal(evaluationContext(body).level,assessmentLevels[level][0]);
 assert.ok(!validCategoryQuestions({...body,level:level==='entry'?'expert':'entry'}));
 for(const q of paid) {assert.ok(q[language] && q[language].length<=300);if(language!=='english') assert.notEqual(q[language],q.english);assert.ok(q.id.length<=32);}
 }
}
});

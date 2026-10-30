import test from 'node:test';
import assert from 'node:assert/strict';
import { freeQuestions, paidQuestions, questionBank } from '../practice-questions.mjs';
for (const category of Object.keys(questionBank)) test(category+' provides 15 distinct bilingual questions across a full year',()=>{for(let month=0;month<12;month++){const selected=paidQuestions(category,new Date(Date.UTC(2026,month,1)));assert.equal(selected.length,15);assert.equal(new Set(selected.map(q=>q.id)).size,15);assert.ok(selected.every(q=>q.arabic&&q.english));assert.deepEqual(selected.slice(0,5),freeQuestions(category,new Date(Date.UTC(2026,month,1))));}});
test('both tiers change at the UTC month boundary and remain stable within a month',()=>{
 for(const category of Object.keys(questionBank)) for(const select of [freeQuestions,paidQuestions]) {
 const a=select(category,new Date('2026-12-01T00:00:00Z'));
 assert.deepEqual(a,select(category,new Date('2026-12-31T23:59:59Z')));
 assert.notDeepEqual(a,select(category,new Date('2027-01-01T00:00:00Z')));
 assert.equal(new Set(a.map(q=>q.id)).size,a.length);
 }
});

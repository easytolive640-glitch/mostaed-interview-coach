import test from 'node:test';
import assert from 'node:assert/strict';
import { paidQuestions, questionBank } from '../practice-questions.mjs';
for (const category of Object.keys(questionBank)) test(category+' provides 15 distinct bilingual questions across a full year',()=>{for(let month=0;month<12;month++){const selected=paidQuestions(category,new Date(Date.UTC(2026,month,1)));assert.equal(selected.length,15);assert.equal(new Set(selected.map(q=>q.id)).size,15);assert.ok(selected.every(q=>q.arabic&&q.english));assert.deepEqual(selected.slice(0,5),questionBank[category].slice(0,5));}});
test('monthly rotation changes extra questions without changing the five core questions',()=>{const a=paidQuestions('hr',new Date('2026-10-01Z'));const b=paidQuestions('hr',new Date('2026-11-01Z'));assert.notDeepEqual(a.slice(5),b.slice(5));assert.deepEqual(a.slice(0,5),b.slice(0,5));});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../paid-practice.js',import.meta.url),'utf8');
test('actual page deadline locks all inputs and submits only once after delayed clock ticks',()=>{
 const fields=[{disabled:false,value:'answered'},{disabled:false,value:''}];const output={textContent:''};let submits=0,now=0;
 const context=vm.createContext({Date:{now:()=>now},String,Math,clearInterval(){},$:id=>id==='practice'?{querySelectorAll:()=>fields}:output,submitAssessment:timed=>{assert.equal(timed,true);submits++;},deadline:3600000,assessmentFinished:false,assessmentExpired:false,submitting:false,pendingSubmission:null,frozenSubmission:null,clockInterval:1});
 vm.runInContext(source.slice(source.indexOf('function freezeInputs'),source.indexOf("$('startAssessment').addEventListener")),context);
 vm.runInContext('tickAssessment()',context);assert.equal(output.textContent,'60:00');
 now=3599999;vm.runInContext('tickAssessment()',context);assert.equal(output.textContent,'00:01');assert.equal(submits,0);
 now=3605000;vm.runInContext('tickAssessment();tickAssessment()',context);assert.equal(submits,1);assert.ok(fields.every(f=>f.disabled));assert.equal(fields[1].value,'');
});

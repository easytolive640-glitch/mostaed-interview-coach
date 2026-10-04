import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkedReport,reportSchema,competencies} from '../lib/server/evaluation-report.mjs';
import {renderEvaluation} from '../evaluation-report.mjs';
const makeBody=(category='hr',count=15,cv=false)=>({category,language:'english',responses:Array.from({length:count},(_,i)=>({question:'Canonical question '+(i+1)})),...(cv?{cvText:'Provided CV context'}:{})});
const feedback={assessment:'Evidence assessment',strength:'Specific strength',improvement:'Specific next step',exercise:'Repeat with a genuine example'};
const fixture=(body,voice=false)=>({summary:'Personalized coaching summary',strengths:['Relevant examples'],improvements:['Add useful detail'],
  answers:body.responses.map((_,i)=>({questionNumber:i+1,score:80,rationale:'Relevant but lacks detail',strength:'Clear action',improvement:'Explain the outcome',suggestedAnswer:'I took action and [add your true outcome].',followUp:'What would you change next time?'})),
  competencies:competencies[body.category].map(key=>({key,score:70,explanation:'Evidence from Question 1'})),
  practicePlan:[1,2,3].map(priority=>({priority,focus:'Practice focus',action:'Revise a weak answer',exercise:'Answer the follow-up aloud',successCriteria:'Explain action and outcome clearly'})),
  voiceScore:voice?60:null,cvScore:body.cvText?90:null,voiceFeedback:voice?{...feedback}:null,cvFeedback:body.cvText?{...feedback}:null});
test('all categories, question counts and optional inputs produce deterministic score weights',()=>{
  for(const category of Object.keys(competencies))for(const count of [10,15])for(const cv of [false,true])for(const voice of [false,true]){
    const body=makeBody(category,count,cv),result=checkedReport(fixture(body,voice),body,voice);
    assert.equal(result.textScore,80);assert.equal(result.score,voice?(cv?77:76):(cv?81:80));
    assert.equal(result.scoringWeights.text+result.scoringWeights.voice+result.scoringWeights.cv,100);
    assert.equal(result.answers[count-1].question,body.responses[count-1].question);
    assert.equal(result.reportVersion,2);assert.equal(reportSchema(body,voice).properties.answers.minItems,count);
  }
});
test('missing, duplicate, out-of-range and wrong-category entries fail before persistence',()=>{
  const body=makeBody();
  for(const mutate of [r=>r.answers.pop(),r=>r.answers[1].questionNumber=1,r=>r.answers[0].score=101,
    r=>r.competencies[0].key='security',r=>r.competencies[1].key=r.competencies[0].key,
    r=>r.practicePlan[1].priority=1,r=>r.answers[0].rationale='',r=>r.unexpected='extra',r=>r.voiceFeedback=feedback]){
    const result=fixture(body);mutate(result);assert.throws(()=>checkedReport(result,body,false));
  }
  const voiceBody=makeBody('hr',15,true),result=fixture(voiceBody,true);result.voiceScore=null;
  assert.throws(()=>checkedReport(result,voiceBody,true));
});
test('text average and question order are computed from individual answers',()=>{
  const body=makeBody('itCloud',10),r=fixture(body);r.answers[0].score=0;r.answers.reverse();r.practicePlan.reverse();
  const report=checkedReport(r,body,false);assert.equal(report.textScore,72);assert.equal(report.score,72);
  assert.equal(report.answers[0].questionNumber,1);assert.equal(report.practicePlan[0].priority,1);
});
class Element {
  constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.style={};this.textContent='';}
  append(...children){this.children.push(...children);}
  setAttribute(key,value){this.attributes[key]=value;}
  set innerHTML(value){throw Error('Unsafe HTML rendering');}
}
const allNodes=el=>[el,...el.children.flatMap(allNodes)];
test('full reports render safely in all five languages; legacy history remains readable',()=>{
  globalThis.document={createElement:tag=>new Element(tag)};
  for(const language of ['english','arabic','french','spanish','german']){
    const body=makeBody('customerService'),r=fixture(body);r.answers[0].suggestedAnswer='<img src=x onerror=alert(1)>';
    const root=new Element('div');renderEvaluation(root,checkedReport(r,body,false),language,'customerService');
    const nodes=allNodes(root);assert.equal(nodes.filter(n=>n.tag==='details').length,15);
    assert.equal(nodes.filter(n=>n.tag==='meter').length,4);assert.equal(nodes.some(n=>n.tag==='img'),false);
    assert.equal(nodes.some(n=>n.textContent==='<img src=x onerror=alert(1)>'),true);
    assert.equal(root.children[0].dir,language==='arabic'?'rtl':'ltr');
  }
  const root=new Element('div');renderEvaluation(root,{score:70,textScore:70,voiceScore:null,cvScore:null,strengths:['Legacy strength'],improvements:['Legacy advice']});
  assert.equal(allNodes(root).some(n=>n.textContent==='Legacy strength'),true);
  delete globalThis.document;
});

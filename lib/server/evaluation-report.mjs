const text = (maxLength) => ({type:'string',minLength:1,maxLength});
const score = {type:'integer',minimum:0,maximum:100};
const object = properties => ({type:'object',additionalProperties:false,properties,required:Object.keys(properties)});
const list = (items,minItems,maxItems=minItems) => ({type:'array',items,minItems,maxItems});
const inputFeedback = object({assessment:text(600),strength:text(350),improvement:text(450),exercise:text(450)});
export const competencies = {
  hr:['communication','motivation','teamwork','selfAwareness'],
  customerService:['empathy','resolution','ownership','communication'],
  itCloud:['technicalAccuracy','troubleshooting','security','reliability'],
};
export function reportSchema(body,hasVoice) {
  return object({
    summary:text(900),strengths:list(text(400),1,3),improvements:list(text(400),1,3),
    answers:list(object({questionNumber:{type:'integer',minimum:1,maximum:body.responses.length},score,
      rationale:text(500),strength:text(350),improvement:text(500),suggestedAnswer:text(1100),followUp:text(300)}),body.responses.length),
    competencies:list(object({key:{type:'string',enum:competencies[body.category]},score,explanation:text(500)}),4),
    practicePlan:list(object({priority:{type:'integer',minimum:1,maximum:3},focus:text(200),action:text(400),exercise:text(500),successCriteria:text(400)}),3),
    voiceScore:hasVoice?score:{type:'null'},cvScore:body.cvText?score:{type:'null'},
    voiceFeedback:hasVoice?inputFeedback:{type:'null'},cvFeedback:body.cvText?inputFeedback:{type:'null'},
  });
}
// Validate the full structured response before saving or exposing a report.
function check(value,schema) {
  if(schema.type==='null')return value===null;
  if(schema.type==='integer')return Number.isInteger(value)&&value>=schema.minimum&&value<=schema.maximum;
  if(schema.type==='string')return typeof value==='string'&&(!schema.enum||schema.enum.includes(value))&&
    (schema.minLength===undefined||value.trim().length>=schema.minLength)&&(schema.maxLength===undefined||value.length<=schema.maxLength);
  if(schema.type==='array')return Array.isArray(value)&&value.length>=schema.minItems&&value.length<=schema.maxItems&&value.every(item=>check(item,schema.items));
  if(schema.type==='object')return value!==null&&typeof value==='object'&&!Array.isArray(value)&&
    Object.keys(value).length===schema.required.length&&schema.required.every(key=>Object.hasOwn(value,key)&&check(value[key],schema.properties[key]));
  return false;
}
export function checkedReport(value,body,hasVoice) {
  if(!check(value,reportSchema(body,hasVoice)))throw Error('Invalid detailed evaluation output');
  const answers=[...value.answers].sort((a,b)=>a.questionNumber-b.questionNumber);
  if(answers.some((a,i)=>a.questionNumber!==i+1)||new Set(value.competencies.map(c=>c.key)).size!==4||
    new Set(value.practicePlan.map(p=>p.priority)).size!==3)throw Error('Duplicate or missing report entries');
  const textScore=Math.round(answers.reduce((sum,a)=>sum+a.score,0)/answers.length);
  const hasCv=Boolean(body.cvText);
  const textWeight=hasVoice?(hasCv?0.7:0.8):(hasCv?0.9:1);
  const total=Math.round(textScore*textWeight+(hasVoice?value.voiceScore*0.2:0)+(hasCv?value.cvScore*0.1:0));
  return {...value,reportVersion:2,score:total,textScore,
    answers:answers.map(a=>({...a,question:body.responses[a.questionNumber-1].question})),
    practicePlan:[...value.practicePlan].sort((a,b)=>a.priority-b.priority),
    scoringWeights:{text:Math.round(textWeight*100),voice:hasVoice?20:0,cv:hasCv?10:0}};
}

import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{assessmentTerminated} from '../lib/server/assessment-lock.mjs';
const user={id:'12345678-1234-1234-1234-123456789abc'};
const response=()=>({setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});
test('termination status is scoped to authenticated owner and fails closed on storage failure',async()=>{
 assert.equal(await assessmentTerminated(user,async url=>{assert.ok(url.includes(user.id));assert.ok(url.includes('assessment_terminated'));return {ok:true,json:async()=>[{id:'lock'}]};}),true);
 assert.equal(await assessmentTerminated(user,async()=>({ok:true,json:async()=>[]})),false);
 await assert.rejects(()=>assessmentTerminated(user,async()=>({ok:false})));
});
test('customer cannot clear a termination lock or terminate another account',async()=>{
 const original=global.fetch;let calls=[];
 global.fetch=async(url,options)=>{calls.push([url,options]);if(url.endsWith('/auth/v1/user'))return {ok:true,json:async()=>user};if(options?.method==='POST')return {ok:true};return {ok:true,json:async()=>[]};};
 try{
  const denied=response();await handler({method:'POST',headers:{},body:{action:'reset'}},denied);assert.equal(denied.code,400);assert.equal(calls.length,0);
  const res=response();await handler({method:'POST',headers:{authorization:'Bearer fixture'},body:{action:'terminate',user_id:'another'}},res);assert.equal(res.body.terminated,true);
  const saved=JSON.parse(calls.find(([,options])=>options?.method==='POST')[1].body);assert.equal(saved.user_id,user.id);assert.equal(saved.evaluation.notCheatingVerdict,true);
 }finally{global.fetch=original;}
});

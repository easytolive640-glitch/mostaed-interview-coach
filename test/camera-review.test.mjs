import test from 'node:test';
import assert from 'node:assert/strict';
import {validCameraEvidence,reviewCamera} from '../lib/server/camera-review.mjs';
const jpeg='data:image/jpeg;base64,'+Buffer.from([255,216,255,...Array(30).fill(0)]).toString('base64');
const evidence={consent:true,recording:true,durationSeconds:5,frames:[{seconds:0,image:jpeg}]};
test('reject missing consent, absent recordings, invalid images and out-of-range samples',()=>{
 assert.equal(validCameraEvidence(evidence),true);
 for(const bad of [undefined,{...evidence,consent:false},{...evidence,recording:false},{...evidence,frames:[]},{...evidence,frames:Array(11).fill(evidence.frames[0])},{...evidence,frames:[{seconds:6,image:jpeg}]},{...evidence,frames:[{seconds:0,image:'data:image/jpeg;base64,AAAA'}]}])assert.equal(validCameraEvidence(bad),false);
});
test('AI review sends bounded images with storage disabled and returns observations without verdict or score',async()=>{
 const result=await reviewCamera(evidence,async(url,options)=>{
  const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.input[0].content[1].type,'input_image');
  return {ok:true,json:async()=>({output_text:JSON.stringify({observations:[{sampleIndex:0,event:'one_person_visible'}]})})};
 });
 assert.equal(result.status,'completed');assert.equal(result.affectsScore,false);assert.equal(result.humanReviewRequired,true);
 assert.deepEqual(result.observations,[{seconds:0,event:'one_person_visible'}]);
});
test('provider failure or malformed observations never means clean or cheating',async()=>{
 for(const fetcher of [async()=>{throw Error('offline')},async()=>({ok:true,json:async()=>({output_text:'{"observations":[]}'})})]){
  const result=await reviewCamera(evidence,fetcher);assert.equal(result.status,'unavailable');assert.deepEqual(result.observations,[]);
 }
});

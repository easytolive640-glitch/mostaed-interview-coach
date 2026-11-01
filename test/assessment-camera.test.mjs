import test from 'node:test';
import assert from 'node:assert/strict';
import {cameraIsLive} from '../assessment-camera.mjs';
test('submission camera check rejects missing, stopped, disabled and muted video',()=>{
  assert.equal(cameraIsLive(),false);
  const track={readyState:'live',enabled:true,muted:false};
  const stream={getVideoTracks:()=>[track]};
  assert.equal(cameraIsLive(stream),true);
  for(const change of [{readyState:'ended'},{enabled:false},{muted:true}]) assert.equal(cameraIsLive({getVideoTracks:()=>[{...track,...change}]}),false);
  assert.equal(cameraIsLive({getVideoTracks:()=>[]}),false);
});

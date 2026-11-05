import test from 'node:test';
import assert from 'node:assert/strict';
import {createAttemptGuard} from '../assessment-focus.mjs';
test('leaving before start is allowed; leaving after start blocks permanently, including reset',()=>{
 const guard=createAttemptGuard();
 assert.equal(guard.canSubmit(),false);
 guard.leave(); assert.equal(guard.invalid,false);
 guard.start(); assert.equal(guard.canSubmit(),true);
 guard.leave(); assert.equal(guard.canSubmit(),false);
 assert.equal(guard.start(),false);
 assert.equal(guard.reset(),false); assert.equal(guard.canSubmit(),false);
 assert.equal(guard.start(),false);
});

import {initAssessmentFocus} from '../assessment-focus.mjs';
test('camera required before start and fields lock immediately when camera becomes unavailable',()=>{
 const oldDocument=global.document,oldWindow=global.window;
 const element=()=>({disabled:false,hidden:false,addEventListener(name,fn){this[name]=fn;}});
 const start=element(),restart=element(),status={},questions=element(),voice=element();let ready=false;
 global.document={visibilityState:'visible',addEventListener(){}};global.window={addEventListener(){}};
 try{
  const guard=initAssessmentFocus({start,restart,status,questions,questionExtras:[voice],cameraReady:()=>ready,onChange(){},onRestart(){}});
  assert.equal(start.disabled,true);start.click();assert.equal(guard.started,false);assert.equal(questions.disabled,true);assert.equal(questions.hidden,true);assert.equal(voice.hidden,true);
  ready=true;guard.refresh();assert.equal(start.disabled,false);start.click();assert.equal(guard.started,true);assert.equal(questions.disabled,false);assert.equal(questions.hidden,false);assert.equal(voice.hidden,false);
  ready=false;guard.refresh();assert.equal(questions.disabled,true);
 }finally{global.document=oldDocument;global.window=oldWindow;}
});

test('questions stay locked until the server reserves the start', async () => {
  const oldDocument = global.document, oldWindow = global.window;
  const element = () => ({addEventListener(name, fn) { this[name] = fn; }});
  const start = element(), questions = element();
  let resolve;
  const reservation = new Promise(done => { resolve = done; });
  global.document = {visibilityState:'visible',addEventListener(){}};
  global.window = {addEventListener(){}};
  try {
    const guard = initAssessmentFocus({start,restart:element(),status:{},questions,
      onChange(){},beforeStart:() => reservation});
    const pending = start.click();
    assert.equal(questions.hidden, true);
    assert.equal(start.disabled, true);
    assert.equal(guard.started, false);
    resolve(true);
    await pending;
    assert.equal(questions.hidden, false);
    assert.equal(guard.started, true);
  } finally {
    global.document = oldDocument;
    global.window = oldWindow;
  }
});

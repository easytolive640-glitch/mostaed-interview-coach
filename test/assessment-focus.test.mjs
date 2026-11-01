import test from 'node:test';
import assert from 'node:assert/strict';
import {createAttemptGuard} from '../assessment-focus.mjs';
test('leaving before start is allowed; leaving after start permanently blocks until reset',()=>{
 const guard=createAttemptGuard();
 assert.equal(guard.canSubmit(),false);
 guard.leave(); assert.equal(guard.invalid,false);
 guard.start(); assert.equal(guard.canSubmit(),true);
 guard.leave(); assert.equal(guard.canSubmit(),false);
 assert.equal(guard.start(),false);
 guard.reset(); assert.equal(guard.canSubmit(),false);
 guard.start(); assert.equal(guard.canSubmit(),true);
});

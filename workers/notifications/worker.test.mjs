import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{eligible,welcomeMessage,checkSite,deliver} from './worker.mjs';
const user=(age=1000)=>({id:'11111111-1111-4111-8111-111111111111',email:'fixture@example.com',email_confirmed_at:'yes',created_at:new Date(Date.now()-age).toISOString()});
test('welcomes require verified recent accounts and use their authenticated address',()=>{
 assert.equal(eligible(user()),true);
 assert.equal(eligible({...user(),email_confirmed_at:null}),false);
 assert.equal(eligible(user(86401000)),false);
 assert.equal(eligible(user(-10000)),false);
 assert.equal(welcomeMessage(user().email).to,'fixture@example.com');
 assert.equal(welcomeMessage(user().email).from.email,'info@mostaedcoach.com');
});
test('notification endpoint rejects unauthenticated and cross-origin send requests',async()=>{
 assert.equal((await worker.fetch(new Request('https://mostaedcoach.com/api/notifications',{method:'POST',headers:{Origin:'https://evil.example'}}),{},{})).status,403);
 assert.equal((await worker.fetch(new Request('https://mostaedcoach.com/api/notifications',{method:'POST',headers:{Origin:'https://mostaedcoach.com'}}),{},{})).status,401);
 assert.equal((await worker.fetch(new Request('https://mostaedcoach.com/api/other'),{},{})).status,404);
});
function checkDatabase(){
 const checks=new Map(),jobs=new Map();
 return {checks,jobs,prepare(sql){return {bind(...args){return {async first(){return checks.get(args[0])||null;},async run(){
  if(sql.startsWith('INSERT INTO checks'))checks.set(args[0],{failures:args[1]});
  else if(sql.startsWith('INSERT OR IGNORE INTO mail_jobs'))jobs.set(args[0],args);
  else throw Error('Unexpected test SQL');
 }}}};}};
}
test('health alerts need two consecutive failures; healthy response resets counter',async()=>{
 const DB=checkDatabase(),env={DB};
 await checkSite(env,async()=>new Response('',{status:503}));assert.equal(DB.jobs.size,0);
 await checkSite(env,async()=>new Response('',{status:503}));assert.equal(DB.jobs.size,2);
 await checkSite(env,async()=>new Response('',{status:503}));assert.equal(DB.jobs.size,2);
 await checkSite(env,async(url,options)=>{assert.equal(options.redirect,'manual');return new Response('',{status:200});});assert.equal(DB.checks.get('/').failures,0);
});
test('claimed, exhausted or completed jobs cannot send again',async()=>{
 let sent=0;const env={DB:{prepare(){return {bind(){return {first:async()=>null}}}}},EMAIL:{send:async()=>sent++}};
 assert.deepEqual(await deliver(env,'already-claimed'),{sent:false});assert.equal(sent,0);
});

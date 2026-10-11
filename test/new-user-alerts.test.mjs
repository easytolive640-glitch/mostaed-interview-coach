import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{sendNewUserAlert,newUserMessage} from '../lib/server/new-user-alerts.mjs';
process.env.RESEND_API_KEY='test';process.env.SUPABASE_URL='https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY='server';process.env.SUPABASE_PUBLISHABLE_KEY='public';
const user={id:'11111111-1111-4111-8111-111111111111',email_confirmed_at:'2026-10-11T00:00:00Z'};
const response=(data,status=200)=>({ok:status<300,status,json:async()=>data});
test('first login sends once; repeat login sends no email',async()=>{
 let sent=false,sends=0;
 globalThis.fetch=async(url,opts)=>{
  if(url.includes('claim_new_user'))return response(sent?null:{user_id:user.id,first_login_at:'2026-10-11T01:00:00Z',claim_token:user.id});
  if(url.includes('finish_new_user')){sent=true;return response(true);}
  if(url.includes('resend.com')){sends++;assert.equal(opts.headers['Idempotency-Key'],'new-user-first-login-'+user.id);const body=JSON.parse(opts.body);assert.deepEqual(body.to,['easytolive640@gmail.com']);assert.ok(!body.text.includes(user.id));return response({id:'mail1'});}
  throw Error('unexpected URL');
 };
 assert.equal((await sendNewUserAlert(user)).sent,true);
 assert.equal((await sendNewUserAlert(user)).sent,false);
 assert.equal(sends,1);
});
test('unconfirmed users never generate mail',async()=>{globalThis.fetch=()=>{throw Error('must not call');};assert.equal((await sendNewUserAlert({id:user.id})).sent,false);});
test('mail failure does not mark delivered',async()=>{
 let finished=false;
 globalThis.fetch=async url=>{if(url.includes('claim_new_user'))return response({user_id:user.id,first_login_at:'2026-10-11T01:00:00Z',claim_token:user.id});if(url.includes('finish_new_user'))finished=true;return response({},403);};
 await assert.rejects(sendNewUserAlert(user));assert.equal(finished,false);
});
test('anonymous and non-admin test requests denied',async()=>{
 let status;const res={setHeader(){},status(s){status=s;return this;},json(data){return data;}};
 globalThis.fetch=async()=>response({},401);await handler({method:'POST',headers:{},body:{}},res);assert.equal(status,401);
 globalThis.fetch=async()=>response({...user,email:'visitor@example.com'});await handler({method:'POST',headers:{authorization:'Bearer valid'},body:{action:'test'}},res);assert.equal(status,403);
});
test('test message clearly describes first-login alerts',()=>{assert.match(newUserMessage(null,{test:true}).text,/Repeat logins are excluded/);});

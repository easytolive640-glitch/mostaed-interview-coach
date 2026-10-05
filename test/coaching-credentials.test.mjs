import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{validateCredentials,isCoachAdmin} from '../lib/server/coaching.mjs';
const pdf={name:'coach.pdf',base64:Buffer.from('%PDF-1.4\nFictional CV\n%%EOF').toString('base64')};
test('LinkedIn validation excludes lookalike domains and non-profile URLs',()=>{
 const good=validateCredentials({linkedin_url:'https://www.linkedin.com/in/sample?tracking=yes',cv:pdf});
 assert.equal(good.linkedin_url,'https://www.linkedin.com/in/sample');
 for(const linkedin_url of ['https://linkedin.com.evil.example/in/sample','javascript:alert(1)','https://www.linkedin.com/company/sample','https://attacker@www.linkedin.com/in/sample'])
 assert.throws(()=>validateCredentials({linkedin_url,cv:pdf}));
});
test('CV validation requires PDF signature and enforces size and extension',()=>{
 const linkedin_url='https://www.linkedin.com/in/sample';
 for(const cv of [{...pdf,name:'cv.html'},{...pdf,base64:Buffer.from('fake document').toString('base64')},{...pdf,base64:Buffer.alloc(1048577,65).toString('base64')}])
 assert.throws(()=>validateCredentials({linkedin_url,cv}));
});
test('administrator status requires verified server email and explicit allowlist',()=>{
 const old=process.env.COACHING_ADMIN_EMAILS;process.env.COACHING_ADMIN_EMAILS='owner@example.com';
 try{assert.equal(isCoachAdmin({email:'owner@example.com'}),false);assert.equal(isCoachAdmin({email:'other@example.com',email_confirmed_at:'now',user_metadata:{admin:true}}),false);assert.equal(isCoachAdmin({email:'owner@example.com',email_confirmed_at:'now'}),true);}
 finally{if(old===undefined)delete process.env.COACHING_ADMIN_EMAILS;else process.env.COACHING_ADMIN_EMAILS=old;}
});
test('non-admin cannot fetch coach review records',async()=>{
 const old=global.fetch,urls=[];global.fetch=async url=>{urls.push(url);return{ok:true,json:async()=>({id:'11111111-1111-4111-8111-111111111111',email:'other@example.com',email_confirmed_at:'now'})}};
 const res={setHeader(){},status(n){this.code=n;return this;},json(d){this.data=d;return this;}};
 try{await handler({method:'GET',query:{review:'1'},headers:{authorization:'Bearer fake-token'}},res);assert.equal(res.code,403);assert.equal(urls.length,1);}
 finally{global.fetch=old;}
});
test('approval waits for Zoom; activation requires approved coach and setup confirmation',async()=>{
 const old=global.fetch,saved={...process.env},env=process.env.COACHING_ADMIN_EMAILS;Object.assign(process.env,{COACHING_ADMIN_EMAILS:'admin@example.com',SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'test-service'});
 const id='11111111-1111-4111-8111-111111111111';let profile={id,user_id:id,status:'pending',cv_path:'private.pdf',linkedin_url:'https://linkedin.com/in/sample'},patch;
 global.fetch=async(url,opts={})=>{if(String(url).includes('/auth/v1/user'))return{ok:true,json:async()=>({id,email:'admin@example.com',email_confirmed_at:'now'})};if(opts.method==='PATCH'){patch=JSON.parse(opts.body);profile={...profile,...patch};}return{ok:true,json:async()=>[profile]};};
 const run=async body=>{const res={setHeader(){},status(n){this.code=n;return this;},json(d){this.data=d;return this;}};await handler({method:'POST',query:{},headers:{authorization:'Bearer test','content-type':'application/json'},body},res);return res;};
 try{
 assert.equal((await run({action:'activate',coach_id:id,zoom_host_id:'coach@example.com',zoom_ready:true})).code,409);
 assert.equal((await run({action:'review',coach_id:id,status:'approved',review_confirmed:true})).code,200);assert.equal(patch.zoom_host_id,null);
 assert.equal((await run({action:'activate',coach_id:id,zoom_host_id:'coach@example.com'})).code,400);
 assert.equal((await run({action:'activate',coach_id:id,zoom_host_id:'coach@example.com',zoom_ready:true})).code,200);assert.equal(patch.zoom_host_id,'coach@example.com');
 }finally{global.fetch=old;for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);if(env===undefined)delete process.env.COACHING_ADMIN_EMAILS;else process.env.COACHING_ADMIN_EMAILS=env;}
});

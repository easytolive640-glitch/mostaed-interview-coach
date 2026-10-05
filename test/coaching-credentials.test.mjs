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

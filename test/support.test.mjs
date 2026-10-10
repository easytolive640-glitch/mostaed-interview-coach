import test from 'node:test';
import assert from 'node:assert/strict';
import support from '../lib/server/support.mjs';
import {trustCopy} from '../trust-copy.mjs';
import {readFileSync} from 'node:fs';
test('support validates authentication, consent, recipient and provider acceptance without logging customer data',async()=>{
 const original=global.fetch, info=console.info, error=console.error;const logs=[];console.info=console.error=v=>logs.push(v);
 Object.assign(process.env,{SUPABASE_URL:'https://example.test',COACHING_ALERT_EMAIL:'admin@example.test',COACHING_ADMIN_EMAILS:'admin@example.test',RESEND_API_KEY:'secret'});
 let user={id:'12345678-1234-1234-1234-123456789012',email:'customer@example.test',email_confirmed_at:'2026-01-01'},sent,ok=true;
 global.fetch=async(url,options)=>url.includes('/auth/')?{ok:true,json:async()=>user}:{ok,json:async()=>ok?{id:'delivery'}:{},...((sent=JSON.parse(options.body)),{})};
 const call=async(body,headers={authorization:'Bearer token'})=>{const res={setHeader(){},status(n){this.code=n;return this},json(value){this.body=value;return this}};await support({method:'POST',headers,body},res);return res};
 try{
 assert.equal((await call({},{})).code,401);
 assert.equal((await call({topic:'other',message:'Private request',consent:false})).code,400);
 assert.equal((await call({}, {origin:'https://evil.test'})).code,403);
 const accepted=await call({topic:'refund',message:'Private request',consent:true,to:'evil@example.test'});assert.equal(accepted.code,202);assert.deepEqual(sent.to,['admin@example.test']);assert.equal(sent.reply_to,user.email);
 assert.equal((await call({topic:'other',message:'Private request',consent:true})).code,429);
 user={...user,id:'22345678-1234-1234-1234-123456789012'};ok=false;assert.equal((await call({topic:'other',message:'Private request',consent:true})).code,503);
 process.env.COACHING_ADMIN_EMAILS='different@example.test';assert.equal((await call({topic:'other',message:'Private request',consent:true})).code,503);
 assert.ok(logs.every(v=>!v.includes('Private request')&&!v.includes('customer@')&&!v.includes('secret')));
 }finally{global.fetch=original;console.info=info;console.error=error}
});
test('trust copy covers all five languages and checkout links reach public policies',()=>{
 for(const values of Object.values(trustCopy)){assert.equal(values.length,5);assert.ok(values.every(v=>typeof v==='string'&&v.length>0))}
 for(const path of ['index.html','account.html','paid-practice.html','coaching.html']){const html=readFileSync(new URL('../'+path,import.meta.url),'utf8');for(const link of ['/policies.html#billing','/policies.html#privacy','/policies.html#refunds','/support.html'])assert.ok(html.includes(link))}
 const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url)));assert.ok(config.rewrites.some(r=>r.source==='/api/support'));
});

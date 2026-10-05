import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{summarize,dashboard,readAll,readAccounts,subscriptionPayments} from '../lib/server/admin.mjs';
import {adminCopy} from '../admin-copy.mjs';
const uid='11111111-1111-4111-8111-111111111111';
const res=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(d){this.data=d;return this;}});
const saved={...process.env};const restore=()=>{for(const k of Object.keys(process.env))if(!(k in saved))delete process.env[k];Object.assign(process.env,saved);};
test('admin data requires authenticated verified allowlisted email; metadata cannot grant access',async()=>{
 const old=fetch;let requests=[];Object.assign(process.env,{COACHING_ADMIN_EMAILS:'owner@example.com',SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'service-test'});
 try{
  for(const user of [null,{id:uid,email:'other@example.com',email_confirmed_at:'now',user_metadata:{admin:true}},{id:uid,email:'owner@example.com'}]){
   requests=[];global.fetch=async url=>{requests.push(url);return{ok:Boolean(user),json:async()=>user};};
   const r=res();await handler({method:'GET',headers:user?{authorization:'Bearer test-token'}:{},query:{}},r);
   assert.equal(r.code,user?403:401);assert.ok(requests.every(x=>x.endsWith('/auth/v1/user')));assert.equal(r.headers['Cache-Control'],'no-store');
  }
 }finally{global.fetch=old;restore();}
});
test('counts deduplicate subscribers per plan and isolate sandbox; missing sources are unknown',()=>{
 const accounts=[{id:'a'},{id:'b'},{id:'c'}];const s=[{user_id:'a',plan:'pro',status:'active',test_mode:false},{user_id:'a',plan:'pro',status:'inactive',test_mode:false},{user_id:'b',plan:'pro',status:'active',test_mode:true},{user_id:'c',plan:'starter',status:'inactive',test_mode:false}];
 const x=summarize(accounts,s,[{status:'pending'},{status:'approved'}],[{test_mode:true},{test_mode:false}]);
 assert.equal(x.plans.live.pro.submitted,1);assert.equal(x.plans.live.pro.records,2);assert.equal(x.plans.live.pro.active,1);assert.equal(x.plans.sandbox.pro.active,1);assert.equal(x.freeAccounts,2);assert.equal(x.coaches.pending,1);assert.equal(x.sessions.live,1);
 assert.equal(summarize(null,null,null,null).plans.live.pro.active,null);assert.equal(summarize(accounts,null,[],[]).freeAccounts,null);
});
test('REST data is paginated, not silently capped at one page',async()=>{
 const old=fetch;Object.assign(process.env,{SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'service-test'});let calls=0;
 global.fetch=async url=>{calls++;const offset=new URL(url).searchParams.get('offset');return{ok:true,status:200,json:async()=>offset==='0'?Array.from({length:500},(_,i)=>({id:i})):[{id:500}]};};
 try{assert.equal((await readAll('career_coaches','id','id')).length,501);assert.equal(calls,2);}finally{global.fetch=old;restore();}
});
test('account pagination projects only necessary fields and excludes auth metadata and tokens',async()=>{
 const old=fetch;let calls=0;Object.assign(process.env,{SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'service-test'});
 global.fetch=async()=>{calls++;return{ok:true,json:async()=>({users:calls===1?Array.from({length:500},(_,i)=>({id:String(i),email:'a@example.com',user_metadata:{full_name:'Test',gender:'secret'},app_metadata:{private:'secret'},identities:['secret'],access_token:'secret'})):[{id:'last'}]})};};
 try{const users=await readAccounts();assert.equal(users.length,501);assert.equal(calls,2);assert.ok(!JSON.stringify(users).includes('secret'));}finally{global.fetch=old;restore();}
});
test('dashboard joins session records; source failure is explicitly unavailable, never false zero',async()=>{
 const old=fetch;Object.assign(process.env,{SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'service-test'});
 global.fetch=async url=>{const path=new URL(url).pathname;
  if(path.endsWith('/users'))return{ok:true,json:async()=>({users:[{id:uid,email:'owner@example.com'}]})};
  if(path.endsWith('/paid_subscriptions'))return{ok:false};
  const rows=path.endsWith('/career_coaches')?[{id:'coach',user_id:uid,name:'Coach',status:'pending',photo_path:'private-photo',zoom_host_id:'private-host'}]:path.endsWith('/coaching_slots')?[{id:'slot',coach_id:'coach',starts_at:'2026-10-07T15:00:00Z'}]:path.endsWith('/coaching_bookings')?[{id:'booking',user_id:uid,slot_id:'slot',status:'confirmed',capture_id:'capture',price_cents:1000,test_mode:true,zoom_join_url:'private-meeting'}]:[];
  return{ok:true,status:200,json:async()=>rows};};
 try{const d=await dashboard();assert.equal(d.subscriptions,null);assert.deepEqual(d.warnings,['subscriptions']);assert.equal(d.summary.plans.live.pro.active,null);assert.equal(d.bookings[0].coach_name,'Coach');assert.equal(d.bookings[0].payment_verified,true);assert.equal(d.bookings[0].email,'owner@example.com');assert.ok(!JSON.stringify(d).includes('private-'));}finally{global.fetch=old;restore();}
});
test('subscription payment lookup validates IDs and prevents reading live payments with sandbox credentials',async()=>{
 const old=fetch;Object.assign(process.env,{SUPABASE_URL:'https://db.example',SUPABASE_SERVICE_ROLE_KEY:'service-test',PAYPAL_MODE:'sandbox'});let calls=0;
 global.fetch=async()=>{calls++;return{ok:true,status:200,json:async()=>[{subscription_id:'I-TEST',test_mode:false}]};};
 try{assert.equal((await subscriptionPayments('../bad')).status,400);assert.equal(calls,0);assert.equal((await subscriptionPayments('I-TEST')).status,503);assert.equal(calls,1);}finally{global.fetch=old;restore();}
});
test('admin page copy supports all five languages',()=>{for(const [k,row] of Object.entries(adminCopy)){assert.equal(row.length,5,k);assert.ok(row.every(s=>typeof s==='string'&&s.trim()),k);}});

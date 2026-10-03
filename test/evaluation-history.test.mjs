import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=(await readFile(new URL('../lib/server/evaluation-history.mjs',import.meta.url),'utf8')).replace("import { authenticatedUser } from './paid-access.mjs';","const authenticatedUser = async () => globalThis.historyTestUser;");
const {default:handler,saveEvaluation}=await import('data:text/javascript,'+encodeURIComponent(source));
process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_SERVICE_ROLE_KEY='mock-key';
const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(v){this.body=v;return this;}});
test('history cannot select an owner supplied by the caller',async()=>{
 globalThis.historyTestUser={id:'verified-owner'};
 globalThis.fetch=async(url)=>{assert.equal(new URL(url).searchParams.get('user_id'),'eq.verified-owner');return new Response('[]');};
 const res=response();await handler({method:'GET',query:{user_id:'other-owner'}},res);assert.equal(res.code,200);
});
test('unauthenticated history requests do not read the database',async()=>{
 globalThis.historyTestUser=null;globalThis.fetch=async()=>assert.fail('Database must not be queried');
 const res=response();await handler({method:'GET'},res);assert.equal(res.code,401);
});
test('saved records contain only verified owner and evaluation summary',async()=>{
 globalThis.fetch=async(url,options)=>{const record=JSON.parse(options.body);assert.equal(record.user_id,'verified-owner');assert.equal(record.cvText,undefined);assert.equal(record.voice,undefined);return new Response(null,{status:201});};
 await saveEvaluation({id:'verified-owner'},{category:'hr',language:'english',user_id:'other-owner',cvText:'private CV',voice:'private recording'},{score:70});
});
test('database failures are surfaced as save failures',async()=>{
 globalThis.fetch=async()=>new Response('{}',{status:404});
 await assert.rejects(()=>saveEvaluation({id:'verified-owner'},{category:'hr',language:'english'},{score:70}));
});

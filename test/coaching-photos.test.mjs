import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{validatePhoto} from '../lib/server/coaching.mjs';
test('profile images accept JPEG/PNG signatures and reject SVG and oversized images',()=>{
 const png=Buffer.from([137,80,78,71,13,10,26,10,0,0]);
 assert.equal(validatePhoto({base64:png.toString('base64')}).type,'image/png');
 assert.equal(validatePhoto({base64:Buffer.from([255,216,255,0]).toString('base64')}).type,'image/jpeg');
 for(const data of [Buffer.from('<svg onload="alert(1)"></svg>'),Buffer.alloc(307201)])assert.throws(()=>validatePhoto({base64:data.toString('base64')}));
});
test('a pending coach photo cannot be read through the public image route',async()=>{
 const old=global.fetch,urls=[];process.env.SUPABASE_SERVICE_ROLE_KEY='dummy';process.env.SUPABASE_URL='https://test.supabase.co';
 global.fetch=async url=>{urls.push(url);return {ok:true,status:200,json:async()=>[]};};
 const res={setHeader(){},status(n){this.code=n;return this;},end(){return this;},json(){return this;}};
 try{await handler({method:'GET',query:{photo:'11111111-1111-4111-8111-111111111111'},headers:{}},res);assert.equal(res.code,404);assert.equal(urls.length,1);assert.ok(urls[0].includes('status=eq.approved'));assert.ok(!urls.some(u=>u.includes('/storage/')));}
 finally{global.fetch=old;delete process.env.SUPABASE_SERVICE_ROLE_KEY;delete process.env.SUPABASE_URL;}
});

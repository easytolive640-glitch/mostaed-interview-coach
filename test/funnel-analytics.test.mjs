import test from 'node:test';
import assert from 'node:assert/strict';
import {safeParams,safePageLocation,track,initAnalytics,measurementId} from '../funnel-analytics.mjs';
test('only controlled dimensions can leave the app',()=>{
 assert.deepEqual(safeParams({category:'customerService',language:'arabic',email:'person@example.com',answer:'private',cv:'private',voice:'private',amount:100,subscriptionId:'I-123',method:'password'}),{category:'customerService',language:'arabic',method:'password'});
 assert.deepEqual(safeParams({category:'secret text',language:'other',method:'email@example.com',stage:'raw server error'}),{});
});
test('page location strips tokens, OAuth codes and query strings',()=>{
 assert.equal(safePageLocation(new URL('https://example.com/account.html?code=secret#access_token=secret')),'https://example.com/account.html');
});
test('GA4 initialization preserves safe campaign identifiers, cross-domain config and click funnel',()=>{
 const previous={window:global.window,document:global.document};const scripts=[];let clicked;
 global.window={location:{href:'https://mostaed-interview-coach.vercel.app/?utm_source=linkedin&utm_medium=organic_social&utm_campaign=oct2026&email=private#secret'}};
 global.document={referrer:'https://linkedin.com/feed/?private=secret',querySelector:()=>null,createElement:()=>({}),head:{append:s=>scripts.push(s)},addEventListener:(name,fn)=>{clicked=fn;}};
 try{initAnalytics();initAnalytics();const calls=window.dataLayer.map(x=>Array.from(x));assert.equal(scripts.length,1);assert.ok(scripts[0].src.endsWith(measurementId));const config=calls.find(x=>x[0]==='config')[2];assert.equal(config.campaign_source,'linkedin');assert.equal(config.page_location,'https://mostaed-interview-coach.vercel.app/');assert.equal(config.page_referrer,'https://linkedin.com');assert.ok(!JSON.stringify(calls).includes('private'));assert.equal(calls.find(x=>x[1]==='linker')[2].domains.length,2);
 clicked({target:{closest:()=>({href:'https://easytolive640-glitch.github.io/mostaed-interview-coach/'})}});assert.equal(window.dataLayer.at(-1)[1],'free_practice_clicked');
 clicked({target:{closest:()=>({href:'https://mostaed-interview-coach.vercel.app/paid-practice.html'})}});assert.equal(window.dataLayer.at(-1)[1],'paid_practice_clicked');
 }finally{global.window=previous.window;global.document=previous.document;}
});
test('tracking rejects arbitrary event names and survives analytics errors',()=>{
 const old=global.window;let calls=0;global.window={gtag:()=>{calls++;throw Error('blocked');}};
 try{assert.doesNotThrow(()=>track('evaluation_completed',{language:'english'}));track('secret');assert.equal(calls,1);}finally{global.window=old;}
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {languages,ui,preferredLanguage,rememberLanguage} from '../locales.mjs';
import {coachingCopy} from '../coaching-copy.mjs';
import {guideCopy} from '../guide-copy.mjs';
import {inquiryCopy} from '../inquiry-copy.mjs';
import {topics,faqAnswer} from '../inquiry-knowledge.mjs';
import {localizeMessage,messages} from '../localized-messages.mjs';
import {syncLanguageLinks} from '../language-navigation.mjs';
test('coaching, guides, checkout, help and status copy cover all five languages',()=>{
 for(const [key,row] of Object.entries({...ui,...coachingCopy,...guideCopy,...inquiryCopy})){assert.equal(row.length,5,key);assert.ok(row.every(value=>typeof value==='string'&&value.trim()),key);}
 for(const [key,row] of Object.entries(messages)){assert.equal(row.length,4,key);assert.ok(row.every(value=>value.trim()),key);}
 for(const topic of topics)for(const {code} of Object.values(languages))assert.equal(faqAnswer('',code,topic.id),topic.answer[code]);
});
test('localized coaching messages remain correct when translated again after a switch',()=>{
 for(const row of Object.values(coachingCopy))for(const [index,language] of Object.keys(languages).entries())assert.equal(localizeMessage(row[0],language),row[index]);
 assert.equal(localizeMessage(coachingCopy.signin[1],'french'),coachingCopy.signin[2]);
 assert.match(localizeMessage('Unknown upstream error','german'),/Anfrage/);
});
test('language query works without storage and changing selection updates the shared URL',()=>{
 const saved={location:globalThis.location,history:globalThis.history,localStorage:globalThis.localStorage};
 try{
  globalThis.location={href:'https://example.test/coaching.html?lang=fr&review=abc#adminReview',search:'?lang=fr&review=abc'};
  globalThis.localStorage={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};
  globalThis.history={replaceState(_a,_b,url){globalThis.location={href:url,search:new URL(url).search};}};
  assert.equal(preferredLanguage(),'french');rememberLanguage('german');assert.equal(preferredLanguage(),'german');
  assert.equal(new URL(location.href).searchParams.get('review'),'abc');assert.equal(new URL(location.href).hash,'#adminReview');
 }finally{for(const [key,value] of Object.entries(saved))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});
test('navigation keeps language, review parameters and hashes without touching external checkouts',()=>{
 const saved={location:globalThis.location,document:globalThis.document};
 const hrefs=['/','/coaching.html?review=abc#adminReview','/guides/','https://easytolive640-glitch.github.io/mostaed-interview-coach/','#pricing','https://www.paypal.com/checkoutnow?token=abc'];
 const links=hrefs.map(href=>({href,getAttribute(){return href;}}));
 try{globalThis.location={href:'https://example.test/account.html',origin:'https://example.test'};globalThis.document={querySelectorAll(){return links;}};syncLanguageLinks('spanish');
  for(const link of links.slice(0,4))assert.equal(new URL(link.href).searchParams.get('lang'),'spanish');
  assert.equal(new URL(links[1].href).searchParams.get('review'),'abc');assert.equal(new URL(links[1].href).hash,'#adminReview');assert.equal(links[4].href,hrefs[4]);assert.equal(links[5].href,hrefs[5]);
 }finally{for(const [key,value] of Object.entries(saved))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}
});

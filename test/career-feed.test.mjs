import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFeed,getFeed,sources} from '../lib/server/career-feed.mjs';
const now=Date.now();
const item=(title,url,date=new Date(now).toUTCString())=>`<item><title><![CDATA[${title}]]></title><link>${url}</link><pubDate>${date}</pubDate></item>`;
test('RSS output rejects unsafe URLs, stale dates, future dates and duplicates',async()=>{
 const xml='<rss><channel>'+item('Hiring &amp; skills','https://www.hrdive.com/news/careers/')+item('Unsafe','javascript:alert(1)')+item('Wrong publisher','https://evil.example/')+item('Old','https://www.hrdive.com/old',new Date(now-91*86400000).toUTCString())+item('Future','https://www.hrdive.com/future',new Date(now+3*86400000).toUTCString())+'</channel></rss>';
 const items=parseFeed(xml,sources[1],now);assert.equal(items.length,1);assert.equal(items[0].title,'Hiring & skills');
 const data=await getFeed(async()=>new Response(xml));assert.equal(data.items.length,1);assert.equal(data.partial,true);
});
test('one failed publisher does not hide another; complete failure remains honest',async()=>{
 const data=await getFeed(async url=>{if(url===sources[0].url)throw Error();return new Response(item('Hiring news','https://www.hrdive.com/news/hiring/'));});
 assert.equal(data.items.length,1);assert.equal(data.partial,true);
 const empty=await getFeed(async()=>{throw Error();});assert.deepEqual(empty.items,[]);assert.ok(empty.sources.every(x=>!x.available));
});
test('oversized response is rejected',async()=>{
 const data=await getFeed(async()=>new Response('x'.repeat(1500001)));assert.equal(data.items.length,0);
});

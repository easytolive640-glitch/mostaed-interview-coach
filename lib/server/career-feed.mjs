// Fixed publisher endpoints only; visitors cannot supply fetch URLs.
export const sources = [
  {name:'jobs.ac.uk',kind:'blog',url:'https://blog.jobs.ac.uk/feed/',home:'https://blog.jobs.ac.uk/',hosts:['blog.jobs.ac.uk','career-advice.jobs.ac.uk','www.jobs.ac.uk']},
  {name:'HR Dive',kind:'news',url:'https://www.hrdive.com/feeds/news/',home:'https://www.hrdive.com/',hosts:['www.hrdive.com','hrdive.com']}
];
const decode = text => text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').replace(/&(?:amp|lt|gt|quot|apos|#39|#\d+|#x[0-9a-f]+);/gi, entity => {
 const named={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'"};
 if(named[entity])return named[entity];
 const n=entity.startsWith('&#x')?parseInt(entity.slice(3),16):parseInt(entity.slice(2),10);
 return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):'';
}).replace(/\s+/g,' ').trim();
const tag=(xml,name)=>xml.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+name+'>','i'))?.[1]||'';
export function parseFeed(xml,source,now=Date.now()){
 const items=[];
 for(const match of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)){
  const title=decode(tag(match[1],'title')).slice(0,220);
  const date=new Date(decode(tag(match[1],'pubDate')));
  let url;try{url=new URL(decode(tag(match[1],'link')));}catch{continue;}
  if(!title||url.protocol!=='https:'||!source.hosts.includes(url.hostname)||url.username||url.password||!Number.isFinite(date.getTime())||date.getTime()>now+86400000||now-date.getTime()>90*86400000)continue;
  url.hash='';items.push({title,url:url.href,publishedAt:date.toISOString(),source:source.name,kind:source.kind});
 }
 return items.sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,4);
}
export async function getFeed(fetcher=fetch){
 const outcomes=await Promise.all(sources.map(async source=>{
  try{
   const response=await fetcher(source.url,{signal:AbortSignal.timeout(7000),headers:{Accept:'application/rss+xml, application/xml, text/xml','User-Agent':'MostaedCareerFeed/1.0 (+https://mostaedcoach.com)'}});
   if(!response.ok)throw new Error('Publisher unavailable');
   if(Number(response.headers.get('content-length')||0)>1500000)throw new Error('Feed too large');
   const reader=response.body.getReader();let size=0;const chunks=[];
   while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1500000){await reader.cancel();throw new Error('Feed too large');}chunks.push(value);}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   const items=parseFeed(new TextDecoder().decode(bytes),source);
   return {items,available:items.length>0};
  }catch{return {items:[],available:false};}
 }));
 const seen=new Set();const items=outcomes.flatMap(x=>x.items).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).filter(x=>{if(seen.has(x.url))return false;seen.add(x.url);return true;});
 return {items,checkedAt:new Date().toISOString(),partial:outcomes.some(x=>!x.available),sources:sources.map(({name,home,kind},i)=>({name,url:home,kind,available:outcomes[i].available}))};
}
export default async function handler(req,res){
 if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Method not allowed'});}
 const data=await getFeed();
 res.setHeader('Cache-Control',data.items.length?'public, s-maxage=3600, stale-while-revalidate=86400':'public, s-maxage=120');
 return res.status(200).json(data);
}

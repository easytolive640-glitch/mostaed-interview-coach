import { readFile } from 'node:fs/promises';
const host = 'mostaed-interview-coach.vercel.app';
const key = 'd746e9cf98a14a5b8cb7db9606a4f351';
const origin = 'https://' + host;
const sitemap = await (await fetch(origin + '/sitemap.xml')).text();
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
if (!urlList.length || urlList.some(u => new URL(u).host !== host)) throw new Error('Invalid sitemap');
const verification = await fetch(origin + '/' + key + '.txt');
if (!verification.ok || (await verification.text()).trim() !== key) throw new Error('Key file not deployed yet');
const response = await fetch('https://api.indexnow.org/indexnow', {
 method: 'POST', headers: {'Content-Type':'application/json'},
 body: JSON.stringify({host,key,keyLocation:origin+'/'+key+'.txt',urlList})
});
console.log('IndexNow:', response.status, 'URLs:', urlList.length);
if (![200,202].includes(response.status)) throw new Error(await response.text());

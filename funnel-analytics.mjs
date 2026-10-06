// Public GA4 measurement ID observed in the deployed free-practice shell.
export const measurementId='G-8QJ52F51ND';
const allowedEvents=new Set(['landing_view','free_practice_clicked','paid_practice_clicked','account_clicked','sign_up','login','begin_checkout','checkout_redirected','checkout_failed','payment_verified','paid_practice_ready','paid_practice_started','evaluation_submitted','evaluation_completed','evaluation_failed','paid_access_blocked']);
const allowedValues={method:['password','google'],plan:['pro','starter'],language:['english','arabic','french','spanish','german'],category:['hr','customerService','itCloud'],environment:['live','sandbox'],stage:['access','checkout','evaluation']};
export function safeParams(params={}){return Object.fromEntries(Object.entries(params).filter(([key,value])=>allowedValues[key]?.includes(value)));}
export function safePageLocation(location){return location.origin+location.pathname;}
export function track(event,params={}){try{if(allowedEvents.has(event)&&typeof window.gtag==='function')window.gtag('event',event,safeParams(params));}catch{/* Measurement must never interrupt practice or payment. */}}
export function initAnalytics(){
 if(typeof window==='undefined'||typeof document==='undefined')return;
 if(window.mostaedFunnelInitialized)return;window.mostaedFunnelInitialized=true;
 const url=new URL(window.location.href);
 window.dataLayer=window.dataLayer||[];
 window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
 window.gtag('js',new Date());
 window.gtag('set','linker',{domains:['mostaed-interview-coach.vercel.app','easytolive640-glitch.github.io']});
 const config={page_location:safePageLocation(url),page_referrer:document.referrer?new URL(document.referrer).origin:'',allow_google_signals:false,allow_ad_personalization_signals:false};
 // Accept only campaign identifiers, never arbitrary query strings or OAuth fragments.
 for(const [key,param] of [['campaign_source','utm_source'],['campaign_medium','utm_medium'],['campaign_name','utm_campaign'],['campaign_content','utm_content']]){const value=url.searchParams.get(param);if(value&&/^[a-zA-Z0-9_-]{1,80}$/.test(value))config[key]=value;}
 window.gtag('config',measurementId,config);
 if(!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')){const script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+measurementId;document.head.append(script);}
 if(url.pathname==='/'||url.pathname==='/index.html')track('landing_view');
 document.addEventListener('click',event=>{const a=event.target.closest?.('a[href]');if(!a)return;let target;try{target=new URL(a.href,url);}catch{return;}
 if(target.origin==='https://easytolive640-glitch.github.io'&&target.pathname.startsWith('/mostaed-interview-coach/'))track('free_practice_clicked');
 else if(target.origin===url.origin&&target.pathname==='/paid-practice.html')track('paid_practice_clicked');
 else if(target.origin===url.origin&&target.pathname==='/account.html')track('account_clicked');
 });
}
initAnalytics();

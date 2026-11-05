const plan=document.getElementById('plan'),total=document.getElementById('total'),status=document.getElementById('priceStatus'),next=document.getElementById('continue');
let prices;
function render(){next.href='/account.html?plan='+plan.value;if(prices)total.textContent=new Intl.NumberFormat('en-EG',{style:'currency',currency:'EGP'}).format(prices[plan.value]/100);}
plan.addEventListener('change',render);
try{const response=await fetch('/api/account-config?exchangeRate=1',{cache:'no-store'});if(!response.ok)throw Error();const quote=await response.json();if(!['starter','pro'].every(key=>Number.isSafeInteger(quote?.plans?.[key])&&quote.plans[key]>0))throw Error();prices=quote.plans;render();status.textContent='Current EGP quote / السعر الحالي بالجنيه المصري';}catch{total.textContent='Price temporarily unavailable / السعر غير متاح مؤقتاً';status.textContent='Please refresh before proceeding. / يرجى تحديث الصفحة قبل المتابعة.';}

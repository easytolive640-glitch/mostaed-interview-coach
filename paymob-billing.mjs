export const egp = (amount, locale=document.documentElement.lang||'en') =>
  new Intl.NumberFormat(locale,{style:'currency',currency:'EGP',currencyDisplay:'code'}).format(amount/100);
export async function paymentQuote() {
  const response=await fetch('/api/account-config?exchangeRate=1',{cache:'no-store'});
  if(!response.ok)throw Error('EGP prices are temporarily unavailable. Please try again.');
  return response.json();
}
export function confirmPaymobBilling(amount) {
  if(!Number.isSafeInteger(amount)||amount<=0)throw Error('EGP price is unavailable.');
  const ar=document.documentElement.lang==='ar';
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');
    const form=document.createElement('form');
    form.method='dialog';
    const heading=document.createElement('h2');
    heading.textContent=(ar?'ادفع عبر Paymob: ':'Pay with Paymob: ')+egp(amount);
    form.append(heading);
    for(const [name,en,arabic,autocomplete] of [
      ['first_name','First name','الاسم الأول','given-name'],['last_name','Last name','اسم العائلة','family-name'],
      ['phone_number','Phone','الهاتف','tel'],['street','Street','الشارع','address-line1'],
      ['building','Building','المبنى','address-line2'],['city','City','المدينة','address-level2'],['state','Governorate','المحافظة','address-level1']
    ]){
      const label=document.createElement('label');label.textContent=ar?arabic:en;
      const input=document.createElement('input');input.name=name;input.required=true;input.maxLength=120;input.autocomplete=autocomplete;
      if(name==='phone_number')input.type='tel';
      label.append(input);form.append(label);
    }
    const submit=document.createElement('button');submit.textContent=ar?'متابعة إلى Paymob':'Continue to Paymob';
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent=ar?'إلغاء':'Cancel';cancel.onclick=()=>dialog.close();
    form.append(submit,cancel);dialog.append(form);document.body.append(dialog);
    dialog.style.cssText='max-width:min(420px,92vw);max-height:90vh;overflow:auto;border:1px solid #ddd;border-radius:16px;padding:20px';
    form.onsubmit=event=>{event.preventDefault();dialog.close('pay');};
    dialog.onclose=()=>{const result=dialog.returnValue==='pay'?{...Object.fromEntries(new FormData(form)),country:'EG'}:null;dialog.remove();resolve(result);};
    dialog.showModal();
  });
}

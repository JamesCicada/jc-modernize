import { createHash } from 'node:crypto';

export const SERVICES=['Website redesign','A new website','Contact form or improvements','Something else'];
const BUDGETS=['Not sure yet','Under $1,000','$1,000–$2,500','$2,500–$5,000','$5,000+'];
const MAX_BYTES=14000;
const clean=value=>typeof value==='string'?value.trim():'';
const emailPattern=/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;

export function createHandler({env=process.env,send=fetch}={}){
return async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const reply=(code,data)=>res.status(code).json(data);
  if(req.method!=='POST'){res.setHeader('Allow','POST');return reply(405,{ok:false,error:'Please use the contact form.'});}
  const allowed=new Set(['https://jcicada.com','https://www.jcicada.com',...(env.CONTACT_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean)]);
  if(env.VERCEL_URL)allowed.add(`https://${env.VERCEL_URL}`);
  if(env.VERCEL_PROJECT_PRODUCTION_URL)allowed.add(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`);
  if(env.NODE_ENV!=='production'){allowed.add('http://localhost:4180');allowed.add('http://127.0.0.1:4180');}
  if(!allowed.has(req.headers.origin))return reply(403,{ok:false,error:'Please send your enquiry from our website.'});
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return reply(415,{ok:false,error:'Please use the website contact form.'});
  if(Number(req.headers['content-length'])>MAX_BYTES)return reply(413,{ok:false,error:'Your message is too long. Please shorten it.'});
  let body=req.body;
  try{if(Buffer.isBuffer(body))body=body.toString('utf8');if(typeof body==='string'){if(Buffer.byteLength(body)>MAX_BYTES)return reply(413,{ok:false,error:'Your message is too long.'});body=JSON.parse(body);}}
  catch{return reply(400,{ok:false,error:'We couldn’t read your message. Please try again.'});}
  if(!body||typeof body!=='object'||Array.isArray(body))return reply(400,{ok:false,error:'Please complete the contact form.'});
  if(Buffer.byteLength(JSON.stringify(body))>MAX_BYTES)return reply(413,{ok:false,error:'Your message is too long.'});
  // Silently discard the hidden honeypot field, without sending mail.
  if(clean(body.companyFax))return reply(200,{ok:true});
  const fields=Object.fromEntries(['name','business','email','website','service','budget','message','requestId'].map(k=>[k,clean(body[k])]));
  const {name,business,email,website,service,message,requestId}=fields;
  const budget=fields.budget||'Not sure yet';
  if(name.length<2||name.length>100||/[\r\n]/.test(name))return reply(400,{ok:false,error:'Please enter your name (2–100 characters).'});
  if(email.length>254||!emailPattern.test(email)||/[\r\n]/.test(email))return reply(400,{ok:false,error:'Please enter a valid email address.'});
  if(business.length>150||website.length>300)return reply(400,{ok:false,error:'Please shorten the business name or website address.'});
  if(!SERVICES.includes(service)||!BUDGETS.includes(budget))return reply(400,{ok:false,error:'Please choose a service and budget option from the form.'});
  if(message.length<10||message.length>5000)return reply(400,{ok:false,error:'Please describe your project in 10–5,000 characters.'});
  if(body.consent!==true)return reply(400,{ok:false,error:'Please agree to the enquiry privacy notice.'});
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId))return reply(400,{ok:false,error:'Please refresh the page and try again.'});
  if(!env.RESEND_API_KEY||!env.CONTACT_FROM)return reply(503,{ok:false,error:'The contact form is temporarily unavailable. Please email james@jcicada.com directly.'});
  const text=[`New JC Modernize enquiry`,``,`Name: ${name}`,`Business: ${business||'Not provided'}`,`Email: ${email}`,`Website: ${website||'Not provided'}`,`Service: ${service}`,`Budget: ${budget}`,``,`Project details:`,message,``,`Privacy consent: provided via website form.`].join('\n');
  const payload={from:env.CONTACT_FROM,to:[env.CONTACT_TO||'james@jcicada.com'],reply_to:email,subject:`Website enquiry — ${service}`,text};
  const digest=createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0,24);
  try{
    const result=await send('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`jc-contact-${requestId}-${digest}`},body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
    if(!result.ok)return reply(result.status===429?429:502,{ok:false,error:result.status===429?'The form is busy. Please try again shortly or email james@jcicada.com.':'We couldn’t send your message. Please try again or email james@jcicada.com.'});
    const delivered=await result.json();
    if(!delivered.id)return reply(502,{ok:false,error:'Email delivery could not be confirmed. Please try again or email james@jcicada.com.'});
    return reply(200,{ok:true});
  }catch{return reply(502,{ok:false,error:'Email delivery is temporarily unavailable. Please try again or email james@jcicada.com.'});}
};}
export default createHandler();

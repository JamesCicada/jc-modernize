import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const html=await readFile(new URL('public/index.html',root),'utf8');
for(const name of ['public/style.css','public/script.js','public/privacy.html','public/assets/omaha.jpg','public/assets/av-tech.jpg','api/contact.js'])await access(new URL(name,root));
for(const anchor of html.matchAll(/href="#([^"]+)"/g))if(!html.includes(`id="${anchor[1]}"`))throw new Error(`Missing anchor ${anchor[1]}`);
for(const src of html.matchAll(/(?:src|href)="(\/(?!\/)[^"#?]+)"/g))if(src[1]!=='/'&&!src[1].startsWith('/api/'))await access(fileURLToPath(new URL(`public${src[1]}`,root)));
JSON.parse(await readFile(new URL('vercel.json',root),'utf8'));
console.log('Static assets, internal links and Vercel configuration checked.');

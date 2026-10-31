import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {createHandler} from '../api/contact.js';

try{process.loadEnvFile('.env.local');}catch{}
const root=fileURLToPath(new URL('../public/',import.meta.url)),contact=createHandler();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/api/contact'){
    let size=0,chunks=[];for await(const chunk of req){size+=chunk.length;if(size>14000){res.writeHead(413,{'Content-Type':'application/json'});res.end(JSON.stringify({ok:false,error:'Message too long.'}));return;}chunks.push(chunk);}
    req.body=Buffer.concat(chunks).toString();
    res.status=code=>{res.statusCode=code;return res;};res.json=data=>res.end(JSON.stringify(data));
    return contact(req,res);
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end();return;}
  const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!path.startsWith(resolve(root)+sep)){res.writeHead(403);res.end();return;}
  try{const content=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:content);}catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Page not found');}
});
server.listen(4180,'127.0.0.1',()=>console.log('JC Modernize: http://127.0.0.1:4180'));

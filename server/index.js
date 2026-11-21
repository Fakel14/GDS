import http from 'node:http';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {readAccounts,writeAccounts,checkCode} from './store.js';
const sessions=new Map(), attempts=new Map();
const port=Number(process.env.PORT||3001); const secure=process.env.COOKIE_SECURE==='true';
const cookie=(value,maxAge)=>`gds_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure?'; Secure':''}`;
function respond(res,status,data,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers});res.end(JSON.stringify(data))}
function session(req){const token=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('gds_session='))?.slice(12);const s=sessions.get(token);if(!s||s.expires<Date.now()){if(token)sessions.delete(token);return null}const account=readAccounts().find(a=>a.id===s.id);if(!account){sessions.delete(token);return null}return {token,account}}
async function body(req){let raw='';for await(const part of req){raw+=part;if(raw.length>4096)throw Error('large')}return JSON.parse(raw||'{}')}
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return false;try{return new URL(origin).host===req.headers.host}catch{return false}}
const server=http.createServer(async(req,res)=>{try{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path.startsWith('/api/')){
  if(req.method!=='GET'&&!sameOrigin(req))return respond(res,403,{error:'Недопустимый источник запроса'});
  if(path==='/api/session'&&req.method==='GET'){const s=session(req);return respond(res,200,{user:s?{id:s.account.id,nickname:s.account.nickname}:null})}
  if(path==='/api/login'&&req.method==='POST'){
   const ip=req.socket.remoteAddress||'unknown', now=Date.now();let hits=(attempts.get(ip)||[]).filter(t=>now-t<15*60*1000);if(hits.length>=10)return respond(res,429,{error:'Слишком много попыток. Попробуйте через 15 минут.'});
   const data=await body(req);if(typeof data.id!=='string'||typeof data.code!=='string'||data.id.length>100||data.code.length>200)return respond(res,400,{error:'Введите ID и код аккаунта'});
   const account=readAccounts().find(a=>a.id===data.id.trim());if(!account||!checkCode(data.code,account)){hits.push(now);attempts.set(ip,hits);return respond(res,401,{error:'Неверный ID или код аккаунта'})}
   attempts.delete(ip);const token=randomBytes(32).toString('hex');sessions.set(token,{id:account.id,expires:now+86400000});return respond(res,200,{user:{id:account.id,nickname:account.nickname}},{'Set-Cookie':cookie(token,86400)})
  }
  if(path==='/api/logout'&&req.method==='POST'){const s=session(req);if(s)sessions.delete(s.token);return respond(res,200,{ok:true},{'Set-Cookie':cookie('',0)})}
  if(path==='/api/account'&&req.method==='DELETE'){const s=session(req);if(!s)return respond(res,401,{error:'Сначала войдите в аккаунт'});const key='delete:'+s.account.id, now=Date.now();let hits=(attempts.get(key)||[]).filter(t=>now-t<15*60*1000);if(hits.length>=10)return respond(res,429,{error:'Слишком много попыток. Попробуйте через 15 минут.'});const data=await body(req);if(typeof data.code!=='string'||data.code.length>200||!checkCode(data.code,s.account)){hits.push(now);attempts.set(key,hits);return respond(res,401,{error:'Неверный код аккаунта'})}attempts.delete(key);writeAccounts(readAccounts().filter(a=>a.id!==s.account.id));for(const [token,value] of sessions)if(value.id===s.account.id)sessions.delete(token);return respond(res,200,{ok:true},{'Set-Cookie':cookie('',0)})}
  return respond(res,404,{error:'Не найдено'});
 }
 if(req.method!=='GET')return respond(res,405,{error:'Метод не поддерживается'});
 const root=resolve('dist');let file=resolve(root,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(root+'/'))return respond(res,404,{error:'Не найдено'});
 try{const data=await readFile(file);const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'};res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'});res.end(data)}catch{respond(res,404,{error:'Не найдено. Соберите сайт командой npm run build.'})}
 }catch(e){console.error(e);respond(res,400,{error:'Не удалось обработать запрос'})}});
server.listen(port,'0.0.0.0',()=>console.log(`GDS API: http://localhost:${port}`));

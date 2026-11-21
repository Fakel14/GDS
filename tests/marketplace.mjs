import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'gds-market-')),env={...process.env,GDS_DATA_DIR:dir,PORT:'31992'};
const run=(...args)=>spawnSync(process.execPath,['server/admin.js',...args],{env,encoding:'utf8'});
const create=(n)=>{const r=run('create',n);assert.equal(r.status,0,r.stderr);return {id:r.stdout.match(/ID: (.+)/)[1],code:r.stdout.match(/Код: (.+)/)[1]}};
const admin=create('Fakelo4ik'),alice=create('Alice'),bob=create('Bob');assert.notEqual(run('create','aLiCe').status,0);assert.equal(run('grant-admin',admin.id).status,0);assert.notEqual(run('grant-admin',alice.id).status,0);
const server=spawn(process.execPath,['server/index.js'],{env,stdio:['ignore','pipe','inherit']});
try{
 await once(server.stdout,'data');const base='http://localhost:31992';
 const req=async(path,method='GET',data,cookie='')=>{const r=await fetch(base+path,{method,headers:{origin:base,'content-type':'application/json',cookie},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]}};
 const login=async(a)=>{const r=await req('/api/login','POST',a);assert.equal(r.status,200);return r.cookie};const ac=await login(admin),bc=await login(bob),uc=await login(alice);
 assert.equal((await req('/api/listings/pending','GET',undefined,uc)).status,403);
 const fields={title:'Тест',category:'Ремикс',price:123,description:'Описание',comment:'Секрет'};
 assert.equal((await req('/api/listings','POST',fields)).status,401);
 const ids=[];for(let i=0;i<3;i++){let r=await req('/api/listings','POST',fields,uc);assert.equal(r.status,201);ids.push(r.data.listing.id)}
 assert.equal((await req('/api/listings','POST',fields,uc)).status,409);
 assert.equal((await req('/api/listings')).data.listings.length,0);
 assert.equal((await req('/api/profiles/Alice')).data.listings.length,0);
 assert.equal((await req('/api/profiles/Alice','GET',undefined,uc)).data.listings.length,3);
 assert.equal((await req('/api/listings/'+ids[0]+'/approve','POST',{},bc)).status,403);
 assert.equal((await req('/api/listings/'+ids[0],'PUT',fields,bc)).status,403);
 assert.equal((await req('/api/listings/'+ids[0]+'/approve','POST',{},ac)).status,200);
 let listing=(await req('/api/listings')).data.listings[0];assert.equal(listing.id,ids[0]);assert.equal(listing.comment,undefined);
 assert.equal((await req('/api/listings/'+ids[0],'PUT',{...fields,title:'Изменено'},uc)).data.listing.status,'pending');assert.equal((await req('/api/listings')).data.listings.length,0);
 assert.equal((await req('/api/listings/'+ids[1]+'/reject','POST',{},ac)).status,200);
 assert.equal((await req('/api/listings','POST',fields,uc)).status,201);
 assert.equal((await req('/api/listings/'+ids[1],'PUT',fields,uc)).status,409);
 assert.equal((await req('/api/profiles/Alice','DELETE',{},bc)).status,403);
 assert.equal((await req('/api/profiles/Alice','DELETE',{},ac)).status,200);
 assert.equal((await req('/api/session','GET',undefined,uc)).data.user,null);assert.equal((await req('/api/listings/pending','GET',undefined,ac)).data.listings.length,0);
 console.log('Marketplace moderation, authorization, quota, and profiles passed');
}finally{server.kill();rmSync(dir,{recursive:true,force:true})}

import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {once} from 'node:events';
const dir=mkdtempSync(join(tmpdir(),'gds-test-'));const env={...process.env,GDS_DATA_DIR:dir,PORT:'31991'};
const admin=spawnSync(process.execPath,['server/admin.js','create','TestUser'],{env,encoding:'utf8'});assert.equal(admin.status,0);const id=admin.stdout.match(/ID: (.+)/)[1],code=admin.stdout.match(/Код: (.+)/)[1];
const server=spawn(process.execPath,['server/index.js'],{env,stdio:['ignore','pipe','inherit']});
try{await once(server.stdout,'data');const base='http://localhost:31991';const req=(path,method='GET',data,extra={})=>fetch(base+path,{method,headers:{origin:base,'content-type':'application/json',...extra},body:data&&JSON.stringify(data)});
 let r=await req('/api/login','POST',{id,code:'wrong'});assert.equal(r.status,401);
 r=await req('/api/login','POST',{id,code});assert.equal(r.status,200);let json=await r.json();assert.equal(json.user.nickname,'TestUser');const cookie=r.headers.get('set-cookie').split(';')[0];
 r=await req('/api/session','GET',null,{cookie});assert.equal((await r.json()).user.nickname,'TestUser');
 r=await req('/api/account','DELETE',{code:'wrong'},{cookie});assert.equal(r.status,401);
 r=await req('/api/account','DELETE',{code},{cookie});assert.equal(r.status,200);
 r=await req('/api/session','GET',null,{cookie});assert.equal((await r.json()).user,null);
 r=await req('/api/login','POST',{id,code});assert.equal(r.status,401);console.log('Account flow passed');
}finally{server.kill();rmSync(dir,{recursive:true,force:true})}

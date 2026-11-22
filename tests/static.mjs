import assert from 'node:assert/strict';
import path from 'node:path';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {resolveStaticPath} from '../server/static-path.js';

for (const [api,root] of [[path.posix,'/project/dist'],[path.win32,'C:\\project\\dist']]) {
 assert.equal(resolveStaticPath(root,'/',api),api.join(root,'index.html'));
 assert.equal(resolveStaticPath(root,'/assets/index.js',api),api.join(root,'assets','index.js'));
 assert.equal(resolveStaticPath(root,'/../data/accounts.json',api),null);
 assert.equal(resolveStaticPath(root,'/../dist-other/secret',api),null);
}
assert.equal(resolveStaticPath('C:\\project\\dist','/..\\data\\accounts.json',path.win32),null);
const dir=mkdtempSync(join(tmpdir(),'gds-static-'));
const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,GDS_DATA_DIR:dir,PORT:'31995',HOST:'127.0.0.1'},stdio:['ignore','pipe','inherit']});
try {
 await once(server.stdout,'data');
 // Backups log before the listening event, so wait for the explicit server-ready line.
 let response;for(let i=0;i<20;i++){try{response=await fetch('http://127.0.0.1:31995/');break}catch{await new Promise(r=>setTimeout(r,50))}}
 assert.ok(response,'server did not start');assert.equal(response.status,200);
 const html=await response.text();assert.match(html,/GDS/);
 const js=html.match(/src="([^"]+\.js)"/);assert.ok(js);const asset=await fetch('http://127.0.0.1:31995'+js[1]);assert.equal(asset.status,200);assert.match(asset.headers.get('content-type'),/javascript/);
 const missing=await fetch('http://127.0.0.1:31995/no-such-file');assert.equal(missing.status,404);
 console.log('Static serving and Windows path checks passed');
} finally {server.kill();rmSync(dir,{recursive:true,force:true})}

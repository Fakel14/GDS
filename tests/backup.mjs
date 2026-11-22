import {mkdtempSync,writeFileSync,readFileSync,readdirSync,rmSync,existsSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'gds-backup-'));process.env.GDS_DATA_DIR=dir;
try{
 const {createBackup}=await import('../server/backup.js');
 writeFileSync(join(dir,'accounts.json'),JSON.stringify([{nickname:'Автор'}]));writeFileSync(join(dir,'listings.json'),JSON.stringify([{title:'Трек'}]));
 const first=createBackup();assert.equal(JSON.parse(readFileSync(join(first,'accounts.json'),'utf8'))[0].nickname,'Автор');assert.deepEqual(JSON.parse(readFileSync(join(first,'manifest.json'),'utf8')).files,['accounts.json','listings.json']);assert.ok(!existsSync(join(first,'backups')));assert.ok(!existsSync(join(dir,'accounts.lock')));
 writeFileSync(join(dir,'accounts.json'),JSON.stringify([{nickname:'Другой'}]));const second=createBackup();assert.equal(JSON.parse(readFileSync(join(first,'accounts.json'),'utf8'))[0].nickname,'Автор');assert.equal(JSON.parse(readFileSync(join(second,'accounts.json'),'utf8'))[0].nickname,'Другой');
 for(let i=0;i<44;i++)createBackup();assert.equal(readdirSync(join(dir,'backups')).length,42);
 console.log('Backup snapshots and retention passed');
}finally{rmSync(dir,{recursive:true,force:true})}

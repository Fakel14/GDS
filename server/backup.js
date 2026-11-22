import {mkdirSync, readdirSync, existsSync, copyFileSync, writeFileSync, renameSync, rmSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {dir,withAccountLock} from './store.js';

const files=['accounts.json','listings.json','conversations.json','reports.json','reviews.json','notifications.json'];
const backupDir=resolve(process.env.GDS_BACKUP_DIR||join(dir,'backups'));
export function createBackup(){
 return withAccountLock(()=>{
  mkdirSync(backupDir,{recursive:true,mode:0o700});
  const name='gds-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomBytes(4).toString('hex');
  const tmp=join(backupDir,'.'+name+'.tmp'),dest=join(backupDir,name);mkdirSync(tmp,{mode:0o700});
  try{
   const included=[];
   for(const file of files){const source=join(dir,file);if(existsSync(source)){copyFileSync(source,join(tmp,file));included.push(file)}}
   writeFileSync(join(tmp,'manifest.json'),JSON.stringify({createdAt:new Date().toISOString(),files:included},null,2),{mode:0o600});
   renameSync(tmp,dest);
  }catch(error){rmSync(tmp,{recursive:true,force:true});throw error}
  const old=readdirSync(backupDir,{withFileTypes:true}).filter(d=>d.isDirectory()&&/^gds-\d{4}-\d{2}-\d{2}T[\d-]+Z-[a-f0-9]{8}$/.test(d.name)).map(d=>d.name).filter(n=>n!==name).sort().reverse();
  for(const name of old.slice(41))rmSync(join(backupDir,name),{recursive:true,force:true});
  console.log('Резервная копия создана:',dest);return dest;
 });
}
export function startBackups(){const run=()=>{try{createBackup()}catch(e){console.error('ОШИБКА РЕЗЕРВНОЙ КОПИИ:',e.message)}};run();const timer=setInterval(run,4*60*60*1000);timer.unref();return timer}

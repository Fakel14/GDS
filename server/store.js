import {mkdirSync, readFileSync, writeFileSync, renameSync} from 'node:fs';
import {scryptSync, randomBytes, timingSafeEqual} from 'node:crypto';
import {resolve} from 'node:path';
export const dir = resolve(process.env.GDS_DATA_DIR || './data');
const file = resolve(dir, 'accounts.json');
export function readAccounts(){try{return JSON.parse(readFileSync(file,'utf8'))}catch(e){if(e.code==='ENOENT') return []; throw e}}
export function writeAccounts(accounts){mkdirSync(dir,{recursive:true});const temp=file+'.'+randomBytes(8).toString('hex')+'.tmp';writeFileSync(temp,JSON.stringify(accounts,null,2),{mode:0o600});renameSync(temp,file)}
export function hashCode(code,salt=randomBytes(16).toString('hex')){return {salt,hash:scryptSync(code,salt,64).toString('hex')}}
export function checkCode(code,account){try{return timingSafeEqual(Buffer.from(account.hash,'hex'),scryptSync(code,account.salt,64))}catch{return false}}
export function nicknameValid(n){return typeof n==='string' && n.trim()===n && n.length>=3 && n.length<=30 && /^[\p{L}\p{N}_-]+$/u.test(n)}

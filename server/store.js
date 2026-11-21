import {mkdirSync, readFileSync, writeFileSync, renameSync, openSync, closeSync, unlinkSync} from 'node:fs';
import {scryptSync, randomBytes, timingSafeEqual} from 'node:crypto';
import {resolve} from 'node:path';
export const dir = resolve(process.env.GDS_DATA_DIR || './data');
const file = resolve(dir, 'accounts.json');
const listingsFile = resolve(dir, 'listings.json');
export function readAccounts(){try{return JSON.parse(readFileSync(file,'utf8'))}catch(e){if(e.code==='ENOENT') return []; throw e}}
export function writeAccounts(accounts){mkdirSync(dir,{recursive:true});const temp=file+'.'+randomBytes(8).toString('hex')+'.tmp';writeFileSync(temp,JSON.stringify(accounts,null,2),{mode:0o600});renameSync(temp,file)}
export function readListings(){try{return JSON.parse(readFileSync(listingsFile,'utf8'))}catch(e){if(e.code==='ENOENT')return [];throw e}}
export function writeListings(listings){mkdirSync(dir,{recursive:true});const temp=listingsFile+'.'+randomBytes(8).toString('hex')+'.tmp';writeFileSync(temp,JSON.stringify(listings,null,2),{mode:0o600});renameSync(temp,listingsFile)}
export const nicknameKey = n => n.normalize('NFKC').toLowerCase();
// Старые аккаунты были выданы только проверенным продавцам. Новые создаются с явным sellerApproved: false.
export const isSeller = account => !!account && (account.sellerApproved === undefined || account.sellerApproved === true || isAdmin(account));
export const isAdmin = account => account?.role === 'admin' && account.nickname.toLowerCase() === 'fakelo4ik';
export function hashCode(code,salt=randomBytes(16).toString('hex')){return {salt,hash:scryptSync(code,salt,64).toString('hex')}}
export function checkCode(code,account){try{return timingSafeEqual(Buffer.from(account.hash,'hex'),scryptSync(code,account.salt,64))}catch{return false}}
export function nicknameValid(n){return typeof n==='string' && n.trim()===n && n.length>=3 && n.length<=30 && /^[\p{L}\p{N}_-]+$/u.test(n)}

// Serialise read-modify-write operations on accounts across the server and admin CLI.
export function withAccountLock(fn){mkdirSync(dir,{recursive:true});const lock=resolve(dir,'accounts.lock');let fd;try{fd=openSync(lock,'wx',0o600)}catch(e){if(e.code==='EEXIST')throw new Error('База аккаунтов занята. Повторите попытку.');throw e}try{return fn()}finally{closeSync(fd);unlinkSync(lock)}}

const conversationsFile = resolve(dir, 'conversations.json');
export function readConversations(){try{return JSON.parse(readFileSync(conversationsFile,'utf8'))}catch(e){if(e.code==='ENOENT')return [];throw e}}
export function writeConversations(conversations){mkdirSync(dir,{recursive:true});const temp=conversationsFile+'.'+randomBytes(8).toString('hex')+'.tmp';writeFileSync(temp,JSON.stringify(conversations,null,2),{mode:0o600});renameSync(temp,conversationsFile)}

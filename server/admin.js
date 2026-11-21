import {randomBytes,randomUUID} from 'node:crypto';
import {readAccounts,writeAccounts,hashCode,checkCode,nicknameValid,nicknameKey,withAccountLock} from './store.js';
const [command,value,proof] = process.argv.slice(2);
try { withAccountLock(()=>{
const accounts=readAccounts();
if(command==='approve-seller'){
 const account=accounts.find(a=>a.id===value);
 if(!account||account.banned||!account.sellerRequest||Date.now()>account.sellerRequest.expires||typeof proof!=='string'||proof.length>100||!checkCode(proof,account.sellerRequest)){throw new Error('Неверный или просроченный код заявки, либо аккаунт заблокирован')}
 account.sellerApproved=true;delete account.sellerRequest;writeAccounts(accounts);console.log('Статус продавца выдан: '+account.nickname);return;
}
if(command==='grant-admin'){
 const account=accounts.find(a=>a.id===value && a.nickname.toLowerCase()==='fakelo4ik');
 if(!account){console.error('Укажите ID существующего аккаунта Fakelo4ik.');throw new Error('Операция отменена')}
 account.role='admin';writeAccounts(accounts);console.log('Права администратора выданы аккаунту '+account.nickname);return;
}
const nickname=value;
if(command!=='create' || !nicknameValid(nickname)){console.error('Использование: npm run account:create -- "Никнейм" (3–30 букв, цифр, _ или -)');throw new Error('Операция отменена')}
if(accounts.some(a=>nicknameKey(a.nickname)===nicknameKey(nickname))){console.error('Этот никнейм уже занят.');throw new Error('Операция отменена')}
const id=randomUUID();const code=randomBytes(24).toString('base64url');
accounts.push({id,nickname,sellerApproved:false,...hashCode(code),createdAt:new Date().toISOString()});writeAccounts(accounts);
console.log(`Аккаунт создан. Передайте данные владельцу через личное сообщение Newgrounds:\nНик: ${nickname}\nID: ${id}\nКод: ${code}\nКод показывается только один раз. Не публикуйте его и не храните в переписке дольше необходимого.`);

}); } catch (e) { console.error(e.message); process.exitCode=1; }

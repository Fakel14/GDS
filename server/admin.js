import {randomBytes,randomUUID} from 'node:crypto';
import {readAccounts,writeAccounts,hashCode,nicknameValid} from './store.js';
const [command,nickname] = process.argv.slice(2);
if(command!=='create' || !nicknameValid(nickname)){console.error('Использование: npm run account:create -- "Никнейм" (3–30 букв, цифр, _ или -)');process.exit(1)}
const accounts=readAccounts();
if(accounts.some(a=>a.nickname.toLocaleLowerCase()===nickname.toLocaleLowerCase())){console.error('Этот никнейм уже занят.');process.exit(1)}
const id=randomUUID();const code=randomBytes(24).toString('base64url');
accounts.push({id,nickname,...hashCode(code),createdAt:new Date().toISOString()});writeAccounts(accounts);
console.log(`Аккаунт создан. Передайте данные владельцу через личное сообщение Newgrounds:\nНик: ${nickname}\nID: ${id}\nКод: ${code}\nКод показывается только один раз. Не публикуйте его и не храните в переписке дольше необходимого.`);

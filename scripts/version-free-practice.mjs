import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const banks=await Promise.all(['lib/question_bank.dart','lib/question_translations.dart','lib/level_questions.dart','lib/level_question_translations.dart'].map(p=>readFile(p)));
const version=createHash('sha256').update(Buffer.concat(banks)).digest('hex').slice(0,16);
const path='freepractice.html';
const html=await readFile(path,'utf8');
const pattern=/<base href="\/freepractice\/releases\/[^/]+\/">/g;
if ((html.match(pattern)||[]).length!==1) throw new Error('Expected one free-practice release base');
await writeFile(path,html.replace(pattern,'<base href="/freepractice/releases/'+version+'/">'));
console.log('Free-practice asset version: '+version);

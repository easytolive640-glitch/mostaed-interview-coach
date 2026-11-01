import {writeFile} from 'node:fs/promises';
import {questionBank} from '../practice-questions.mjs';
import {previousQuestionBanks} from '../lib/server/question-bank-history.mjs';

// Keep published wording available to clients opened before the next deployment.
const versions = [questionBank, ...previousQuestionBanks];
const seen = new Set();
const unique = versions.filter(bank => {
  const encoded = JSON.stringify(bank);
  if (seen.has(encoded)) return false;
  seen.add(encoded);
  return true;
});
await writeFile(new URL('../lib/server/question-bank-history.mjs', import.meta.url),
  '// Published wordings retained for in-progress sessions.\nexport const previousQuestionBanks = ' + JSON.stringify(unique,null,2) + ';\n');

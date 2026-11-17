// Проверка на текстовете: латински букви вътре в български думи (напр. „намазa“ с латинско „a“)
// и валиден JSON в data/. Пуска се с: node tools/test-tekstove.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const files = [
  ...readdirSync(join(root, 'data')).filter(f => f.endsWith('.json')).map(f => join('data', f)),
  ...readdirSync(join(root, 'js')).filter(f => f.endsWith('.js')).map(f => join('js', f)),
  'index.html',
];

const mixed = /[A-Za-zЀ-ӿ]+/g;
let errors = 0;
for (const f of files) {
  const text = readFileSync(join(root, f), 'utf8');
  if (f.endsWith('.json')) {
    try { JSON.parse(text); } catch (e) { console.error(`${f}: невалиден JSON – ${e.message}`); errors++; }
  }
  text.split('\n').forEach((line, i) => {
    for (const [w] of line.matchAll(mixed)) {
      if (/[Ѐ-ӿ]/.test(w) && /[A-Za-z]/.test(w)) {
        console.error(`${f}:${i + 1}: смесени букви в „${w}“`);
        errors++;
      }
    }
  });
}
if (errors) { console.error(`\n${errors} грешки`); process.exit(1); }
console.log(`Текстовете са чисти (${files.length} файла).`);

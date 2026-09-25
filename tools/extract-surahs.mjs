// Вади арабски текст (Hafs) и превод (Теофанов) на кратките сури от проверените данни на quran-kerim.
import { readFileSync, writeFileSync } from 'node:fs';
const src = 'C:/Users/roika/Projects/quran-kerim/data/';
const meta = JSON.parse(readFileSync(src + 'meta.json', 'utf8')).surahs;
const want = [1, 103, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 2];
const out = {};
for (const n of want) {
  const rows = JSON.parse(readFileSync(`${src}s/${n}.json`, 'utf8'));
  const m = meta.find(s => s.n === n);
  const pick = n === 2 ? [255] : rows.map((_, i) => i + 1);
  out[n] = { name: m.name, ar: m.ar, mean: m.mean, ayahs: pick.map(a => { const [ar, tr] = rows[a - 1]; return { a, ar: ar.replace(/\s*[\u0660-\u0669]+\s*$/, ''), tr }; }) };
}
writeFileSync('data/surahs.json', JSON.stringify(out, null, 0));
console.log('ok', Object.keys(out).join(','), 'bytes', JSON.stringify(out).length);

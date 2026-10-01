// Проверка на преводите: всеки текст от кода, който минава през t('…'), да има превод в lang/<език>.js.
// Пускане: node tools/check-i18n.cjs [en]   (--list – само списък с текстовете за превод)
// Текстовете, които се подават отвън (имена на молитви, рецитатори, сури…), се проверяват с теста в браузъра (window.i18nMissing).
// Файлът е еднакъв в Муаллим и Куран-и Керим.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const code = fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js') && f !== 'intro3d.js').map(f => fs.readFileSync(path.join(root, 'js', f), 'utf8')).join('\n');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const keys = new Set();
// t('…') с единични кавички; \' вътре е позволено
for (const m of code.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) keys.add(m[1].replace(/\\'/g, "'").replace(/\\n/g, '\n'));
// t(условие ? '…' : '…')
for (const m of code.matchAll(/\bt\([^()'`]*\?\s*'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'/g)) { keys.add(m[1]); keys.add(m[2]); }
// tn(n, '…', '…') / plural(n, '…', '…')
for (const m of code.matchAll(/\b(?:tn|plural)\([^,]+,\s*'([^']*)',\s*'([^']*)'\)/g)) { keys.add(m[1]); keys.add(m[2]); }
// статичният текст в index.html
for (const m of html.matchAll(/<[^>]*\bdata-i18n\b[^>]*>([^<]+)</g)) keys.add(m[1].trim());
for (const m of html.matchAll(/aria-label="([^"]*[А-Яа-я][^"]*)"/g)) keys.add(m[1]);

const list = [...keys].filter(k => /[А-Яа-я]/.test(k)).sort();
if (process.argv.includes('--list')) { console.log(JSON.stringify(list, null, 1)); process.exit(0); }
const lang = process.argv.find(a => /^[a-z]{2}$/.test(a)) || 'en';
const dictFile = path.join(root, 'lang', lang + '.js');
const src = fs.readFileSync(dictFile, 'utf8').replace(/^export default/m, 'module.exports =');
const m = { exports: {} }; new Function('module', src)(m);
const D = m.exports;
const missing = list.filter(k => !Object.hasOwn(D, k));
// {плейсхолдърите} трябва да са същите в превода
const badVars = Object.entries(D).filter(([k, v]) => { const a = (k.match(/\{\w+\}/g) || []).sort().join(), b = (String(v).match(/\{\w+\}/g) || []).sort().join(); return a !== b; }).map(([k]) => k);
const cyr = Object.entries(D).filter(([, v]) => /[А-Яа-я]/.test(v)).map(([k]) => k);
console.log(`${lang}: ${list.length} текста в кода, ${Object.keys(D).length} в речника`);
if (missing.length) console.log('Липсва превод:\n  ' + missing.join('\n  '));
if (badVars.length) console.log('Различни {…} в превода:\n  ' + badVars.join('\n  '));
if (cyr.length) console.log('Кирилица в превода:\n  ' + cyr.join('\n  '));
if (!missing.length && !badVars.length && !cyr.length) console.log('Всичко е преведено.');
process.exit(missing.length || badVars.length || cyr.length ? 1 : 0);

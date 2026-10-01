// Проверка на езика с истински браузър: всеки екран на друг език (по подразбиране английски) –
//  1) няма текст без превод (window.i18nMissing);
//  2) няма видим български текст извън съдържанието, което още е на български (маркирано с lang="bg").
// Пускане (Git Bash): NODE_PATH="$(npm root -g)" node tools/test-i18n.cjs [en] [папка-за-снимки]
// Файлът е еднакъв в Муаллим и Куран-и Керим.
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), net = require('net');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const LANG = process.argv.find(a => /^[a-z]{2}$/.test(a)) || 'en';
const SHOTS = process.argv.slice(2).find(a => !/^[a-z]{2}$/.test(a));
const quran = fs.existsSync(path.join(root, 'js/prayer.js'));
let pass = 0, fail = 0; const errors = [];
const ok = (name, cond, info = '') => { cond ? pass++ : fail++; console.log((cond ? '  ✓ ' : '  ✗ ') + name + (!cond && info ? '\n      ' + info : '')); };

// видимият текст на кирилица извън [lang=bg] (и извън арабския текст)
const leftovers = () => {
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const s = n.nodeValue.trim(); if (!/[А-Яа-я]/.test(s)) continue;
    const el = n.parentElement; if (!el || el.closest('script, style, template') || el.closest('[lang]')?.getAttribute('lang') === 'bg') continue; // най-близкият lang решава: бутон с lang=en вътре в урок се проверява
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden' || el.closest('[hidden], [inert]:not(.app)')) continue;
    out.push(s.slice(0, 80));
  }
  for (const el of document.querySelectorAll('[aria-label], [placeholder], [title], [alt]'))
    for (const a of ['aria-label', 'placeholder', 'title', 'alt']) { const v = el.getAttribute(a); if (v && /[А-Яа-я]/.test(v) && !['bg', 'ar'].includes(el.closest('[lang]')?.getAttribute('lang'))) out.push(`${a}="${v.slice(0, 60)}"`); }
  return [...new Set(out)];
};

(async () => {
  const port = await new Promise(r => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
  const U = `http://localhost:${port}/`;
  const srv = spawn(process.execPath, [path.join(root, 'tools/serve.mjs'), String(port)], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch({ channel: 'msedge' });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await ctx.route(/everyayah\.com/, r => r.abort());
  await ctx.addInitScript(() => {
    if (!sessionStorage.i18nTest) {
      sessionStorage.i18nTest = 1;
      // Куран-и Керим: без началния екран, с избрано място (Рибново – село, за да се види и обяснението за разликата)
      localStorage.setItem('qk:v1', JSON.stringify({ intro: false, place: { name: 'Рибново', type: 1, lat: 41.5586, lon: 23.8339, obl: 'Благоевград', obs: 'Гърмен' } }));
    }
  });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message));
  let n = 0;
  const check = async (name, act) => {
    if (act) await act(); await p.waitForTimeout(450);
    const left = await p.evaluate(leftovers);
    ok(`${name}: без български текст`, !left.length, left.slice(0, 8).join(' | '));
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, `${String(++n).padStart(2, '0')}-${name.replace(/[^\w-]+/g, '_')}.png`) }); }
  };
  const go = async h => { await p.goto(U + h); await p.waitForSelector('#view *'); };
  const closeAll = () => p.evaluate(() => { document.querySelectorAll('dialog[open]').forEach(d => d.close()); document.querySelector('#scrim')?.click(); });

  try {
    await p.goto(U + `?lang=${LANG}#/`); await p.waitForSelector('#view *');
    ok(`?lang=${LANG} избира езика и изчезва от адреса`, await p.evaluate(l => document.documentElement.lang === l && !location.search, LANG));
    // …/en/ – страницата за групите: английска визитка и веднага приложението на английски
    await p.evaluate(() => localStorage.setItem('me7ko:lang', 'bg'));
    await p.goto(U + LANG + '/'); await p.waitForSelector('#view *');
    ok(`…/${LANG}/ отваря приложението на езика`, await p.evaluate(l => document.documentElement.lang === l && location.pathname === '/', LANG));
    const og = await (await fetch(U + LANG + '/')).text();
    ok(`…/${LANG}/ има визитка на езика (og:image …-${LANG}.jpg)`, new RegExp(`og:image" content="[^"]+og-${LANG}\.jpg`).test(og));
    if (quran) {
      await check('начало');
      await check('търсене на сура по английското значение', () => p.fill('#q', 'cow'));
      ok('намира „The Cow“', /Al-Baqarah/.test(await p.textContent('#list')));
      await check('джузове', async () => { await p.fill('#q', ''); await p.click('[data-t=juz]'); });
      await go('#/s/1'); await check('сура');
      await check('лист на айет', () => p.click('#a-2 [data-act=more]'));
      await check('заучаване', () => p.click('[data-x=hifz]'));
      await closeAll(); await check('рецитатор', () => p.click('#recBtn'));
      await closeAll(); await check('размер', () => p.click('#tSize'));
      await closeAll(); await check('изглед', () => p.click('#tView'));
      await closeAll(); await go('#/s/2/255'); await check('плейър', () => p.click('#a-255 [data-act=play]'));
      await check('режим на плейъра', () => p.click('#plMode'));
      await closeAll(); await p.click('#plClose');
      await go('#/prayer'); await p.waitForSelector('#times .trow'); await check('намаз');
      await check('календар за месеца', () => p.click('#monthBtn'));
      await check('избор на място', () => p.click('#placeBtn'));
      await closeAll(); await go('#/qibla'); await check('кибла');
      await go('#/bookmarks'); await check('отметки (празни)');
      await go('#/s/1'); await p.click('#a-1 [data-act=bm]'); await go('#/bookmarks'); await check('отметки');
      await go('#/search/' + encodeURIComponent('милост')); await p.waitForSelector('.res-item'); await check('търсене в превода');
      await go('#/settings'); await check('настройки');
      await check('лист „Сподели“', () => p.click('.set-row [data-pw=share]'));
      await closeAll(); await check('лист „Инсталирай“', () => p.click('[data-pw-row] [data-pw=install]'));
      await closeAll();
      // начален екран (златният мусхаф)
      await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('qk:v1')); s.intro = true; localStorage.setItem('qk:v1', JSON.stringify(s)); });
      await p.goto(U + '#/'); await p.waitForTimeout(900); await check('начален екран');
      await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('qk:v1')); s.intro = false; localStorage.setItem('qk:v1', JSON.stringify(s)); });
    } else {
      await check('начало');
      await go('#/kurs'); await check('уроци');
      const mods = await p.$$eval('a.mod', as => as.map(a => a.getAttribute('href')));
      for (const m of mods) { await go(m); await check('модул ' + m); }
      // по един урок от всеки вид + изпит
      const lessons = await p.evaluate(async () => {
        const c = await (await fetch('data/course.json')).json(), seen = new Set(), out = [];
        for (const m of c.modules) for (const l of m.lessons) if (!seen.has(l.type)) { seen.add(l.type); out.push(`#/l/${m.id}/${l.id}`); }
        return out;
      });
      for (const l of lessons) { await go(l); await check('урок ' + l); }
      await go('#/settings'); await check('настройки');
      await check('лист „Сподели“', () => p.click('.set-row [data-pw=share]'));
      await closeAll();
    }
    const miss = await p.evaluate(() => [...window.i18nMissing]);
    ok('всички текстове имат превод (i18nMissing)', !miss.length, miss.join(' | '));
    // обратно на български – езикът се сменя от Настройки
    await go('#/settings'); await p.click('[data-setlang=bg]'); await p.waitForSelector('#view *'); await p.waitForTimeout(300);
    ok('„Български“ в Настройки връща езика', await p.evaluate(() => document.documentElement.lang === 'bg' && localStorage.getItem('me7ko:lang') === 'bg'));
  } catch (e) { fail++; console.log('  ✗ тестът спря: ' + e.message.split('\n')[0]); }
  await b.close(); srv.kill();
  const errs = [...new Set(errors)];
  console.log(`\n${pass} минаха, ${fail} не минаха` + (errs.length ? `\nГрешки в страницата: ${errs.join(' | ')}` : ''));
  process.exit(fail || errs.length ? 1 : 0);
})();

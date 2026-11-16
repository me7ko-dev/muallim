// Снимки на главните екрани: компютър (1280×800) и телефон (390×844), светла и тъмна тема + грешки в конзолата.
// Пускане (сървърът да е пуснат):  NODE_PATH="$(npm root -g)" node tools/shots.cjs <папка> [адрес]
const { chromium } = require('playwright');
const fs = require('fs');
const out = process.argv[2] || 'shots';
const base = (process.argv[3] || 'http://localhost:8932/').replace(/#.*$/, '');
const SCREENS = [
  ['nachalo', '#/'],
  ['uroci', '#/kurs'],
  ['modul', '#/m/elifba'],
  ['bukvi', '#/l/elifba/l1'],
  ['fetha', '#/l/harake/fetha'],
  ['sura', '#/l/sureler/s1'],
  ['dua', '#/l/dualar/d1'],
  ['ezan', '#/l/ezan/ezan'],
  ['abdest', '#/l/abdest/steps'],
  ['namaz-stapki', '#/l/namaz/steps2'],
  ['izpit', '#/l/elifba/quiz'],
  ['sglobi', '#/l/elifba/build'],
  ['nastroiki', '#/settings'],
];
const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ channel: 'msedge' }); // Edge е на всеки Windows – без сваляне на браузъри
  const problems = [];
  try {
    for (const [dev, vp, mobile] of [['desktop', { width: 1280, height: 800 }, false], ['telefon', { width: 390, height: 844 }, true]]) {
      for (const scheme of ['light', 'dark']) {
        const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, colorScheme: scheme, serviceWorkers: 'block' });
        // напредък за по-истински вид
        await ctx.addInitScript(() => { try { if (!localStorage.getItem('mu:v1')) localStorage.setItem('mu:v1', JSON.stringify({ done: { 'elifba/l1': 1, 'elifba/l2': 1, 'harake/fetha': 1 }, last: { m: 'elifba', l: 'l3' }, streak: { days: 3, last: new Date().toISOString().slice(0, 10) } })); } catch (e) {} });
        const page = await ctx.newPage();
        page.on('console', m => { if (m.type() === 'error') problems.push(`${dev}/${scheme} ${page.url()} конзола: ${m.text()}`); });
        page.on('pageerror', e => problems.push(`${dev}/${scheme} ${page.url()} грешка: ${e.message}`));
        page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base)) problems.push(`${dev}/${scheme} липсва ${r.status()}: ${r.url()}`); });
        await page.goto(base); await page.waitForTimeout(800);
        for (const [name, hash] of SCREENS) {
          if (only && !only.includes(name)) continue;
          await page.evaluate(h => { location.hash = h; }, hash);
          await page.waitForTimeout(700);
          await page.screenshot({ path: `${out}/${name}-${dev}-${scheme}.jpg`, type: 'jpeg', quality: 78 });
        }
        await ctx.close();
      }
    }
  } finally { await browser.close(); }
  console.log(problems.length ? problems.join('\n') : 'без грешки в конзолата');
})();

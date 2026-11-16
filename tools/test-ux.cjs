// Проверка на поведението в истински браузър (Edge през Playwright): урок → „Научих го“, изпит до резултата,
// „Чуй всички букви“, запис от микрофона (фалшив микрофон), тема, работа без интернет, без localStorage.
// Пускане (сървърът да е пуснат):  NODE_PATH="$(npm root -g)" node tools/test-ux.cjs [адрес]
const { chromium } = require('playwright');
const base = (process.argv[2] || 'http://localhost:8932/').replace(/#.*$/, '');
let fails = 0;
const ok = (cond, msg) => { console.log(`${cond ? '✓' : '✕'} ${msg}`); if (!cond) fails++; };
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
  const errors = [];
  const watch = (page, tag) => {
    page.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`${tag} конзола: ${m.text()}`); });
  };
  try {
    // ---------- телефон ----------
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, permissions: ['microphone'] });
    const page = await ctx.newPage(); watch(page, 'телефон');
    await page.goto(base); await page.waitForSelector('.resume');
    ok(await page.locator('.resume').getAttribute('href') === '#/l/elifba/l1', 'нов потребител: „Започнете оттук“ води към първия урок');
    await page.locator('.resume').click(); await page.waitForSelector('#doneBtn');
    ok((await page.locator('.topbar .kicker').textContent()).includes('урок 1 от 8'), 'урокът показва място в модула');
    await page.locator('#doneBtn').click(); await wait(300);
    ok((await page.locator('#doneBtn').textContent()).includes('Завършен'), '„Научих го“ отбелязва урока');
    ok(await page.locator('.next-card.celebrate').count() === 1, 'след завършване следващият урок се откроява');
    ok(await page.evaluate(() => JSON.parse(localStorage.getItem('mu:v1')).done['elifba/l1'] > 0), 'напредъкът е записан в localStorage');
    // „Чуй всички букви“
    await page.locator('[data-seq]').click(); await wait(1200);
    ok((await page.locator('[data-seq]').textContent()).includes('Спри'), '„Чуй всички букви“ става „Спри“');
    ok(await page.locator('.letter.cur').count() === 1, 'буквата, която звучи, е осветена');
    await page.locator('[data-seq]').click(); await wait(200);
    ok((await page.locator('[data-seq]').textContent()).includes('Чуй всички'), '„Спри“ спира звука');
    // запис от микрофона
    await page.locator('[data-recbtn]').scrollIntoViewIfNeeded();
    await page.locator('[data-recbtn]').click(); await wait(900);
    ok((await page.locator('[data-recbtn]').textContent()).includes('Спри записа'), 'записът започва');
    await page.locator('[data-recbtn]').click(); await wait(600);
    ok(await page.locator('[data-recout] audio').count() === 1, 'записът може да се чуе');
    // излизане по време на запис – микрофонът се изключва без грешка
    await page.locator('[data-recbtn]').click(); await wait(600);
    await page.evaluate(() => { location.hash = '#/m/elifba'; }); await wait(500);
    ok(await page.locator('.path li.done').count() === 1 && await page.locator('.path li.cur').count() === 1, 'модулът: 1 завършен урок и следващият е отбелязан');
    // изпит до резултата
    await page.evaluate(() => { location.hash = '#/l/elifba/quiz'; }); await page.waitForSelector('#quiz .opt');
    for (let i = 0; i < 30; i++) {
      const opt = page.locator('#quiz .opt:not([disabled])').first();
      if (!(await opt.count())) break;
      await opt.click(); await page.locator('#quiz > .nextq').click();
    }
    ok(await page.locator('#quiz .result .ring').count() === 1, 'изпитът стига до резултат с кръг');
    ok(await page.evaluate(() => !!JSON.parse(localStorage.getItem('mu:v1')).scores['elifba/quiz']), 'резултатът от изпита е записан');
    // клавиатура в изпита
    await page.locator('#again').click(); await wait(200);
    await page.keyboard.press('2'); await wait(150);
    ok(await page.locator('#quiz .opt.ok').count() === 1, 'клавиш 2 избира отговор');
    // сглоби думата – вярна буква
    await page.evaluate(() => { location.hash = '#/l/elifba/build'; }); await page.waitForSelector('.tile');
    const first = await page.evaluate(() => { const w = document.querySelector('.build .word .ar').textContent.replace(/[ـً-ٰٟ]/g, ''); return [...w][0]; });
    await page.locator('.tile', { hasText: first }).first().click(); await wait(200);
    ok(await page.locator('.slots span.ok').count() === 1, '„Сглоби думата“: вярната буква влиза на мястото си');
    // тема
    await page.evaluate(() => { location.hash = '#/settings'; }); await page.waitForSelector('#themeSeg');
    await page.locator('#themeSeg [data-t="dark"]').click();
    ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'тъмна тема се включва');
    await page.reload(); await page.waitForSelector('#themeSeg');
    ok(await page.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'темата се помни след презареждане');
    ok(await page.locator('#themeSeg [data-t="dark"]').getAttribute('aria-pressed') === 'true', 'бутонът на темата е отбелязан (aria-pressed)');
    // „Назад“ остава в приложението
    await page.evaluate(() => { location.hash = '#/l/namaz/steps2'; }); await page.waitForSelector('.topbar a.ib');
    ok(await page.locator('.topbar a.ib').getAttribute('href') === '#/m/namaz', '„Назад“ води към модула');
    await page.locator('#stNext').click(); await wait(200);
    ok((await page.locator('.stepper .pos').textContent()).includes('стъпка 2'), 'стъпките на намаза вървят напред');
    // без хоризонтално превъртане на 390 px
    for (const h of ['#/', '#/kurs', '#/m/elifba', '#/l/elifba/l1', '#/l/sureler/s1', '#/l/ezan/ezan', '#/l/elifba/build', '#/settings']) {
      await page.evaluate(x => { location.hash = x; }, h); await wait(350);
      const w = await page.evaluate(() => document.documentElement.scrollWidth);
      ok(w <= 390, `${h}: без хоризонтално превъртане (${w}px)`);
    }
    // без интернет (service worker)
    await page.goto(base); await page.waitForSelector('.resume');
    await page.evaluate(() => navigator.serviceWorker.ready); await wait(1500);
    await page.reload(); await page.waitForSelector('.resume'); // вече под контрола на sw
    await ctx.setOffline(true);
    await page.reload(); await wait(1500);
    ok(await page.locator('.resume').count() === 1, 'без интернет: приложението се отваря');
    await page.evaluate(() => { location.hash = '#/l/elifba/l2'; }); await wait(500);
    ok(await page.locator('.letter').count() === 7, 'без интернет: урокът с буквите се отваря');
    await ctx.setOffline(false);
    await ctx.close();

    // ---------- без localStorage (частен прозорец / забранено) ----------
    const c2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
    await c2.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('забранено'); } }); });
    const p2 = await c2.newPage(); watch(p2, 'без localStorage');
    await p2.goto(base); await wait(1200);
    ok(await p2.locator('.resume').count() === 1, 'без localStorage: началото се показва');
    await p2.evaluate(() => { location.hash = '#/l/elifba/l1'; }); await wait(400);
    await p2.locator('#doneBtn').click(); await wait(200);
    ok((await p2.locator('#doneBtn').textContent()).includes('Завършен'), 'без localStorage: „Научих го“ работи до презареждане');
    await c2.close();
  } finally { await browser.close(); }
  const real = errors.filter(e => !/Failed to load resource/.test(e));
  ok(!real.length, 'без грешки в конзолата' + (real.length ? ':\n   ' + real.join('\n   ') : ''));
  console.log(fails ? `\n${fails} проверки не минаха` : '\nвсички проверки минаха');
  process.exit(fails ? 1 : 0);
})();

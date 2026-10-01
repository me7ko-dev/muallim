// Тест на „Инсталирай“ и „Сподели“ (js/pwa.js) с истински браузър – телефон и компютър.
// Пускане (Git Bash): NODE_PATH="$(npm root -g)" node tools/test-pwa.cjs [папка-за-снимки]
// Сам пуска tools/serve.mjs на свободен порт. Файлът е еднакъв в Муаллим и Куран-и Керим.
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path'), net = require('net');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const SHOTS = process.argv[2];
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const SITE = html.match(/property="og:url" content="([^"]+)"/)[1];
const UA = {
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  androidFb: 'Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/140.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0;]',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1',
  iphoneFb: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/22G86 [FBAN/FBIOS;FBAV/480.0.0;]',
};
const phone = ua => ({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: ua, deviceScaleFactor: 2 });

let pass = 0, fail = 0; const errors = [];
const ok = (name, cond, info = '') => { cond ? pass++ : fail++; console.log((cond ? '  ✓ ' : '  ✗ ') + name + (!cond && info ? '  — ' + info : '')); };
// истинският beforeinstallprompt на браузъра се спира; тестът праща свой (с __fake) и брои prompt()
const init = () => {
  addEventListener('beforeinstallprompt', e => { if (!e.__fake) e.stopImmediatePropagation(); }, true);
  window.fakeBip = (outcome = 'accepted') => {
    const e = new Event('beforeinstallprompt', { cancelable: true });
    e.__fake = true; e.prompt = () => { window.prompted = (window.prompted || 0) + 1; return Promise.resolve(); };
    e.userChoice = Promise.resolve({ outcome }); dispatchEvent(e);
  };
  try { if (!localStorage.getItem('qk:v1')) localStorage.setItem('qk:v1', '{"intro":false}'); } catch (e) {} // без началния екран на Куран-и Керим
};

(async () => {
  const port = await new Promise(r => { const s = net.createServer().listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
  const U = `http://localhost:${port}/`;
  const srv = spawn(process.execPath, [path.join(root, 'tools/serve.mjs'), String(port)], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 700));
  const b = await chromium.launch({ channel: 'msedge' });
  const open = async (opt, hash = '#/', extra) => {
    const ctx = await b.newContext(opt); const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(e.message));
    await p.addInitScript(init); if (extra) await p.addInitScript(extra);
    await p.goto(U + hash); await p.waitForSelector('#view *'); await p.waitForTimeout(500);
    return Object.assign(p, { ctx });
  };
  const shot = async (p, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.screenshot({ path: path.join(SHOTS, name + '.png') }); } };
  const sheet = p => p.evaluate(() => { const d = document.querySelector('.pw-sheet'); return d && d.open ? { kind: d.dataset.kind, text: d.innerText, html: d.innerHTML } : null; });
  const overflow = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

  try {
    console.log('Android, Chrome – истинският прозорец за инсталиране');
    { const p = await open(phone(UA.android));
      ok('картата „Инсталирайте“ е на началния екран', await p.isVisible('[data-pw-card]'));
      ok('няма хоризонтално превъртане (390 px)', !(await overflow(p)));
      await shot(p, '1-android-nachalo');
      await p.evaluate(() => fakeBip('accepted'));
      await p.click('[data-pw-card] [data-pw=install]'); await p.waitForTimeout(300);
      ok('„Инсталирай“ отваря прозореца на браузъра', await p.evaluate(() => window.prompted) === 1);
      ok('след „Инсталирай“ картата изчезва', !(await p.$('[data-pw-card]')));
      ok('без лист отгоре', !(await sheet(p)));
      await p.ctx.close(); }
    { const p = await open(phone(UA.android));
      await p.click('[data-pw-card] [data-pw=install]'); await p.waitForTimeout(300);
      const s = await sheet(p);
      ok('без прозорец от браузъра: обяснение с менюто ⋮', s && s.kind === 'install' && /⋮/.test(s.text), s && s.text);
      await shot(p, '2-android-obyasnenie');
      await p.evaluate(() => fakeBip('dismissed')); await p.waitForTimeout(200);
      const s2 = await sheet(p);
      ok('прозорецът дойде, докато листът е отворен: бутон „Инсталирай сега“', s2 && /Инсталирай сега/.test(s2.text), s2 && s2.text);
      await p.click('.pw-sheet [data-pw=install]'); await p.waitForTimeout(300);
      ok('„Инсталирай сега“ отваря прозореца на браузъра', await p.evaluate(() => window.prompted) === 1);
      ok('отказ – картата остава', await p.isVisible('[data-pw-card]'));
      await p.ctx.close(); }

    console.log('iPhone');
    { const p = await open(phone(UA.iphone));
      await p.click('[data-pw-card] [data-pw=install]'); await p.waitForTimeout(400);
      const s = await sheet(p);
      ok('картинка с 3 стъпки „Сподели → Добави към началния екран → Добави“', s && (s.html.match(/<figure/g) || []).length === 3 && /Добави към началния екран/.test(s.text));
      ok('иконката в стъпка 3 се зарежда', await p.$eval('.pw-sheet .pw-top img', i => i.complete && i.naturalWidth > 0));
      ok('листът се побира в екрана', await p.$eval('.pw-sheet', d => d.getBoundingClientRect().height <= innerHeight && d.scrollWidth <= d.clientWidth + 1));
      await shot(p, '3-iphone-kartinka');
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      ok('Escape затваря листа', !(await sheet(p)));
      await p.ctx.close(); }
    { const p = await open({ ...phone(UA.iphone), viewport: { width: 320, height: 640 } });
      await p.click('[data-pw-card] [data-pw=install]'); await p.waitForTimeout(400);
      ok('на 320 px стъпките са една под друга, без превъртане встрани', !(await overflow(p)) && await p.$eval('.pw-sheet', d => d.scrollWidth <= d.clientWidth + 1));
      await shot(p, '4-iphone-320');
      await p.ctx.close(); }

    console.log('Линк, отворен във Facebook / Viber');
    { const p = await open(phone(UA.androidFb));
      await p.click('[data-pw-card] [data-pw=install]'); await p.waitForTimeout(300);
      const href = await p.$eval('.pw-sheet a.btn', a => a.getAttribute('href')).catch(() => '');
      ok('Android: бутон „Отвори в Chrome“ (intent към същия адрес)', href === SITE.replace('https://', 'intent://') + '#Intent;scheme=https;package=com.android.chrome;end', href);
      await shot(p, '5-android-facebook');
      await p.ctx.close(); }
    { const p = await open(phone(UA.iphoneFb));
      await p.click('[data-pw-card] [data-pw=install]'); await p.waitForTimeout(300);
      ok('iPhone: „Отвори в Safari“ и адрес за копиране', /Отвори в Safari/.test((await sheet(p))?.text || '') && await p.$eval('.pw-sheet .pw-url input', i => i.value) === SITE);
      await p.ctx.close(); }

    console.log('Споделяне');
    { const p = await open(phone(UA.android), '#/', () => { navigator.share = d => { window.shared = d; return Promise.resolve(); }; });
      await p.click('[data-pw-card] [data-pw=share]'); await p.waitForTimeout(300);
      const d = await p.evaluate(() => window.shared);
      ok('телефон: менюто на телефона с адреса на сайта, заглавие и текст', d && d.url === SITE && d.title && d.text.length > 40, JSON.stringify(d));
      ok('телефон: без наш лист отгоре', !(await sheet(p)));
      await p.ctx.close(); }
    { const p = await open({ viewport: { width: 1280, height: 800 } }, '#/settings');
      await p.ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: U });
      ok('Настройки: ред „Инсталирай“ и „Сподели“', await p.isVisible('[data-pw-row] [data-pw=install]') && await p.isVisible('.set-row [data-pw=share]'));
      await p.click('.set-row [data-pw=share]'); await p.waitForTimeout(400);
      const s = await sheet(p);
      ok('компютър: лист с Viber, WhatsApp, Facebook, Telegram', s && s.kind === 'share' && ['Viber', 'WhatsApp', 'Facebook', 'Telegram'].every(x => s.text.includes(x)));
      const links = await p.$$eval('.pw-sheet .pw-act[href]', as => as.map(a => a.href));
      ok('линковете носят адреса на сайта', links.length === 4 && links.every(h => decodeURIComponent(h).includes(SITE)), links.join(' '));
      ok('QR кодът се зарежда', await p.$eval('.pw-sheet .pw-qr img', i => i.complete && i.naturalWidth > 0));
      ok('плакатът (PDF) е на сайта', await p.evaluate(async () => (await fetch(document.querySelector('.pw-sheet a[href$=".pdf"]').href)).ok));
      await shot(p, '6-kompyutar-spodeli');
      await p.click('.pw-sheet [data-pw=copy]'); await p.waitForTimeout(200);
      ok('„Копирай“ слага адреса в паметта и казва „Копирано“', await p.evaluate(() => navigator.clipboard.readText()) === SITE && /Копирано/.test(await p.textContent('.pw-sheet [data-pw=copy]')));
      await p.mouse.click(5, 5); await p.waitForTimeout(200);
      ok('докосване извън листа го затваря', !(await sheet(p)));
      await p.click('[data-pw-row] [data-pw=install]'); await p.waitForTimeout(300);
      ok('компютър без прозорец от браузъра: обяснение за адресната лента', /адресната лента/.test((await sheet(p))?.text || ''));
      await p.ctx.close(); }
    { const p = await open({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
      ok('компютър, тъмна тема: картата е на един ред с бутоните', await p.$eval('[data-pw-card]', c => c.getBoundingClientRect().height < 110));
      await shot(p, '7-kompyutar-tamna');
      await p.click('[data-pw-card] [data-pw=share]'); await p.waitForTimeout(400); await shot(p, '8-kompyutar-tamna-spodeli');
      await p.ctx.close(); }

    console.log('Скриване и вече инсталирано');
    { const p = await open(phone(UA.android));
      await p.click('[data-pw-card] [data-pw=hide]'); await p.waitForTimeout(200);
      ok('× скрива картата', !(await p.$('[data-pw-card]')));
      await p.reload(); await p.waitForSelector('#view *'); await p.waitForTimeout(400);
      ok('и след презареждане остава скрита, а долу има „Сподели“', !(await p.$('[data-pw-card]')) && await p.$('.pw-share') !== null);
      await p.ctx.close(); }
    { const p = await open(phone(UA.iphone), '#/', () => Object.defineProperty(navigator, 'standalone', { value: true }));
      ok('отворено от началния екран: без карта, само „Сподели“', !(await p.$('[data-pw-card]')) && await p.$('.pw-share') !== null);
      await p.goto(U + '#/settings'); await p.waitForTimeout(400);
      ok('Настройки: „Отворено е като приложение ✓“ без бутон', /Отворено е като приложение/.test(await p.textContent('[data-pw-row]')) && !(await p.$('[data-pw-row] [data-pw=install]')));
      await p.ctx.close(); }
    { const p = await open(phone(UA.android), '#/', () => { sessionStorage.pwStore = '1'; });
      ok('отворено от Google Play (TWA): без карта за инсталиране', !(await p.$('[data-pw-card]')));
      await p.ctx.close(); }

    console.log('Визитка (Open Graph) и офлайн');
    { const p = await open({ viewport: { width: 800, height: 600 } });
      const og = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('meta[property^="og:"]')].map(m => [m.getAttribute('property'), m.content])));
      ok('og:url, og:title, og:description, og:image', og['og:url'] === SITE && og['og:title'] && og['og:description'] && og['og:image'] === SITE + 'share/og.jpg');
      const dim = await p.evaluate(() => new Promise(r => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.onerror = () => r(null); i.src = 'share/og.jpg'; }));
      ok('снимката е 1200×630', dim && dim[0] === 1200 && dim[1] === 630, JSON.stringify(dim));
      const missing = await p.evaluate(async () => {
        const sw = await (await fetch('sw.js')).text();
        const list = JSON.parse(sw.match(/SHELL_FILES = (\[[^\]]+\])/)[1].replace(/'/g, '"'));
        const bad = []; for (const f of list) if (!(await fetch(f)).ok) bad.push(f);
        return { bad, pwa: list.includes('js/pwa.js') };
      });
      ok('sw.js кешира js/pwa.js и всички файлове от списъка съществуват', missing.pwa && !missing.bad.length, missing.bad.join(', '));
      await p.ctx.close(); }
  } catch (e) { fail++; console.log('  ✗ тестът спря: ' + e.message); }
  await b.close(); srv.kill();
  const errs = [...new Set(errors)];
  console.log(`\n${pass} минаха, ${fail} не минаха` + (errs.length ? `\nГрешки в страницата: ${errs.join(' | ')}` : ''));
  process.exit(fail || errs.length ? 1 : 0);
})();

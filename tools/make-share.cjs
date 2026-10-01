// Прави файловете за споделяне в share/:
//   og.jpg         – визитката 1200×630, която Viber, Facebook, WhatsApp и Telegram показват под линка
//   qr.svg, qr.png – QR код към сайта (svg – в приложението и плаката; png – за изпращане като снимка)
//   plakat-a4.pdf  – плакат A4 за джамии и учители
// Пускане (Git Bash): NODE_PATH="$(npm root -g)" node tools/make-share.cjs
// Нужни глобално: npm i -g playwright qrcode. Браузър – Edge (вече е на компютъра).
// Файлът е еднакъв в Муаллим и Куран-и Керим – различен е само APP по-долу.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const QR = require('qrcode');

const APP = {
  url: 'https://me7ko-dev.github.io/muallim/',
  name: 'Муаллим', ar: 'مُعَلِّم',
  tagline: 'Учител по Коран и намаз –<br>на български, стъпка по стъпка',
  headline: 'Насочи телефона<br>и учи безплатно',
  feats: [
    ['Арабската азбука', 'всяка буква с глас и упражнения'],
    ['Сурите и дуите за намаз', 'с аудио и четене с български букви'],
    ['Абдест и намаз', 'стъпка по стъпка, с картинки'],
    ['Изпити и напредък', 'по 10–15 минути на ден'],
  ],
  note: 'Уроците са по ханефи мезхеб, както се учи в България.',
};

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'share');
const b64 = f => fs.readFileSync(path.join(root, 'fonts', f)).toString('base64');
const font = (fam, f, w) => `@font-face{font-family:'${fam}';src:url(data:font/woff2;base64,${b64(f)}) format('woff2');font-weight:${w};}`;
const FONTS = font('Manrope', 'manrope-cyrillic.woff2', '200 800') + font('Manrope', 'manrope-latin.woff2', '200 800')
  + font('Cormorant', 'cormorant-cyrillic.woff2', '300 700') + font('Cormorant', 'cormorant-latin.woff2', '300 700') + font('Hafs', 'UthmanicHafs.woff2', 400);
const ICON = fs.readFileSync(path.join(root, 'icons/icon.svg'), 'utf8').replace(/<\?xml[^>]*>/, '');
const SHORT = APP.url.replace(/^https:\/\//, '').replace(/\/$/, '');
// осмолъчна звезда – същата като в логото на Куран-и Керим
const STAR = '<path d="M32 4l7.6 10.4L52 12l-2.4 12.4L60 32l-10.4 7.6L52 52l-12.4-2.4L32 60l-7.6-10.4L12 52l2.4-12.4L4 32l10.4-7.6L12 12l12.4 2.4z"/>';

const ogHtml = `<!doctype html><meta charset="utf-8"><style>${FONTS}
*{margin:0;box-sizing:border-box;font-feature-settings:'locl' 0 !important}
body{width:1200px;height:630px;overflow:hidden;font-family:Manrope,sans-serif;color:#f5efe0;
  background:radial-gradient(900px 600px at 20% 10%,#16705a,transparent 70%),linear-gradient(135deg,#0f5c4a,#0a3b31 55%,#06231c)}
.star{position:absolute;right:-150px;top:-140px;width:760px;height:760px;fill:none;stroke:#e8c874;stroke-width:.5;opacity:.16}
.star.s2{right:40px;top:300px;width:420px;height:420px;opacity:.09}
.icon{position:absolute;left:96px;top:155px;width:320px;height:320px;border-radius:64px;overflow:hidden;
  box-shadow:0 30px 60px -20px rgba(0,0,0,.6),0 0 0 2px rgba(232,200,116,.45)}
.icon svg{width:100%;height:100%;display:block}
.txt{position:absolute;left:480px;right:60px;top:130px}
.ar{font:400 64px/1.5 Hafs,serif;color:#e2bf63;direction:rtl;text-align:left;unicode-bidi:plaintext}
h1{font:700 104px/1 Cormorant,serif;letter-spacing:.5px;margin-top:-6px}
hr{width:120px;border:0;border-top:3px solid #c9a24a;margin:26px 0 22px}
p{font:500 33px/1.38 Manrope;opacity:.93}
.url{position:absolute;left:480px;bottom:46px;font:600 24px Manrope;color:#e2bf63;letter-spacing:.3px}
</style>
<svg class="star" viewBox="0 0 64 64">${STAR}</svg><svg class="star s2" viewBox="0 0 64 64">${STAR}</svg>
<div class="icon">${ICON}</div>
<div class="txt"><div class="ar">${APP.ar}</div><h1>${APP.name}</h1><hr><p>${APP.tagline}</p></div>
<div class="url">Безплатно · без реклами · ${SHORT}</div>`;

const posterHtml = qrSvg => `<!doctype html><meta charset="utf-8"><style>${FONTS}
@page{size:A4;margin:0}
*{margin:0;box-sizing:border-box;font-feature-settings:'locl' 0 !important}
body{width:210mm;height:297mm;font-family:Manrope,sans-serif;color:#1d2a25;background:#fffaf0;overflow:hidden;display:flex;flex-direction:column}
.top{height:52mm;flex:none;background:linear-gradient(135deg,#0f5c4a,#0a3b31 60%,#06231c);color:#f5efe0;display:flex;align-items:center;gap:9mm;padding:0 16mm;position:relative;overflow:hidden}
.top .star{position:absolute;right:-30mm;top:-34mm;width:120mm;height:120mm;fill:none;stroke:#e8c874;stroke-width:.5;opacity:.18}
.top .icon{width:32mm;height:32mm;border-radius:8mm;overflow:hidden;flex:none;box-shadow:0 0 0 .6mm rgba(232,200,116,.5)}
.top .icon svg{width:100%;height:100%;display:block}
.top h2{font:700 21mm/1 Cormorant,serif}
.top .ar{font:400 11mm/1.5 Hafs,serif;color:#e2bf63;margin-top:-1mm}
h1{font:700 16mm/1.05 Cormorant,serif;text-align:center;margin:10mm 0 7mm;color:#0f3d32}
.qr{width:92mm;height:92mm;flex:none;margin:0 auto;position:relative;padding:5mm;background:#fff;border-radius:6mm;box-shadow:0 0 0 .5mm #e2d5b8}
.qr svg{width:100%;height:100%;display:block}
.qr i{position:absolute;width:14mm;height:14mm;border:1.6mm solid #b48a2c}
.qr i:nth-child(2){left:-3mm;top:-3mm;border-right:0;border-bottom:0;border-radius:5mm 0 0 0}
.qr i:nth-child(3){right:-3mm;top:-3mm;border-left:0;border-bottom:0;border-radius:0 5mm 0 0}
.qr i:nth-child(4){left:-3mm;bottom:-3mm;border-right:0;border-top:0;border-radius:0 0 0 5mm}
.qr i:nth-child(5){right:-3mm;bottom:-3mm;border-left:0;border-top:0;border-radius:0 0 5mm 0}
.how{text-align:center;font:500 4.8mm/1.45 Manrope;margin-top:7mm;color:#3a4a43}
.how b{color:#0f5c4a;font-weight:700}
.feats{display:grid;grid-template-columns:1fr 1fr;gap:5mm 8mm;margin:9mm 18mm 0;padding:0;list-style:none}
.feats li{display:flex;gap:3mm;align-items:flex-start}
.feats svg{width:7mm;height:7mm;flex:none;margin-top:.5mm;fill:none;stroke:#b48a2c;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.feats b{display:block;font:700 4.6mm/1.3 Manrope;color:#1d2a25}
.feats small{display:block;font:500 3.8mm/1.35 Manrope;color:#5c6a62}
.foot{margin-top:auto;padding:5mm 14mm 8mm;text-align:center;border-top:.4mm solid #e2d5b8}
.foot b{display:block;font:700 4.1mm Manrope;color:#0f5c4a;letter-spacing:.2mm}
.foot small{display:block;font:500 3.7mm/1.45 Manrope;color:#5c6a62;margin-top:1.5mm}
</style>
<div class="top"><svg class="star" viewBox="0 0 64 64">${STAR}</svg><div class="icon">${ICON}</div><div><h2>${APP.name}</h2><div class="ar">${APP.ar}</div></div></div>
<h1>${APP.headline}</h1>
<div class="qr">${qrSvg}<i></i><i></i><i></i><i></i></div>
<p class="how">Отворете камерата на телефона и я насочете към кода.<br>Или напишете в браузъра: <b>${SHORT}</b></p>
<ul class="feats">${APP.feats.map(([t, s]) => `<li><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><div><b>${t}</b><small>${s}</small></div></li>`).join('')}</ul>
<div class="foot"><b>Безплатно · без реклами · без регистрация · работи и без интернет</b><small>${APP.note}<br>Може да се инсталира като приложение – бутонът „Инсталирай“ в сайта.</small></div>`;

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const qrOpt = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#000000', light: '#ffffff' } };
  const qrSvg = await QR.toString(APP.url, { ...qrOpt, type: 'svg' });
  fs.writeFileSync(path.join(out, 'qr.svg'), qrSvg);
  await QR.toFile(path.join(out, 'qr.png'), APP.url, { ...qrOpt, width: 1024 });

  const browser = await chromium.launch({ channel: 'msedge' });
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.setContent(ogHtml); await og.evaluate(() => document.fonts.ready);
  await og.screenshot({ path: path.join(out, 'og.jpg'), type: 'jpeg', quality: 88 });

  const poster = await browser.newPage();
  await poster.setContent(posterHtml(qrSvg.replace(/<svg /, '<svg preserveAspectRatio="xMidYMid meet" '))); await poster.evaluate(() => document.fonts.ready);
  await poster.pdf({ path: path.join(out, 'plakat-a4.pdf'), format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  // снимка на плаката – за проверка с очи (не се качва)
  if (process.env.PREVIEW) { await poster.setViewportSize({ width: 794, height: 1123 }); await poster.screenshot({ path: process.env.PREVIEW }); }
  await browser.close();
  for (const f of ['og.jpg', 'qr.svg', 'qr.png', 'plakat-a4.pdf']) console.log(f, Math.round(fs.statSync(path.join(out, f)).size / 1024) + ' KB');
})().catch(e => { console.error(e); process.exit(1); });

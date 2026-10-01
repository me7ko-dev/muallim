// „Инсталирай“ и „Сподели“ – един и същ файл в Муаллим и Куран-и Керим (копие в другото репо).
// Android, Chrome, Edge: истинският прозорец за инсталиране (beforeinstallprompt – хваща се още в <head>, в window.__bip).
// iPhone: картинка „Сподели → Добави към началния екран“. Други браузъри: кратко обяснение.
// Нищо не се праща никъде: споделянето отваря менюто на телефона или линк към приложението, което човек избере.

const IC = {
  install: '<path d="M12 3.5v11M7.5 10.5l4.5 4.5 4.5-4.5M5 19.5h14"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="M8.2 10.8l7.6-4.1M8.2 13.2l7.6 4.1"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  print: '<path d="M7 8V3.5h10V8M7 17H4.5V9.5a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5V17H17"/><path d="M7 13.5h10V21H7z"/>',
  ios: '<path d="M12 3v11M8 7l4-4 4 4"/><path d="M8.5 10H6.5v10.5h11V10h-2"/>',
  plus: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  chevL: '<path d="M15 6l-6 6 6 6"/>', chevR: '<path d="M9 6l6 6-6 6"/>',
  book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13.5C7 18 10 18.5 12 20m0-13.5C14 5 17 4.5 20.5 5v13.5C17 18 14 18.5 12 20m0-13.5V20"/>',
  tabs: '<rect x="4" y="7" width="13" height="13" rx="2.5"/><path d="M8 4h9.5A2.5 2.5 0 0 1 20 6.5V16"/>',
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ua = navigator.userAgent;
const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const android = /Android/.test(ua);
// линк, отворен вътре във Viber, Facebook, Instagram… – оттам не може да се инсталира
const inApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Viber|Telegram|Snapchat|musical_ly|BytedanceWebview/i.test(ua) || (android && /; wv\)/.test(ua)) || (ios && !/Safari\//.test(ua));
const iosOther = ios && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
const macSafari = !ios && /Macintosh/.test(ua) && /Version\/[\d.]+.*Safari\//.test(ua);
const firefox = !android && /Firefox\//.test(ua);

// Отворено като приложение: от началния екран или от Google Play (TWA – referrer е android-app://…, само при първото зареждане)
let fromStore = document.referrer.startsWith('android-app://');
try { if (fromStore) sessionStorage.pwStore = '1'; else fromStore = sessionStorage.pwStore === '1'; } catch (e) {}
let justInstalled = false;
export const installed = () => justInstalled || fromStore || navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

let C = null, bip = window.__bip || null, dlg = null;

export function setupPwa(cfg) {
  C = cfg; // { id, name, title, text, url, toast }
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); bip = window.__bip = e; refresh(); });
  addEventListener('appinstalled', () => {
    bip = window.__bip = null; justInstalled = true;
    if (dlg?.open) dlg.close();
    refresh(); C.toast(`${C.name} е инсталиран. Ще го намерите при другите приложения.`);
    // тук по-късно: анонимно събитие „инсталирано“ към брояча на Метко Стор (когато броячът е готов)
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-pw]'); if (!b) return;
    ({ install, share, copy: () => copy(b), more: nativeShare, hide: () => hideCard(b), close: () => dlg?.close() })[b.dataset.pw]?.();
  });
}

// ---------- карта на началния екран и редове в Настройки ----------
const hideKey = () => C.id + ':pwHide';
export function installCard() {
  if (installed()) return '';
  try { if (Date.now() - (+localStorage.getItem(hideKey()) || 0) < 30 * 864e5) return ''; } catch (e) {}
  return `<div class="card pw-card" data-pw-card>
    <span class="pw-ic">${ic('install')}</span>
    <div class="pw-mid"><b>Инсталирайте ${esc(C.name)}</b><small>Отваря се с едно докосване и работи и без интернет. Не е нужен Google Play.</small></div>
    <div class="pw-acts"><button class="btn" data-pw="install">${ic('install')}Инсталирай</button><button class="btn ghost" data-pw="share">${ic('share')}Сподели</button></div>
    <button class="pw-x" data-pw="hide" aria-label="Скрий за месец" title="Скрий">${ic('x')}</button>
  </div>`;
}
// когато картата я няма (инсталирано или скрито) – само „Сподели“ долу на началния екран
export const shareButton = t => `<button class="btn ghost pw-share" data-pw="share">${ic('share')}${esc(t)}</button>`;
function hideCard(b) {
  try { localStorage.setItem(hideKey(), Date.now()); } catch (e) {}
  b.closest('[data-pw-card]')?.remove();
  C.toast('Скрито. „Инсталирай“ и „Сподели“ са и в Настройки.');
}
function installRow() {
  const inst = installed();
  return `<div class="set-row" data-pw-row><div class="mid"><b>Инсталирай като приложение</b><small>${inst ? 'Отворено е като приложение ✓' : 'Иконка на телефона или компютъра, работи и без интернет'}</small></div>${inst ? '' : `<button class="btn ghost" data-pw="install">${ic('install')}Инсталирай</button>`}</div>`;
}
export const settingsRows = () => installRow() +
  `<div class="set-row"><div class="mid"><b>Сподели с приятели</b><small>Viber, WhatsApp, Facebook, Telegram или QR код</small></div><button class="btn ghost" data-pw="share">${ic('share')}Сподели</button></div>`;
function refresh() {
  if (installed()) document.querySelectorAll('[data-pw-card]').forEach(x => x.remove());
  document.querySelectorAll('[data-pw-row]').forEach(x => { x.outerHTML = installRow(); });
  if (dlg?.open && dlg.dataset.kind === 'install') install(); // прозорецът за инсталиране дойде, докато човек чете обяснението
}

// ---------- лист (dialog) ----------
function open(kind, html) {
  if (!dlg) {
    dlg = document.createElement('dialog'); dlg.className = 'pw-sheet';
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); }); // докосване извън листа
    document.body.append(dlg);
  }
  dlg.dataset.kind = kind;
  dlg.innerHTML = `<div class="pw-body">${html}</div><button class="pw-x" data-pw="close" aria-label="Затвори">${ic('x')}</button>`;
  dlg.setAttribute('aria-label', dlg.querySelector('h3')?.textContent || '');
  if (!dlg.open) dlg.showModal();
  dlg.querySelector('.pw-body').scrollTop = 0;
}

// ---------- инсталиране ----------
async function install() {
  if (installed()) { C.toast('Вече е инсталирано.'); return; }
  const h = `<h3>Инсталирай ${esc(C.name)}</h3>`;
  if (bip) {
    if (dlg?.open && dlg.dataset.kind === 'install') {
      // обяснението беше отворено – бутонът става истински (prompt() иска ново докосване)
      open('install', `${h}<p class="pw-lead">Готово е за инсталиране.</p><button class="btn pw-wide" data-pw="install">${ic('install')}Инсталирай сега</button>`);
      dlg.dataset.kind = 'ready'; return;
    }
    dlg?.close();
    const e = bip; bip = window.__bip = null;
    try { await e.prompt(); const r = await e.userChoice; if (r.outcome === 'accepted') justInstalled = true; } catch (err) {}
    refresh(); return;
  }
  const url = esc(C.url);
  const copyRow = `<div class="pw-url"><input readonly value="${url}" aria-label="Адрес"><button class="btn ghost" data-pw="copy">${ic('copy')}Копирай</button></div>`;
  let body;
  if (inApp && android) {
    const intent = C.url.replace(/^https:\/\//, 'intent://') + '#Intent;scheme=https;package=com.android.chrome;end';
    body = `<p class="pw-lead">Линкът е отворен вътре в друго приложение (Viber, Facebook…). Оттук не може да се инсталира – отворете го в Chrome:</p>
      <a class="btn pw-wide" href="${esc(intent)}">Отвори в Chrome</a>
      <p class="pw-small">Ако не стане: натиснете ⋮ горе вдясно → „Отвори в браузър“. После пак „Инсталирай“.</p>${copyRow}`;
  } else if (inApp && ios) {
    body = `<p class="pw-lead">Линкът е отворен вътре в друго приложение (Viber, Facebook…). На iPhone се инсталира от Safari:</p>
      <ol class="pw-ol"><li>Натиснете ⋯ или иконата на компас → „Отвори в Safari“.</li><li>В Safari пак натиснете „Инсталирай“.</li></ol>
      <p class="pw-small">Или копирайте адреса и го поставете в Safari:</p>${copyRow}`;
  } else if (ios) {
    body = `<p class="pw-lead">На iPhone и iPad става с три докосвания:</p>${iosSteps()}`;
  } else if (android) {
    body = `<ol class="pw-ol"><li>Натиснете менюто ⋮ горе вдясно.</li><li>Изберете „Инсталиране на приложението“ или „Добавяне към началния екран“.</li><li>Потвърдете с „Инсталиране“.</li></ol>
      <p class="pw-small">Ако вече е инсталирано, ще го намерите при другите приложения.</p>`;
  } else if (macSafari) {
    body = `<ol class="pw-ol"><li>В менюто най-горе изберете „Файл“ (File).</li><li>„Добавяне към Dock“ (Add to Dock).</li></ol>`;
  } else if (firefox) {
    body = `<p class="pw-lead">Firefox не инсталира сайтове като приложения. Отворете адреса в Chrome или Edge и натиснете „Инсталирай“.</p>${copyRow}`;
  } else {
    body = `<ol class="pw-ol"><li>В адресната лента, вдясно, натиснете иконката за инсталиране (монитор със стрелка).</li><li>Или отворете менюто на браузъра (⋮ или ⋯) и изберете „Инсталиране…“ (в Edge: „Приложения“ → „Инсталиране на този сайт като приложение“).</li></ol>
      <p class="pw-small">Ако вече е инсталирано, ще го намерите в менюто „Старт“ или на работния плот.</p>`;
  }
  open('install', h + body);
}
function iosSteps() {
  const where = iosOther ? 'иконата ⬆ до адреса' : 'долу; в новия Safari е под „⋯“';
  return `<div class="pw-steps">
    <figure><div class="pw-mock pw-bar" aria-hidden="true">${ic('chevL')}${ic('chevR')}<span class="pw-hi">${ic('ios')}</span>${ic('book')}${ic('tabs')}</div>
      <figcaption><b>1</b><span>Натиснете „Сподели“ <small>(${where})</small></span></figcaption></figure>
    <figure><div class="pw-mock pw-menu" aria-hidden="true"><div>Копиране ${ic('copy')}</div><div class="pw-hi">Добави към началния екран ${ic('plus')}</div></div>
      <figcaption><b>2</b><span>„Добави към началния екран“ <small>(Add to Home Screen)</small></span></figcaption></figure>
    <figure><div class="pw-mock pw-top" aria-hidden="true"><span>Отказ</span><img src="icons/icon-192.png" alt="" width="34" height="34"><span class="pw-hi">Добави</span></div>
      <figcaption><b>3</b><span>Натиснете „Добави“ <small>(Add)</small></span></figcaption></figure>
  </div>`;
}

// ---------- споделяне ----------
async function share() {
  // на телефона – менюто на телефона (Viber, WhatsApp… вече са там); на компютър – лист с QR кода
  if (navigator.share && matchMedia('(pointer: coarse)').matches && await nativeShare()) return;
  const msg = encodeURIComponent(`${C.text}\n${C.url}`), u = encodeURIComponent(C.url);
  const a = (href, c, t, tab = true) => `<a class="pw-act" href="${href}"${tab ? ' target="_blank" rel="noopener"' : ''}><i style="--c:${c}"></i>${t}</a>`;
  open('share', `<h3>Сподели ${esc(C.name)}</h3>
    <p class="pw-lead">Изпратете линка на приятели или в група – ще се покаже със снимка и кратко описание.</p>
    <div class="pw-grid">
      ${a(`viber://forward?text=${msg}`, '#7360f2', 'Viber', false)}
      ${a(`https://wa.me/?text=${msg}`, '#25d366', 'WhatsApp')}
      ${a(`https://www.facebook.com/sharer/sharer.php?u=${u}`, '#1877f2', 'Facebook')}
      ${a(`https://t.me/share/url?url=${u}&text=${encodeURIComponent(C.text)}`, '#26a5e4', 'Telegram')}
      ${navigator.share ? `<button class="pw-act" data-pw="more">${ic('more')}Още…</button>` : ''}
    </div>
    <div class="pw-url"><input readonly value="${esc(C.url)}" aria-label="Адрес"><button class="btn ghost" data-pw="copy">${ic('copy')}Копирай</button></div>
    <div class="pw-qr"><img src="share/qr.svg" alt="QR код към ${esc(C.url)}" width="168" height="168">
      <div><b>QR код</b><small>Насочете камерата на телефона към кода – отваря ${esc(C.name)}.</small>
      <a class="btn ghost" href="share/plakat-a4.pdf" target="_blank" rel="noopener">${ic('print')}Плакат A4 за печат</a></div></div>`);
}
async function nativeShare() {
  try { await navigator.share({ title: C.title, text: C.text, url: C.url }); return true; }
  catch (e) { return e.name === 'AbortError'; } // отказ от човека – не отваряме и нашия лист
}
// листът е над всичко (и над съобщенията долу), затова „Копирано“ се показва на самия бутон
async function copy(b) {
  let ok = true;
  try { await navigator.clipboard.writeText(C.url); }
  catch (e) { ok = false; const i = b.parentElement.querySelector('input'); if (i) { i.focus(); i.select(); } }
  const old = b.innerHTML;
  b.innerHTML = ok ? `${ic('check')}Копирано` : 'Маркиран е – копирайте го';
  setTimeout(() => { if (b.isConnected) b.innerHTML = old; }, 2200);
}

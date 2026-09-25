// Муаллим – рутер и екрани: начало, курс, модул, урок, настройки
import { store, isDone, markDone, scoreOf } from './store.js';
import { Player, RECITERS } from './audio.js';
import { renderLesson, bindLesson, unbindLesson } from './lessons.js';

export const $ = (s, r = document) => r.querySelector(s);
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const player = new Player();
player.rate = store.get('rate');

const ICONS = {
  home: '<path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
  course: '<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/><path d="M9 7h6M9 11h6"/>',
  pray: '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6l-4 3v5M12 13l4 3v5M8 21h8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  'chev-l': '<path d="M15 6l-6 6 6 6"/>', 'chev-r': '<path d="M9 6l6 6-6 6"/>',
  play: '<path d="M7 5v14l11-7z"/>', pause: '<path d="M8 5v14M16 5v14"/>', mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  check: '<path d="M5 12l5 5L20 7"/>', abc: '<path d="M4 17l3-10 3 10M5.5 13h3M13 7v10M13 12h3a2.5 2.5 0 0 1 0 5h-3M13 7h2.5a2.5 2.5 0 0 1 0 5"/>',
  vowel: '<path d="M6 16l3-8 3 8M7 13h4"/><circle cx="17" cy="13" r="3"/><path d="M17 6v1"/>', wave: '<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>',
  book: '<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/>',
  hands: '<path d="M7 11V6a1.5 1.5 0 0 1 3 0v5M10 10V5a1.5 1.5 0 0 1 3 0v6M13 11V7a1.5 1.5 0 0 1 3 0v6l2-2a1.4 1.4 0 0 1 2 2l-4 5a5 5 0 0 1-4 2H9a5 5 0 0 1-5-5v-3a1.5 1.5 0 0 1 3 0"/>',
  minaret: '<path d="M12 2l2 3h-4zM10 5h4v14h-4zM7 19h10v3H7z"/>', drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
};
export const icon = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

// ---------- данни ----------
export const DATA = {};
async function loadData() {
  const files = ['course', 'letters', 'surahs', 'translit', 'dualar', 'ezan', 'abdest', 'namaz'];
  const res = await Promise.all(files.map(f => fetch(`data/${f}.json`).then(r => { if (!r.ok) throw new Error(f); return r.json(); })));
  files.forEach((f, i) => DATA[f] = res[i]);
}
const modules = () => DATA.course.modules;
const moduleById = id => modules().find(m => m.id === id);
export const lessonHref = (m, l) => `#/l/${m}/${l}`;
export function nextLesson(mId, lId) {
  const ms = modules(); const mi = ms.findIndex(m => m.id === mId); const m = ms[mi];
  const li = m.lessons.findIndex(l => l.id === lId);
  if (li < m.lessons.length - 1) return { m: m.id, l: m.lessons[li + 1].id, title: m.lessons[li + 1].title };
  const nm = ms[mi + 1]; return nm ? { m: nm.id, l: nm.lessons[0].id, title: nm.lessons[0].title, module: nm.title } : null;
}
const modProgress = m => { const d = m.lessons.filter(l => isDone(m.id, l.id)).length; return { d, t: m.lessons.length, pct: Math.round(d / m.lessons.length * 100) }; };

// ---------- навигация ----------
const NAV = [['#/', 'Начало', 'home'], ['#/kurs', 'Уроци', 'course'], ['#/m/namaz', 'Намаз', 'pray'], ['#/settings', 'Настройки', 'settings']];
function renderNav(hash) {
  const on = h => (h === '#/' ? hash === '#/' || hash === '' || hash === '#' : hash.startsWith(h)) ? 'on' : '';
  const html = NAV.map(([h, t, i]) => `<a href="${h}" class="${on(h)}" ${on(h) ? 'aria-current="page"' : ''}>${icon(i)}<span>${t}</span></a>`).join('');
  $('#railNav').innerHTML = html; $('#tabbar').innerHTML = html;
}
const view = $('#view');
let toastT;
export function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600); }
export const go = h => { location.hash = h; };

// ---------- екрани ----------
const back = to => `<button class="ib" onclick="history.length>1?history.back():location.hash='${to}'" aria-label="Назад">${icon('chev-l')}</button>`;

function home() {
  const ms = modules();
  const done = Object.keys(store.get('done')).length, total = ms.reduce((a, m) => a + m.lessons.length, 0);
  const last = store.get('last');
  const lastM = last && moduleById(last.m), lastL = lastM && lastM.lessons.find(l => l.id === last.l);
  const nxt = last ? nextLesson(last.m, last.l) : null;
  const cont = lastL && !isDone(last.m, last.l) ? { m: last.m, l: last.l, title: lastL.title, module: lastM.title } : nxt || { m: ms[0].id, l: ms[0].lessons[0].id, title: ms[0].lessons[0].title, module: ms[0].title };
  view.innerHTML = `<div class="hero fade-in">
    <h1 class="hero-title">Муаллим<span>مُعَلِّم</span></h1>
    <p>От първата буква до правилно четене на Корана и до намаза – стъпка по стъпка, с аудио, упражнения и изпити. Всичко е на български.</p>
  </div>
  <div class="stats">
    <div class="card stat"><b>${done}</b><small>от ${total} урока</small></div>
    <div class="card stat"><b>${Math.round(done / total * 100)}%</b><small>завършено</small></div>
    <div class="card stat"><b>${store.get('streak').days}</b><small>дни подред</small></div>
  </div>
  <a class="card continue" href="${lessonHref(cont.m, cont.l)}"><span class="ic-wrap">${icon('play')}</span><div><small>${last ? 'Продължете' : 'Започнете оттук'} · ${esc(cont.module || (moduleById(cont.m) || {}).title)}</small><b>${esc(cont.title)}</b></div>${icon('chev-r')}</a>
  <div class="sub">Учебна програма</div>
  <div class="modules">${ms.map(modCard).join('')}</div>
  <div class="card note"><b>Как да учите:</b> всеки ден по 10–15 минути. Слушайте, повтаряйте на глас, записвайте се и се сравнявайте с рецитатора. Уроците са по ханефи мезхеб, както се практикува в България.</div>`;
}
function modCard(m) {
  const p = modProgress(m);
  return `<a class="card mod" href="#/m/${m.id}"><span class="ic-wrap">${icon(m.icon)}</span><div class="mid"><b>${esc(m.title)}</b><small>${esc(m.sub)}</small><div class="bar"><i style="width:${p.pct}%"></i></div></div><span class="pct">${p.d}/${p.t}</span></a>`;
}
function course() {
  view.innerHTML = `<div class="topbar"><h1>Уроци</h1></div><div class="modules fade-in">${modules().map(modCard).join('')}</div>`;
}
function moduleScreen(id) {
  const m = moduleById(id); if (!m) return notFound();
  const p = modProgress(m);
  view.innerHTML = `<div class="topbar">${back('#/kurs')}<h1>${esc(m.title)}<small>${p.d}/${p.t}</small></h1></div>
  <p class="muted" style="margin:6px 0 16px">${esc(m.sub)}</p>
  <div class="lessons fade-in">${m.lessons.map((l, i) => {
    const d = isDone(m.id, l.id), sc = scoreOf(m.id, l.id);
    return `<a class="lrow ${d ? 'done' : ''}" href="${lessonHref(m.id, l.id)}"><span class="n">${d ? icon('check') : i + 1}</span><div class="mid"><b>${esc(l.title)}</b><small>${l.type === 'quiz' ? (sc ? `Резултат: ${sc.ok}/${sc.total}` : 'Изпит') : d ? 'Завършен' : 'Урок'}</small></div>${icon('chev-r')}</a>`;
  }).join('')}</div>`;
}
function lessonScreen(mId, lId) {
  const m = moduleById(mId); const l = m && m.lessons.find(x => x.id === lId);
  if (!l) return notFound();
  store.set('last', { m: mId, l: lId });
  const nxt = nextLesson(mId, lId);
  const done = isDone(mId, lId);
  view.innerHTML = `<div class="topbar">${back('#/m/' + mId)}<h1>${esc(l.title)}<small>${esc(m.title)}</small></h1></div>
  <div class="lesson fade-in" id="lesson">${renderLesson(l, m)}</div>
  ${l.type === 'quiz' ? '' : `<div class="lesson-foot">
    <button class="btn ${done ? 'done' : ''}" id="doneBtn">${icon('check')} ${done ? 'Завършен' : 'Научих го'}</button>
    ${nxt ? `<a class="btn ghost" href="${lessonHref(nxt.m, nxt.l)}">Следващ ${icon('chev-r')}</a>` : ''}
  </div>`}`;
  bindLesson(l, m, view);
  const db = $('#doneBtn');
  if (db) db.onclick = () => { markDone(mId, lId); db.classList.add('done'); db.innerHTML = `${icon('check')} Завършен`; toast('Браво! Урокът е отбелязан.'); };
}
function settings() {
  const s = store;
  const sw = (k, on) => `<button class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${on}" data-sw="${k}"></button>`;
  view.innerHTML = `<div class="topbar"><h1>Настройки</h1></div>
  <div class="card set-group fade-in">
    <div class="set-row"><div class="mid"><b>Тема</b></div><div class="seg" id="themeSeg">${['auto', 'light', 'sepia', 'dark'].map(t => `<button data-t="${t}" class="${s.get('theme') === t ? 'on' : ''}">${{ auto: 'Авто', light: 'Светла', sepia: 'Сепия', dark: 'Тъмна' }[t]}</button>`).join('')}</div></div>
    <div class="set-row"><div class="mid"><b>Размер на арабския текст</b><small>${s.get('arSize')} px</small></div><input type="range" class="range" min="28" max="64" value="${s.get('arSize')}" id="arSize"></div>
    <div class="set-row"><div class="mid"><b>Рецитатор</b><small>за сурите в уроците</small></div><select id="reciter">${RECITERS.map(r => `<option value="${r.id}" ${s.get('reciter') === r.id ? 'selected' : ''}>${r.name} – ${r.note}</option>`).join('')}</select></div>
    <div class="set-row"><div class="mid"><b>Скорост</b><small>${s.get('rate')}×</small></div><div class="seg" id="rateSeg">${[0.75, 1, 1.25].map(r => `<button data-r="${r}" class="${s.get('rate') === r ? 'on' : ''}">${r}×</button>`).join('')}</div></div>
    <div class="set-row"><div class="mid"><b>Четене с български букви</b><small>под арабския текст</small></div>${sw('showTr', s.get('showTr'))}</div>
    <div class="set-row"><div class="mid"><b>Превод на български</b></div>${sw('showBg', s.get('showBg'))}</div>
  </div>
  <div class="card set-group"><div class="set-row"><div class="mid"><b>Изтрий напредъка</b><small>всички уроци стават незавършени</small></div><button class="btn ghost" id="resetBtn">Изтрий</button></div></div>
  <div class="card about">Муаллим е безплатен и без реклами. Уроците са по ханефи мезхеб. Аудиото на сурите е от <a href="https://everyayah.com" target="_blank" rel="noopener">EveryAyah.com</a>; арабският текст е от мусхафа на Медина (Hafs), преводът – Цветан Теофанов. Всичко, което записвате с микрофона, остава само на вашия телефон.<br><br>Свързано приложение: <a href="https://me7ko-dev.github.io/quran-kerim/" target="_blank" rel="noopener">Куран-и Керим</a> – целият Коран с превод и времена за намаз.</div>`;
  $('#themeSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; s.set('theme', b.dataset.t); applyTheme(); settings(); };
  $('#rateSeg').onclick = e => { const b = e.target.closest('button'); if (!b) return; s.set('rate', +b.dataset.r); player.setRate(+b.dataset.r); settings(); };
  $('#arSize').oninput = e => { s.set('arSize', +e.target.value); applyAr(); e.target.previousElementSibling.querySelector('small').textContent = e.target.value + ' px'; };
  $('#reciter').onchange = e => s.set('reciter', e.target.value);
  view.querySelectorAll('[data-sw]').forEach(b => b.onclick = () => { s.set(b.dataset.sw, !s.get(b.dataset.sw)); settings(); });
  $('#resetBtn').onclick = () => { if (confirm('Да изтрия ли целия напредък?')) { s.set('done', {}); s.set('scores', {}); s.set('last', null); toast('Напредъкът е изтрит.'); } };
}
function notFound() { view.innerHTML = `<div class="empty"><p>Няма такава страница.</p><a class="btn" href="#/">Към началото</a></div>`; }

function applyTheme() { const t = store.get('theme'); if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; }
function applyAr() { document.documentElement.style.setProperty('--ar', store.get('arSize') + 'px'); }

// ---------- рутер ----------
function route() {
  const h = location.hash || '#/';
  unbindLesson(); player.stop();
  renderNav(h);
  const p = h.replace(/^#\/?/, '').split('/');
  if (!p[0]) home();
  else if (p[0] === 'kurs') course();
  else if (p[0] === 'm') moduleScreen(p[1]);
  else if (p[0] === 'l') lessonScreen(p[1], p[2]);
  else if (p[0] === 'settings') settings();
  else notFound();
  window.scrollTo(0, 0);
  view.focus({ preventScroll: true });
}

applyTheme(); applyAr();
view.innerHTML = '<div class="loader"></div>';
loadData().then(() => { route(); addEventListener('hashchange', route); })
  .catch(err => { view.innerHTML = `<div class="empty"><p>Данните не се заредиха (${esc(err.message)}). Проверете връзката и опитайте пак.</p><a class="btn" href="./">Опитай отново</a></div>`; });

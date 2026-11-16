// Муаллим – рутер и екрани: начало, курс, модул, урок, настройки
import { store, isDone, markDone, scoreOf, streakNow } from './store.js';
import { Player, RECITERS } from './audio.js';
import { renderLesson, bindLesson, unbindLesson } from './lessons.js';
import { setupPwa, installCard, settingsRows, shareButton } from './pwa.js';

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
  play: '<path d="M7 5v14l11-7z"/>', pause: '<path d="M8 5v14M16 5v14"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  check: '<path d="M5 12l5 5L20 7"/>', abc: '<path d="M4 17l3-10 3 10M5.5 13h3M13 7v10M13 12h3a2.5 2.5 0 0 1 0 5h-3M13 7h2.5a2.5 2.5 0 0 1 0 5"/>',
  vowel: '<path d="M6 16l3-8 3 8M7 13h4"/><circle cx="17" cy="13" r="3"/><path d="M17 6v1"/>', wave: '<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>',
  book: '<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 0 2 2h13"/>',
  hands: '<path d="M7 11V6a1.5 1.5 0 0 1 3 0v5M10 10V5a1.5 1.5 0 0 1 3 0v6M13 11V7a1.5 1.5 0 0 1 3 0v6l2-2a1.4 1.4 0 0 1 2 2l-4 5a5 5 0 0 1-4 2H9a5 5 0 0 1-5-5v-3a1.5 1.5 0 0 1 3 0"/>',
  minaret: '<path d="M12 2l2 3h-4zM10 5h4v14h-4zM7 19h10v3H7z"/>', drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
  quiz: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.2v.1"/>',
  repeat: '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/>',
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
  if (li < m.lessons.length - 1) return { m: m.id, l: m.lessons[li + 1].id, title: m.lessons[li + 1].title, module: m.title };
  const nm = ms[mi + 1]; return nm ? { m: nm.id, l: nm.lessons[0].id, title: nm.lessons[0].title, module: nm.title, newModule: true } : null;
}
export const modProgress = m => { const d = m.lessons.filter(l => isDone(m.id, l.id)).length; return { d, t: m.lessons.length, pct: Math.round(d / m.lessons.length * 100) }; };
// следващият незавършен урок в модула (или първият, ако всички са завършени)
const firstOpen = m => m.lessons.find(l => !isDone(m.id, l.id));
// Арабски знак за урока – само от данните: буквите на урока, името на сурата или името на модула от програмата
function lessonGlyph(m, l) {
  if (l.letters) return (DATA.letters.letters.find(x => x.id === l.letters[0]) || {}).ar || '';
  if (l.type === 'surah' && DATA.surahs[l.s]) return DATA.surahs[l.s].ar;
  if (l.mark) return 'ب' + l.mark;
  return '';
}

// ---------- навигация ----------
const NAV = [['#/', 'Начало', 'home'], ['#/kurs', 'Уроци', 'course'], ['#/m/namaz', 'Намаз', 'pray'], ['#/settings', 'Настройки', 'settings']];
function renderNav(hash) {
  const on = h => (h === '#/' ? hash === '#/' || hash === '' || hash === '#' : hash.startsWith(h)) ? 'on' : '';
  // „Уроци“ свети и в модулите/уроците, освен в „Намаз“
  const onKurs = h => h === '#/kurs' && /^#\/(m|l)\//.test(hash) && !/^#\/(m|l)\/namaz/.test(hash) ? 'on' : '';
  const onNamaz = h => h === '#/m/namaz' && hash.startsWith('#/l/namaz') ? 'on' : '';
  const cls = h => on(h) || onKurs(h) || onNamaz(h);
  const html = NAV.map(([h, t, i]) => `<a href="${h}" class="${cls(h)}" ${cls(h) ? 'aria-current="page"' : ''}>${icon(i)}<span>${t}</span></a>`).join('');
  $('#railNav').innerHTML = html; $('#tabbar').innerHTML = html;
  // на компютър: напредъкът под менюто
  const rf = $('#railFoot');
  if (rf && DATA.course) {
    const ms = modules(), total = ms.reduce((a, m) => a + m.lessons.length, 0), done = ms.reduce((a, m) => a + modProgress(m).d, 0);
    rf.innerHTML = `<b>Вашият напредък</b>${done} от ${total} урока завършени<div class="bar" style="margin-top:10px" aria-hidden="true"><i style="width:${Math.round(done / total * 100)}%"></i></div>`;
  }
}
const view = $('#view');
let toastT;
export function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2800); }
export const go = h => { location.hash = h; };

// ---------- общи части ----------
// „Назад“ е линк към по-горния екран (а не history.back) – така никога не излиза от приложението
const back = to => `<a class="ib" href="${to}" aria-label="Назад">${icon('chev-l')}</a>`;
const topbar = ({ to, kicker = '', title, count = '', meter = null }) => `<header class="topbar">${to ? back(to) : ''}<div class="ttl">${kicker ? `<span class="kicker">${kicker}</span>` : ''}<h1>${title}</h1></div>${count ? `<span class="count">${count}</span>` : ''}${meter != null ? `<div class="meter" aria-hidden="true"><i style="width:${meter}%"></i></div>` : ''}</header>`;
export const ring = (pct, size = 58, label = `${pct}%`, cls = '') => { const r = size / 2 - 5, c = 2 * Math.PI * r; return `<div class="ring ${cls}" style="width:${size}px;height:${size}px" role="img" aria-label="${pct}%"><svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"><circle class="track" cx="${size / 2}" cy="${size / 2}" r="${r}"/><circle class="val" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - pct / 100)).toFixed(2)}"/></svg><b>${label}</b></div>`; };
const lessonsWord = n => n === 1 ? 'урок' : 'урока';

// ---------- екрани ----------
function home() {
  const ms = modules();
  const total = ms.reduce((a, m) => a + m.lessons.length, 0);
  const done = ms.reduce((a, m) => a + modProgress(m).d, 0);
  const pct = Math.round(done / total * 100);
  const last = store.get('last');
  const lastM = last && moduleById(last.m), lastL = lastM && lastM.lessons.find(l => l.id === last.l);
  // накъде да продължи: последният отворен урок, ако не е завършен; иначе следващият незавършен
  let cont = null;
  if (lastL && !isDone(last.m, last.l)) cont = { m: lastM, l: lastL };
  else {
    const order = lastM ? [...ms.slice(ms.indexOf(lastM)), ...ms.slice(0, ms.indexOf(lastM))] : ms;
    for (const m of order) { const l = firstOpen(m); if (l) { cont = { m, l }; break; } }
  }
  const streak = streakNow();
  let resume;
  if (cont) {
    const p = modProgress(cont.m), idx = cont.m.lessons.indexOf(cont.l) + 1, g = lessonGlyph(cont.m, cont.l);
    resume = `<a class="resume" href="${lessonHref(cont.m.id, cont.l.id)}">
      <span class="resume-glyph${g.length > 3 ? ' long' : ''}" ${g ? 'lang="ar"' : 'aria-hidden="true"'}>${g ? esc(g) : icon(cont.m.icon)}</span>
      <span class="resume-mid"><span class="resume-k">${done ? 'Продължете оттук' : 'Започнете оттук'}</span><b>${esc(cont.l.title)}</b><span class="resume-m">${esc(cont.m.title)} – урок ${idx} от ${p.t}</span><span class="bar" aria-hidden="true"><i style="width:${p.pct}%"></i></span></span>
      <span class="resume-go" aria-hidden="true">${icon('play')}</span></a>`;
  } else {
    resume = `<div class="resume"><span class="resume-glyph" aria-hidden="true">${icon('check')}</span><span class="resume-mid"><span class="resume-k">Машаллах!</span><b>Всички уроци са завършени</b><span class="resume-m">Повтаряйте сурите и дуите, за да не се забравят.</span></span></div>`;
  }
  const card = installCard();
  view.innerHTML = `<section class="hero">
    <h1 class="hero-title">Муаллим <span class="ar" lang="ar">مُعَلِّم</span></h1>
    <p class="hero-lead">От първата буква до правилно четене на Корана и до намаза – стъпка по стъпка, с аудио, упражнения и изпити. Всичко е на български.</p>
  </section>
  ${resume}
  <div class="card progress">
    ${ring(pct)}
    <div class="mid"><b>${done} от ${total} урока</b><small>${done ? 'завършени' : 'още нищо – започнете с първия урок'}</small></div>
    <div class="streak" title="Дни подред с поне един завършен урок">${icon('flame')}<div><b>${streak}</b><small>${streak === 1 ? 'ден подред' : 'дни подред'}</small></div></div>
  </div>
  ${card}
  <div class="sec-h"><h2>Учебна програма</h2><small>${ms.length} модула</small></div>
  <ol class="modules">${ms.map((m, i) => `<li>${modCard(m, i)}</li>`).join('')}</ol>
  <div class="card note"><b>Как да учите:</b> всеки ден по 10–15 минути. Слушайте, повтаряйте на глас, записвайте се и се сравнявайте с рецитатора. Уроците са по ханефи мезхеб, както се практикува в България.</div>
  ${card ? '' : shareButton('Сподели Муаллим с приятел')}`;
}
function modCard(m, i) {
  const p = modProgress(m), full = p.d === p.t;
  return `<a class="card mod ${full ? 'full' : ''}" href="#/m/${m.id}"><span class="star ${full ? 'gold' : ''}">${icon(full ? 'check' : m.icon)}</span><span class="mid"><span class="t"><b>${esc(m.title)}</b></span><small>${esc(m.sub)}</small><span class="bar" aria-hidden="true"><i style="width:${p.pct}%"></i></span></span><span class="pct" aria-label="${p.d} от ${p.t} урока">${p.d}/${p.t}</span></a>`;
}
function course() {
  const ms = modules();
  const total = ms.reduce((a, m) => a + m.lessons.length, 0), done = ms.reduce((a, m) => a + modProgress(m).d, 0);
  view.innerHTML = `${topbar({ title: 'Уроци', count: `${done}/${total}` })}<p class="lead">Модулите са подредени от най-простото към намаза. Можете да започнете от всеки.</p><ol class="modules view-in">${ms.map((m, i) => `<li>${modCard(m, i)}</li>`).join('')}</ol>`;
}
function moduleScreen(id) {
  const m = moduleById(id); if (!m) return notFound();
  const p = modProgress(m), open = firstOpen(m);
  view.innerHTML = `${topbar({ to: '#/kurs', title: esc(m.title), count: `${p.d}/${p.t}` })}
  <div class="mod-head view-in"><span class="star ${p.d === p.t ? 'gold' : ''}">${icon(p.d === p.t ? 'check' : m.icon)}</span><div class="mid"><p>${esc(m.sub)}</p><div class="bar" aria-hidden="true"><i style="width:${p.pct}%"></i></div><small>${p.d === p.t ? 'Модулът е завършен' : `${p.d} от ${p.t} ${lessonsWord(p.t)} завършени`}</small></div></div>
  <ol class="path">${m.lessons.map((l, i) => {
    const d = isDone(m.id, l.id), sc = scoreOf(m.id, l.id), cur = l === open;
    const status = cur ? (p.d ? 'Следващ урок' : 'Започнете оттук') : l.type === 'quiz' ? (sc ? `Изпит – резултат ${sc.ok} от ${sc.total}` : 'Изпит') : d ? 'Завършен' : (l.type === 'build' ? 'Упражнение' : 'Урок');
    return `<li class="${d ? 'done' : ''} ${cur ? 'cur' : ''}"><span class="dot" aria-hidden="true">${d ? icon('check') : l.type === 'quiz' ? icon('quiz') : i + 1}</span><a href="${lessonHref(m.id, l.id)}" ${cur ? 'aria-current="step"' : ''}><span class="mid"><b>${esc(l.title)}</b><small>${status}</small></span>${icon('chev-r')}</a></li>`;
  }).join('')}</ol>`;
}
function lessonScreen(mId, lId) {
  const m = moduleById(mId); const l = m && m.lessons.find(x => x.id === lId);
  if (!l) return notFound();
  store.set('last', { m: mId, l: lId });
  const nxt = nextLesson(mId, lId);
  const done = isDone(mId, lId), idx = m.lessons.indexOf(l) + 1, p = modProgress(m);
  view.innerHTML = `${topbar({ to: '#/m/' + mId, kicker: `${esc(m.title)} – урок ${idx} от ${m.lessons.length}`, title: esc(l.title), meter: p.pct })}
  <div class="lesson view-in" id="lesson">${renderLesson(l, m)}</div>
  ${l.type === 'quiz' ? '' : `<div class="lesson-foot">
    <div class="row"><button class="btn ${done ? 'done' : ''}" id="doneBtn" aria-pressed="${done}">${icon('check')} ${done ? 'Завършен' : 'Научих го'}</button></div>
    ${nxt ? nextCard(nxt) : ''}
  </div>`}`;
  bindLesson(l, m, view);
  const db = $('#doneBtn');
  if (db) db.onclick = () => {
    if (isDone(mId, lId)) return;
    markDone(mId, lId);
    db.classList.add('done'); db.setAttribute('aria-pressed', 'true'); db.innerHTML = `${icon('check')} Завършен`;
    const mp = modProgress(m);
    const meter = view.querySelector('.topbar .meter i'); if (meter) meter.style.width = mp.pct + '%';
    const nc = view.querySelector('.next-card'); if (nc) nc.classList.add('celebrate');
    toast(mp.d === mp.t ? `Модулът „${m.title}“ е завършен. Машаллах!` : 'Браво! Урокът е отбелязан като завършен.');
  };
}
const nextCard = nxt => `<a class="next-card" href="${lessonHref(nxt.m, nxt.l)}"><span class="mid"><small>${nxt.newModule ? `Следващ модул: ${esc(nxt.module)}` : 'Следващ урок'}</small><b>${esc(nxt.title)}</b></span>${icon('chev-r')}</a>`;

function settings() {
  const s = store;
  const sw = (k, on, label) => `<button class="switch ${on ? 'on' : ''}" role="switch" aria-checked="${on}" aria-label="${label}" data-sw="${k}"></button>`;
  const sample = (DATA.surahs[1] && DATA.surahs[1].ayahs[0].ar) || '';
  view.innerHTML = `${topbar({ title: 'Настройки' })}
  <div class="view-in">
  <div class="set-h" id="h-vid">Изглед</div>
  <div class="card set-group" role="group" aria-labelledby="h-vid">
    <div class="set-row"><div class="mid"><b id="lbl-theme">Тема</b><small>„Авто“ следва телефона</small></div><div class="seg" id="themeSeg" role="group" aria-labelledby="lbl-theme">${['auto', 'light', 'sepia', 'dark'].map(t => `<button data-t="${t}" class="${s.get('theme') === t ? 'on' : ''}" aria-pressed="${s.get('theme') === t}">${{ auto: 'Авто', light: 'Светла', sepia: 'Сепия', dark: 'Тъмна' }[t]}</button>`).join('')}</div></div>
    <div class="set-row col"><div class="mid"><label for="arSize">Размер на арабския текст</label><small id="arSizeV">${s.get('arSize')} px</small></div><p class="ar-preview" lang="ar" aria-hidden="true">${sample}</p><input type="range" class="range" min="28" max="64" step="2" value="${s.get('arSize')}" id="arSize" aria-describedby="arSizeV"></div>
  </div>
  <div class="set-h" id="h-txt">Текст в уроците</div>
  <div class="card set-group" role="group" aria-labelledby="h-txt">
    <div class="set-row"><div class="mid"><b>Четене с български букви</b><small>под арабския текст</small></div>${sw('showTr', s.get('showTr'), 'Четене с български букви')}</div>
    <div class="set-row"><div class="mid"><b>Превод на български</b><small>значението на айета или дуата</small></div>${sw('showBg', s.get('showBg'), 'Превод на български')}</div>
  </div>
  <div class="set-h" id="h-aud">Аудио</div>
  <div class="card set-group" role="group" aria-labelledby="h-aud">
    <div class="set-row"><div class="mid"><label for="reciter">Рецитатор</label><small>за сурите в уроците</small></div><select id="reciter">${RECITERS.map(r => `<option value="${r.id}" ${s.get('reciter') === r.id ? 'selected' : ''}>${r.name} – ${r.note}</option>`).join('')}</select></div>
    <div class="set-row"><div class="mid"><b id="lbl-rate">Скорост</b><small>на всички записи</small></div><div class="seg" id="rateSeg" role="group" aria-labelledby="lbl-rate">${[0.75, 1, 1.25].map(r => `<button data-r="${r}" class="${s.get('rate') === r ? 'on' : ''}" aria-pressed="${s.get('rate') === r}">${String(r).replace('.', ',')}×</button>`).join('')}</div></div>
  </div>
  <div class="set-h">Приложение</div>
  <div class="card set-group">${settingsRows()}</div>
  <div class="set-h">Напредък</div>
  <div class="card set-group"><div class="set-row"><div class="mid"><b>Изтрий напредъка</b><small>всички уроци стават незавършени, резултатите от изпитите се изтриват</small></div><button class="btn ghost danger sm" id="resetBtn">Изтрий</button></div></div>
  <div class="set-h">За Муаллим</div>
  <div class="card about">Муаллим е безплатен и без реклами. Уроците са по ханефи мезхеб. Аудиото на сурите е от <a href="https://everyayah.com" target="_blank" rel="noopener">EveryAyah.com</a>; арабският текст е от мусхафа на Медина (Hafs), преводът – Цветан Теофанов. Произношението на буквите е от записа <a href="https://commons.wikimedia.org/wiki/File:%D8%AD%D8%B1%D9%88%D9%81_%D8%A7%D9%84%D8%A3%D8%A8%D8%AC%D8%AF%D9%8A%D8%A9_%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9_Arabic_alphabet.ogg" target="_blank" rel="noopener">„Arabic alphabet“</a> на Ibraheem alex (Уикимедия, лиценз GFDL), езанът – <a href="https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg" target="_blank" rel="noopener">„Beautiful adhan“</a> (Уикимедия, CC0). Всичко, което записвате с микрофона, остава само на вашия телефон.<br><br>Свързано приложение: <a href="https://me7ko-dev.github.io/quran-kerim/" target="_blank" rel="noopener">Куран-и Керим</a> – целият Коран с превод и времена за намаз.</div>
  </div>`;
  const segPick = (seg, f) => seg.onclick = e => { const b = e.target.closest('button'); if (!b) return; seg.querySelectorAll('button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); }); f(b); };
  segPick($('#themeSeg'), b => { s.set('theme', b.dataset.t); applyTheme(); });
  segPick($('#rateSeg'), b => { s.set('rate', +b.dataset.r); player.setRate(+b.dataset.r); });
  $('#arSize').oninput = e => { s.set('arSize', +e.target.value); applyAr(); $('#arSizeV').textContent = e.target.value + ' px'; };
  $('#reciter').onchange = e => s.set('reciter', e.target.value);
  view.querySelectorAll('[data-sw]').forEach(b => b.onclick = () => { const v = !s.get(b.dataset.sw); s.set(b.dataset.sw, v); b.classList.toggle('on', v); b.setAttribute('aria-checked', v); });
  $('#resetBtn').onclick = () => { if (confirm('Да изтрия ли целия напредък? Това не може да се върне.')) { s.set('done', {}); s.set('scores', {}); s.set('last', null); s.set('streak', { days: 0, last: '' }); toast('Напредъкът е изтрит.'); } };
}
function notFound() { view.innerHTML = `<div class="empty view-in"><span class="star" aria-hidden="true">${icon('quiz')}</span><p>Тази страница не съществува. Може линкът да е стар.</p><a class="btn" href="#/">Към началото</a></div>`; }

function applyTheme() {
  const t = store.get('theme'); if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t;
  // цветът на лентата на телефона следва темата
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  document.querySelectorAll('meta[name="theme-color"]').forEach(m => { if (t === 'auto') m.content = m.dataset.c || m.content; else { m.dataset.c = m.dataset.c || m.content; m.content = bg; } });
}
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
  const t = view.querySelector('h1');
  document.title = t && p[0] ? `${t.textContent} – Муаллим` : 'Муаллим – учител по Коран и намаз';
  window.scrollTo(0, 0);
  view.focus({ preventScroll: true });
  onScroll();
}
// лентата горе получава черта, щом съдържанието мине под нея
const onScroll = () => { const tb = view.querySelector('.topbar'); if (tb) tb.classList.toggle('stuck', scrollY > 4); };
addEventListener('scroll', onScroll, { passive: true });
// „Към съдържанието“ – само фокус, без да сменя адреса (адресът е рутерът)
$('.skip').addEventListener('click', e => { e.preventDefault(); view.focus(); });

// Всеки бутон с data-audio пуска локален файл (букви, езан); повторно докосване – пауза, после продължава оттам
document.addEventListener('click', e => {
  const b = e.target.closest('[data-audio]'); if (!b) return;
  const url = b.dataset.audio; const cur = player.current;
  if (cur && cur.url === url && !player.el.error) player.toggle(); else player.playOne({ url, key: url });
});
// иконата на бутона показва дали звучи
const syncAudioBtns = () => document.querySelectorAll('[data-audio]').forEach(b => {
  const on = player.playing && player.current?.url === b.dataset.audio;
  if (b.classList.contains('on') === on) return;
  b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
  const svg = b.querySelector('svg.ic'); if (svg) svg.outerHTML = icon(on ? 'pause' : 'play');
});
['state', 'end', 'fail'].forEach(t => player.addEventListener(t, syncAudioBtns));
player.addEventListener('fail', () => toast(navigator.onLine === false ? 'Няма интернет – аудиото не може да се зареди.' : 'Аудиото не се зареди. Опитайте пак след малко.'));

setupPwa({
  id: 'mu', name: 'Муаллим', url: 'https://me7ko-dev.github.io/muallim/', toast,
  title: 'Муаллим – учител по Коран и намаз',
  text: 'Безплатно приложение за учене на Корана и намаза от нулата: арабската азбука с глас, сурите и дуите, абдест и намаз – на български, стъпка по стъпка. Без реклами.',
});
applyTheme(); applyAr();
view.innerHTML = '<div class="loader" role="status" aria-label="Зарежда се"></div>';
loadData().then(() => { route(); addEventListener('hashchange', route); })
  .catch(err => { view.innerHTML = `<div class="empty"><p>Уроците не се заредиха (${esc(err.message)}). Проверете връзката с интернет и опитайте пак.</p><a class="btn" href="./">Опитай отново</a></div>`; });

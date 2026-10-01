// Генерира изпити от данните и ги показва един въпрос след друг
import { DATA, esc, icon, $ } from './app.js';
import { saveScore } from './store.js';
import { CYR, THICK } from './lessons.js';
import { t, uiAttr } from './i18n.js';

export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (arr, n, not) => shuffle(arr.filter(x => x !== not)).slice(0, n);
const mk = (q, correct, wrong, explain = '', fmt = x => x) => { const opts = shuffle([correct, ...wrong]); return { q, opts: opts.map(fmt), ans: opts.indexOf(correct), explain }; };

const GEN = {
  letters() {
    const L = DATA.letters.letters, qs = [];
    for (const l of shuffle(L).slice(0, 5)) qs.push(mk(`Коя буква се казва <b>„${l.name}“</b>?`, l, pick(L, 3, l), `${l.name} – ${l.sound}`, x => `<span class="ar">${x.ar}</span>`));
    for (const l of shuffle(L).slice(0, 3)) qs.push(mk(`Как се казва тази буква?<span class="ar">${l.ar}</span>`, l, pick(L, 3, l), `Това е ${l.name} – ${l.sound}`, x => x.name));
    for (const l of shuffle(L).slice(0, 3)) qs.push(mk(`Чуйте и познайте буквата:<br><button class="btn ghost" data-audio="audio/letters/${l.id}.mp3" style="margin:10px 0">${icon('play')} Чуй</button>`, l, pick(L, 3, l), `Това беше ${l.name}`, x => `<span class="ar">${x.ar}</span>`));
    for (const l of shuffle(L.filter(x => x.join)).slice(0, 2)) qs.push(mk(`Коя е формата на <b>${l.name}</b> (${l.ar}) в <b>средата</b> на думата?`, l.forms[2], pick(L.filter(x => x.join && x.forms[2] !== l.forms[2]), 3).map(x => x.forms[2]), `${l.name} в средата: ${l.forms[2]}`, x => `<span class="ar">${x}</span>`));
    return shuffle(qs);
  },
  syllables() {
    const L = DATA.letters.letters.filter(l => l.id !== 'alif'), qs = [];
    const V = [['َ', 'fetha'], ['ِ', 'kesra'], ['ُ', 'damma']];
    const read = (l, v) => CYR[l.id] + (v === 'fetha' ? (THICK.has(l.id) ? 'а' : 'е') : v === 'kesra' ? 'и' : 'у');
    for (const l of shuffle(L).slice(0, 7)) {
      const [m, v] = V[Math.floor(Math.random() * 3)];
      const correct = read(l, v);
      const wrong = new Set(V.map(([, vv]) => read(l, vv)).filter(x => x !== correct));
      for (const o of pick(L, 4, l)) { if (wrong.size >= 3) break; const w = read(o, v); if (w !== correct) wrong.add(w); }
      qs.push(mk(`Как се чете?<span class="ar">${l.ar}${m}</span>`, correct, [...wrong].slice(0, 3), `${l.ar}${m} = „${correct}“ (${l.name} + ${{ fetha: 'фетха', kesra: 'кесра', damma: 'дамма' }[v]})`));
    }
    for (const l of shuffle(L).slice(0, 3)) {
      const [m, v] = V[Math.floor(Math.random() * 3)];
      qs.push(mk(`Коя сричка е <b>„${read(l, v)}“</b>?`, `${l.ar}${m}`, V.filter(([, vv]) => vv !== v).map(([mm]) => `${l.ar}${mm}`).concat([`${pick(L, 1, l)[0].ar}${m}`]), '', x => `<span class="ar">${x}</span>`));
    }
    return shuffle(qs);
  },
  ezan() {
    const E = DATA.ezan.lines, qs = [];
    for (let i = 1; i < E.length; i++) qs.push(mk(`Кой ред идва <b>след</b> „${E[i - 1].tr}“?`, E[i].tr, pick(E.map(x => x.tr), 3, E[i].tr).filter(x => x !== E[i - 1].tr).slice(0, 3)));
    qs.push(mk('Колко пъти се казва „Аллааху екбер“ в началото на езана?', '4', ['2', '1', '3']));
    qs.push(mk('Кой ред се казва само в езана за сабах?', E[5].tr, [E[3].tr, E[7].tr, E[1].tr], 'Ес-салаату хайрум минен-невм – „Намазът е по-добър от съня“.'));
    qs.push(mk('Какво отговаряме, когато чуем „Хаййе алес-салаах“?', 'Ляя хавле ве ляя куввете илляя билляях', ['Хаййе алес-салаах', 'Садакте ве берирте', 'Аллааху екбер']));
    qs.push(mk('Кое се добавя в икамета след „Хаййе алел-фелаах“?', 'Кад каметис-салаах (2×)', ['Ес-салаату хайрум минен-невм', 'Ляя иляяхе иллаллаах (2×)', 'Нищо – икаметът е като езана']));
    return shuffle(qs).slice(0, 10);
  },
  abdest() {
    const S = DATA.abdest.steps, qs = [];
    for (let i = 2; i < S.length - 1; i++) qs.push(mk(`Коя стъпка идва <b>след</b> „${S[i - 1].t}“?`, S[i].t, pick(S.map(x => x.t), 3, S[i].t).filter(x => x !== S[i - 1].t).slice(0, 3)));
    const F = DATA.abdest.farz.map(f => f.t), NF = DATA.abdest.sunnet;
    qs.push(mk('Кое от изброените е <b>ФАРЗ</b> на абдеста?', F[2], pick(NF, 3)));
    qs.push(mk('Кое разваля абдеста?', DATA.abdest.breaks[0], pick(DATA.abdest.notbreaks, 3)));
    qs.push(mk('Кое НЕ разваля абдеста?', DATA.abdest.notbreaks[0], pick(DATA.abdest.breaks, 3)));
    qs.push(mk('Колко е най-малкото за месх на главата?', 'Една четвърт от главата', ['Цялата глава', 'Само челото', 'Косата до ушите']));
    return shuffle(qs).slice(0, 10);
  },
  namaz() {
    const P = DATA.namaz.prayers, qs = [];
    for (const p of P) { const f = p.parts.find(x => x.k === 'farz'); qs.push(mk(`Колко рекята е <b>фарзът</b> на ${p.name.toLowerCase()} намаз?`, String(f.r), ['2', '3', '4', '5'].filter(x => x !== String(f.r)).slice(0, 3))); }
    qs.push(mk('Кой намаз има витр?', 'Ятсъ (нощната)', ['Сабах', 'Акшам', 'Икинди']));
    qs.push(mk('Какво се чете в последното сядане веднага след Еттехиййату?', 'Аллахумме салли и Аллахумме барик', ['Субханеке', 'Кунут дуите', 'Фатиха']));
    qs.push(mk('Кое е РУКЮН (фарз вътре в намаза)?', 'Рукю', ['Субханеке', 'Кунут', 'Тесбихат след намаза']));
    qs.push(mk('В 3-тия и 4-тия рекят на ФАРЗА се чете…', 'само Бесмеле и Фатиха', ['Фатиха и сура', 'само сура', 'Субханеке и Фатиха']));
    qs.push(mk('Колко пъти се казва тесбихът в рукю?', 'Най-малко 3', ['1', '2', '7']));
    qs.push(mk('Ако забравите първото сядане в 4-рекятен намаз…', 'правите седжде-и сехв в края', ['намазът е невалиден', 'нищо – продължавате', 'кланяте намаза два пъти']));
    qs.push(mk('При текбира жените вдигат ръцете…', 'до раменете', ['до ушите', 'над главата', 'не ги вдигат']));
    return shuffle(qs).slice(0, 10);
  },
};

export function renderQuiz() { return `<div class="card quiz" id="quiz"></div>`; }
export function bindQuiz(l, m) {
  const qs = GEN[l.kind](); let i = 0, ok = 0;
  const box = $('#quiz');
  const show = () => {
    if (i >= qs.length) {
      saveScore(m.id, l.id, ok, qs.length);
      const pct = Math.round(ok / qs.length * 100);
      box.innerHTML = `<div class="result"${uiAttr()}><div class="muted">${t('Резултат')}</div><b>${ok} / ${qs.length}</b><p>${pct >= 90 ? t('Отлично! Машаллах.') : pct >= 70 ? t('Много добре – урокът е отбелязан като научен.') : t('Прегледайте уроците още веднъж и опитайте пак.')}</p><div class="acts" style="justify-content:center"><button class="btn" id="again">${t('Още веднъж')}</button><a class="btn ghost" href="#/m/${m.id}">${t('Към модула')}</a></div></div>`;
      $('#again').onclick = () => { i = 0; ok = 0; qs.splice(0, qs.length, ...GEN[l.kind]()); show(); };
      return;
    }
    const q = qs[i];
    box.innerHTML = `<div class="prog"${uiAttr()}>${t('Въпрос {i} от {n}', { i: i + 1, n: qs.length })}</div><p class="q">${q.q}</p><div class="opts">${q.opts.map((o, k) => `<button class="opt" data-k="${k}">${o}</button>`).join('')}</div><p class="fb"></p>`;
    // „чуй и познай“ – звукът тръгва сам (докосването на „Следващ“ го позволява)
    const au = box.querySelector('.q [data-audio]'); if (au) setTimeout(() => au.isConnected && au.click(), 300);
    box.querySelectorAll('.opt').forEach(b => b.onclick = () => {
      const k = +b.dataset.k; const right = k === q.ans;
      if (right) ok++;
      box.querySelectorAll('.opt').forEach((x, j) => { x.disabled = true; if (j === q.ans) x.classList.add('ok'); else if (j === k) x.classList.add('bad'); });
      const fb = box.querySelector('.fb'); fb.className = 'fb ' + (right ? 'ok' : 'bad'); fb.innerHTML = `<span${uiAttr()}>${right ? '✓ ' + t('Вярно!') : '✕ ' + t('Не съвсем.')}</span> ` + esc(q.explain || '');
      const nb = document.createElement('button'); nb.className = 'btn'; nb.style.marginTop = '12px'; nb.innerHTML = `${t(i + 1 < qs.length ? 'Следващ' : 'Резултат')} ${icon('chev-r')}`; if (uiAttr()) nb.lang = document.documentElement.lang; nb.onclick = () => { i++; show(); };
      box.appendChild(nb); nb.focus();
    });
  };
  show();
}

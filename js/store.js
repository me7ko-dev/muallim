// Настройки и напредък – само в браузъра на потребителя (localStorage)
const KEY = 'mu:v1';
const DEFAULTS = {
  theme: 'auto',            // auto | light | sepia | dark
  arSize: 40,               // px, арабски текст
  reciter: 'Husary_Muallim_128kbps',
  rate: 1,
  showTr: true,             // четене с български букви
  showBg: true,             // превод
  done: {},                 // { 'module/lesson': timestamp }
  scores: {},               // { 'module/lesson': { ok, total, t } }
  last: null,               // { m, l }
  streak: { days: 0, last: '' },
};

let state = { ...DEFAULTS };
try { state = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) {}

const subs = new Set();
export const store = {
  get: k => state[k],
  set(k, v) {
    state[k] = v;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    subs.forEach(f => f(k, v));
  },
  on: f => subs.add(f),
};

export const lessonKey = (m, l) => `${m}/${l}`;
export const isDone = (m, l) => !!state.done[lessonKey(m, l)];
export function markDone(m, l) {
  store.set('done', { ...state.done, [lessonKey(m, l)]: Date.now() });
  touchStreak();
}
export function saveScore(m, l, ok, total) {
  store.set('scores', { ...state.scores, [lessonKey(m, l)]: { ok, total, t: Date.now() } });
  if (ok / total >= 0.7) markDone(m, l);
}
export const scoreOf = (m, l) => state.scores[lessonKey(m, l)];

// Дни подред с учене
function touchStreak() {
  const today = new Date().toISOString().slice(0, 10);
  const s = state.streak;
  if (s.last === today) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  store.set('streak', { days: s.last === y ? s.days + 1 : 1, last: today });
}

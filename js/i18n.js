// Езикът на интерфейса – един и същ файл в Муаллим и Куран-и Керим (копие в другото репо).
// Текстът в кода е на български и е ключът; преводите са в lang/<код>.js: export default { 'Настройки': 'Settings', … }.
// Липсва превод → остава българският (и се записва в i18nMissing – тестът го проверява).
// Изборът е общ за двете приложения (един домейн): localStorage 'me7ko:lang'. Без избор – български.
// ?lang=en в адреса избира езика – за линковете в групите на други езици.
export const LANGS = [['bg', 'Български'], ['en', 'English']];
const KEY = 'me7ko:lang';
const known = c => LANGS.some(([k]) => k === c);

function pick() {
  const q = new URLSearchParams(location.search).get('lang');
  if (known(q)) {
    try { localStorage.setItem(KEY, q); } catch (e) {}
    history.replaceState(history.state, '', location.pathname + location.hash);
    return q;
  }
  try { const s = localStorage.getItem(KEY); if (known(s)) return s; } catch (e) {}
  return 'bg';
}

export let lang = pick();
let D = null;
if (lang !== 'bg') {
  try { D = (await import(`../lang/${lang}.js`)).default; }
  catch (e) { lang = 'bg'; } // без интернет и без кеш – остава българският
}
document.documentElement.lang = lang;

export const missing = new Set();
window.i18nMissing = missing;

// t('Изтеглени {n} от 114 сури', { n: 5 })
export function t(s, v) {
  let r = s;
  if (D) { if (Object.hasOwn(D, s)) r = D[s]; else missing.add(s); }
  return v ? r.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)) : r;
}
// брой + дума: tn(7, 'айет', 'айета') → „7 айета“ / „7 ayahs“
export const tn = (n, one, many) => `${n} ${t(n === 1 ? one : many)}`;
export const locale = () => ({ bg: 'bg-BG', en: 'en-GB' }[lang] || lang);
export const num = (x, digits = 0) => x.toLocaleString(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
// само при чужд език: съдържанието, което още е на български, се маркира с lang="bg"
export const bgAttr = () => (lang === 'bg' ? '' : ' lang="bg"');
// преведен бутон или надпис вътре в съдържание, маркирано като българско
export const uiAttr = () => (lang === 'bg' ? '' : ` lang="${lang}"`);

export function setLang(c) {
  try { localStorage.setItem(KEY, c); } catch (e) {}
  location.reload();
}

// статичният текст в index.html: елементите с data-i18n и всички aria-label
export function translateStatic(root = document) {
  if (!D) return;
  root.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.textContent.trim()); });
  root.querySelectorAll('[aria-label]').forEach(e => e.setAttribute('aria-label', t(e.getAttribute('aria-label'))));
}

// бутон за смяна на езика (на началния екран): показва другия език
export const langButton = () => {
  const [c, name] = LANGS.find(([k]) => k !== lang);
  return `<button class="lang-btn" data-setlang="${c}" lang="${c}" aria-label="${name}"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z"/></svg>${name}</button>`;
};
// ред „Език · Language“ в Настройки – на двата езика, за да се намира и от човек, който не чете текущия
export const langRow = () => `<div class="set-row"><div class="mid"><b><span lang="bg">Език</span> · Language</b></div><div class="seg">${LANGS.map(([c, n]) => `<button data-setlang="${c}" lang="${c}" class="${c === lang ? 'on' : ''}" aria-pressed="${c === lang}">${n}</button>`).join('')}</div></div>`;
document.addEventListener('click', e => { const b = e.target.closest('[data-setlang]'); if (b && b.dataset.setlang !== lang) setLang(b.dataset.setlang); });

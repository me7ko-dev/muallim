// Service worker: приложението се отваря и без интернет. Кодът – първо от мрежата (за обновления), шрифтовете – от кеша.
const SHELL = 'mu-shell-v5';
const DATA = 'mu-data-v2';
const SHELL_FILES = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/store.js', 'js/audio.js', 'js/lessons.js', 'js/quiz.js', 'js/figure.js', 'js/pwa.js',
  'data/course.json', 'data/letters.json', 'data/surahs.json', 'data/translit.json', 'data/dualar.json', 'data/ezan.json', 'data/abdest.json', 'data/namaz.json',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png'];
const FONTS = ['UthmanicHafs', 'manrope-cyrillic', 'manrope-latin', 'manrope-latin-ext', 'cormorant-cyrillic', 'cormorant-latin', 'cormorant-latin-ext'].map(f => `fonts/${f}.woff2`)
  // звуците на буквите са малки (228 KB общо) – теглят се веднъж, за офлайн
  .concat('alif ba ta tha jim hha kha dal dhal ra zay sin shin sad dad tta zza ayn ghayn fa qaf kaf lam mim nun ha waw ya'.split(' ').map(id => `audio/letters/${id}.mp3`));

self.addEventListener('install', e => {
  e.waitUntil(Promise.all([
    caches.open(SHELL).then(c => c.addAll(SHELL_FILES.map(u => new Request(u, { cache: 'reload' })))),
    caches.open(DATA).then(c => c.addAll(FONTS)),
  ]).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // аудиото минава направо
  // шрифтове и локално аудио – от кеша (езанът се кешира при първото пускане)
  if (url.pathname.endsWith('.woff2') || /\/audio\/.+\.mp3$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok) { const cl = r.clone(); caches.open(DATA).then(c => c.put(req, cl)); } return r; })));
    return;
  }
  e.respondWith((async () => {
    const net = fetch(req).then(r => { if (r.ok) { const cl = r.clone(); caches.open(SHELL).then(c => c.put(req, cl)); } return r; });
    const slow = new Promise(res => setTimeout(res, 5000));
    try {
      const r = await Promise.race([net, slow]);
      if (r) return r;
    } catch (err) {}
    const hit = await caches.match(req, { ignoreSearch: true });
    return hit || net;
  })());
});

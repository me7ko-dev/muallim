// Service worker: приложението се отваря и без интернет. Кодът – първо от мрежата (за обновления), шрифтовете – от кеша.
const SHELL = 'mu-shell-v2';
const DATA = 'mu-data-v1';
const AUDIO = 'mu-audio-v1'; // при нови записи в audio/ – вдигнете версията
const SHELL_FILES = ['./', 'index.html', 'css/style.css', 'js/app.js', 'js/store.js', 'js/audio.js', 'js/lessons.js', 'js/quiz.js', 'js/figure.js',
  'data/course.json', 'data/letters.json', 'data/surahs.json', 'data/translit.json', 'data/dualar.json', 'data/ezan.json', 'data/abdest.json', 'data/namaz.json',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png'];
const FONTS = ['UthmanicHafs', 'manrope-cyrillic', 'manrope-latin', 'manrope-latin-ext', 'cormorant-cyrillic', 'cormorant-latin', 'cormorant-latin-ext'].map(f => `fonts/${f}.woff2`);

self.addEventListener('install', e => {
  e.waitUntil(Promise.all([
    caches.open(SHELL).then(c => c.addAll(SHELL_FILES.map(u => new Request(u, { cache: 'reload' })))),
    caches.open(DATA).then(c => c.addAll(FONTS)),
  ]).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => ![SHELL, DATA, AUDIO].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // аудиото минава направо
  if (url.pathname.includes('/audio/')) { e.respondWith(audio(req)); return; }
  if (url.pathname.endsWith('.woff2')) {
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

// Аудио: пази се цялото в кеша при първото слушане; заявките с Range (Safari/iPhone) се отговарят с парче от него
async function audio(req) {
  const key = new Request(req.url);
  const c = await caches.open(AUDIO);
  let hit = await c.match(key);
  if (!hit) {
    let r;
    try { r = await fetch(key); } catch (err) { return new Response('', { status: 504 }); }
    if (r.status !== 200) return r;
    await c.put(key, r.clone());
    hit = r;
  }
  const range = req.headers.get('range');
  if (!range) return hit;
  const buf = await hit.arrayBuffer(), n = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(range) || [];
  let a = m[1] ? +m[1] : 0, b = m[2] ? Math.min(+m[2], n - 1) : n - 1;
  if (!m[1] && m[2]) { a = Math.max(0, n - +m[2]); b = n - 1; }
  if (a >= n || a > b) return new Response('', { status: 416, headers: { 'Content-Range': `bytes */${n}` } });
  return new Response(buf.slice(a, b + 1), { status: 206, headers: { 'Content-Type': hit.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${a}-${b}/${n}`, 'Content-Length': String(b - a + 1), 'Accept-Ranges': 'bytes' } });
}

// Обхожда всички екрани и уроци в истински браузър (Edge, без прозорец) и съобщава грешките.
// Пуснете първо сървъра: node tools/serve.mjs   после: node tools/smoke.mjs [адрес] [папка-за-снимки]
import { spawn } from 'child_process'; import fs from 'fs';
const base = (process.argv[2] || 'http://localhost:8932/').replace(/#.*$/, '');
const shots = process.argv[3] || '';
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9300 + Math.floor(Math.random() * 500);
const prof = `${process.env.TEMP}/mu-smoke-${port}`;
const pr = spawn(EDGE, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${prof}`, '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let tabs; for (let i = 0; i < 50; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (tabs.find(t => t.type === 'page')) break; } catch {} await sleep(200); }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); let errs = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errs.push('грешка: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errs.push('конзола: ' + m.params.args.map(a => a.value ?? a.description).join(' '));
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) errs.push(`липсва (${m.params.response.status}): ${m.params.response.url}`);
};
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description; };
const shot = async name => { if (!shots) return; fs.mkdirSync(shots, { recursive: true }); const s = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true }); fs.writeFileSync(`${shots}/${name}.png`, Buffer.from(s.result.data, 'base64')); };

await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send('Page.navigate', { url: base });
await sleep(2500);

const course = await ev(`fetch('data/course.json').then(r => r.json())`);
const routes = ['#/', '#/kurs', '#/settings', '#/nyama-takava'];
for (const m of course.modules) { routes.push(`#/m/${m.id}`); for (const l of m.lessons) routes.push(`#/l/${m.id}/${l.id}`); }

let bad = 0;
const report = (r, extra = []) => { const all = [...errs, ...extra]; errs = []; if (all.length) { bad++; console.log(`✕ ${r}\n   ${all.join('\n   ')}`); } };
for (const r of routes) {
  await ev(`location.hash = ${JSON.stringify(r)}`); await sleep(500);
  const extra = [];
  const empty = await ev(`(document.querySelector('#view')?.innerText || '').trim().length < 20`);
  if (empty && r !== '#/nyama-takava') extra.push('празен екран');
  if (r.startsWith('#/l/')) {
    const [, , mId, lId] = r.split('/');
    const lesson = course.modules.find(m => m.id === mId).lessons.find(l => l.id === lId);
    if (lesson.type === 'quiz') {
      // отговаря на всичко с първия вариант до резултата
      const res = await ev(`(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); for (let i = 0; i < 30; i++) { const o = document.querySelector('#quiz .opt:not([disabled])'); if (!o) break; o.click(); await s(20); document.querySelector('#quiz > .btn')?.click(); await s(20); } return document.querySelector('#quiz .result b')?.textContent || 'няма резултат'; })()`);
      if (!/\d+ \/ \d+/.test(res)) extra.push('изпитът не стига до резултат: ' + res);
    }
    // всички бутони „Чуй“ с локален звук трябва да се заредят
    const audio = await ev(`(async () => { const s = ms => new Promise(r => setTimeout(r, ms)); const { player } = await import('./js/app.js'); const out = []; for (const u of [...new Set([...document.querySelectorAll('[data-audio]')].map(b => b.dataset.audio))]) { document.querySelector('[data-audio="' + u + '"]').click(); for (let i = 0; i < 40 && player.el.readyState < 2 && !player.el.error; i++) await s(50); if (player.el.error || player.el.readyState < 2) out.push('звукът не тръгва: ' + u); player.stop(); } return out; })()`);
    if (Array.isArray(audio)) extra.push(...audio); else if (audio) extra.push('проверка на звука: ' + audio);
  }
  report(r, extra);
  if (shots) await shot(r.replace(/[#/]+/g, '_').replace(/^_|_$/g, '') || 'nachalo');
}
console.log(`\n${routes.length} екрана, ${bad ? bad + ' с проблеми' : 'всички без грешки'}`);
ws.close(); pr.kill();
try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
process.exit(bad ? 1 : 0);

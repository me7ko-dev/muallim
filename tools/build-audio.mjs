// Прави папка audio/ от свободните записи (виж audio/CREDITS.md): изрязва тишината, изравнява силата, компресира.
// Нужни са ffmpeg и клонинги на източниците:
//   git clone https://github.com/bubblesinarabic/alphabets-audio  <SRC>/letters
//   git clone https://github.com/ProntoHS/Mysalaah                 <SRC>/mysalaah
//   git clone https://github.com/achaudhry/adhan                   <SRC>/adhan
// Пускане: node tools/build-audio.mjs <SRC>
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2]; if (!SRC) { console.error('node tools/build-audio.mjs <папка с източниците>'); process.exit(1); }
const OUT = new URL('../audio/', import.meta.url).pathname;
const FF = process.env.FFMPEG || 'ffmpeg';
const ff = (...a) => execFileSync(FF, ['-hide_banner', '-nostdin', '-y', ...a], { stdio: ['ignore', 'pipe', 'pipe'] });
const measure = (f, pre = '') => {
  const r = spawnSync(FF, ['-hide_banner', '-nostdin', '-i', f, '-af', (pre ? pre + ',' : '') + 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const mean = +(/mean_volume: (-?[\d.]+)/.exec(r.stderr) || [])[1], max = +(/max_volume: (-?[\d.]+)/.exec(r.stderr) || [])[1];
  return { mean, max };
};
// Звучащата част: от първия до последния момент над (пика − 45 dB), с малко въздух преди и след
function active(f, from, to) {
  const args = ['-v', 'quiet', '-nostdin']; if (from != null) args.push('-ss', String(from)); if (to != null) args.push('-to', String(to));
  const pcm = spawnSync(FF, [...args, '-i', f, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], { maxBuffer: 1 << 28 }).stdout;
  const x = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length >> 1), H = 160, db = [];
  for (let i = 0; i + H <= x.length; i += H) { let e = 0; for (let j = i; j < i + H; j++) e += (x[j] / 32768) ** 2; db.push(10 * Math.log10(e / H + 1e-12)); }
  const pk = Math.max(...db), on = db.map((v, i) => v > pk - 45 ? i : -1).filter(i => i >= 0);
  const base = from || 0, len = x.length / 16000;
  return { from: base + Math.max(0, on[0] * 0.01 - 0.06), to: base + Math.min(len, (on.at(-1) + 1) * 0.01 + 0.15) };
}
// Силата се довежда до средно -20 dB (без пикът да минава -1 dB)
function make(out, inputs, { target = -20, bitrate = '64k', trim = true } = {}) {
  // inputs: [{ f, from, to }] – свързват се един след друг
  const args = [], parts = [];
  inputs.forEach((x, i) => {
    const r = trim ? active(x.f, x.from, x.to) : x;
    if (r.from != null) args.push('-ss', r.from.toFixed(3)); if (r.to != null) args.push('-to', r.to.toFixed(3));
    args.push('-i', x.f);
    parts.push(`[${i}:a]aformat=sample_rates=44100:channel_layouts=mono[p${i}]`);
  });
  const gap = inputs.length > 1 ? `;${inputs.map((_, i) => `[p${i}]`).join('')}concat=n=${inputs.length}:v=0:a=1[c]` : '';
  const pre = parts.join(';') + gap;
  const tmp = join(OUT, '.tmp.wav');
  ff(...args, '-filter_complex', pre, '-map', inputs.length > 1 ? '[c]' : '[p0]', tmp);
  const { mean, max } = measure(tmp);
  const gain = Math.min(target - mean, -1 - max);
  ff('-i', tmp, '-af', `volume=${gain.toFixed(2)}dB,afade=t=in:d=0.01,areverse,afade=t=in:d=0.03,areverse`, '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', bitrate, '-map_metadata', '-1', join(OUT, out));
  rmSync(tmp);
  const d = +spawnSync(FF, ['-i', join(OUT, out)], { encoding: 'utf8' }).stderr.match(/Duration: (\d+):(\d+):([\d.]+)/).slice(1).reduce((a, v) => a * 60 + +v, 0);
  console.log(out.padEnd(28), d.toFixed(2) + 's', `gain ${gain.toFixed(1)} dB`);
  return d;
}

// ---------- букви и срички ----------
const L = join(SRC, 'letters');
const NAME = { alif: 'alif', ba: 'baa', ta: 'taa', tha: 'thaa', jim: 'jeem', hha: 'haa', kha: 'khaa', dal: 'daal', dhal: 'thaal', ra: 'raa', zay: 'zay', sin: 'seen', shin: 'sheen', sad: 'saad', dad: 'daad', tta: 'taa_heavy', zza: 'zaa_heavy', ayn: 'ayn', ghayn: 'ghayn', fa: 'faa', qaf: 'qaaf', kaf: 'kaaf', lam: 'laam', mim: 'meem', nun: 'noon', ha: 'haa_light', waw: 'waw', ya: 'yaa' };
const SYL = { fetha: 'fatha', kesra: 'kasra', damma: 'damma' };
const SPECIAL = { 'tha-damma': 'thou-damma' };                 // така е и в сайта на източника
const WORDS = { alif: 'asad', ba: 'bab', ta: 'teen', tha: 'thawb', shin: 'shams', kaf: 'kitab', ya: 'yad' }; // само точните примери от letters.json
mkdirSync(join(OUT, 'letters'), { recursive: true });
for (const [id, n] of Object.entries(NAME)) {
  make(`letters/${id}.mp3`, [{ f: join(L, n + '.mp3') }]);
  for (const [v, s] of Object.entries(SYL)) make(`letters/${id}-${v}.mp3`, [{ f: join(L, (SPECIAL[`${id}-${v}`] || `${n}-${s}`) + '.mp3') }]);
  if (WORDS[id]) make(`letters/${id}-ex.mp3`, [{ f: join(L, WORDS[id] + '.mp3') }]);
}

// ---------- дуи (моменти на рязане по паузите от .json файловете на източника) ----------
const M = join(SRC, 'mysalaah/assets/audio');
const seg = (k, i) => JSON.parse(readFileSync(join(M, k + '.json'), 'utf8')).segments[i];
const cut = (k, a, b) => ({ f: join(M, k + '.mp3'), from: a == null ? undefined : seg(k, a).start, to: b == null ? undefined : seg(k, b).end + 0.12 });
mkdirSync(join(OUT, 'dua'), { recursive: true });
const DUA = {
  tekbir: [cut('takbir')],
  subhaneke: [cut('istiftah')],
  euzu: [cut('taawwudh_basmala'), cut('fatiha', 0, 0)],          // Еузу + Бесмеле (първият айет на Фатиха)
  ruku: [cut('ruku_tasbih')],
  kavme: [cut('tasmi_tahmid')],
  secde: [cut('sujood_tasbih')],
  ettehiyyatu: [cut('tashahhud')],                                // версията на Ибн Мес'уд (ханефи)
  salli: [cut('salawat', null, 1)],                               // Аллахумме салли – първите 2 реда
  barik: [{ f: join(M, 'salawat.mp3'), from: seg('salawat', 2).start - 0.1 }], // Аллахумме барик – последните 2 реда
  rabbena1: [cut('rabbana_atina')],
  selam: [cut('salam')],
  kunut2: [cut('qunut_2')],
  'tesbihat-subhanallah': [cut('subhanallah')],
  'tesbihat-elhamdulillah': [cut('alhamdulillah')],
  'tesbihat-allahuekber': [cut('allahu_akbar')],
  'tesbihat-tehlil': [cut('dhikr_tahlil')],
};
for (const [id, inputs] of Object.entries(DUA)) make(`dua/${id}.mp3`, inputs);

// ---------- езан (турски маниер) – един файл + моменти на фразите ----------
make('ezan.mp3', [{ f: join(SRC, 'adhan/Adhan-Turkish.mp3') }], { target: -18, bitrate: '96k', trim: false });

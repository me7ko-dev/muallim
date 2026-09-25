// Аудио: айети от EveryAyah.com (същите рецитатори като в Куран-и Керим) + запис от микрофона за самопроверка
export const RECITERS = [
  { id: 'Husary_Muallim_128kbps', name: 'Хусари – Муаллим', note: 'бавно, за учене (препоръчано)' },
  { id: 'Husary_128kbps', name: 'Махмуд Халил ал-Хусари', note: 'муреттел' },
  { id: 'Alafasy_128kbps', name: 'Мишари Рашид ал-Афаси', note: 'муреттел' },
  { id: 'Abdul_Basit_Murattal_192kbps', name: 'Абдулбасит Абдуссамед', note: 'муреттел' },
  { id: 'Minshawy_Murattal_128kbps', name: 'Мухаммед Сиддик ал-Миншави', note: 'муреттел' },
  { id: 'Abdurrahmaan_As-Sudais_192kbps', name: 'Абдуррахман ас-Судейс', note: 'Мека' },
];
const pad = n => String(n).padStart(3, '0');
export const ayahUrl = (r, s, a) => `https://everyayah.com/data/${r}/${pad(s)}${pad(a)}.mp3`;

// Един <audio> елемент (важно за iPhone – само той е „отключен“ от докосването)
export class Player extends EventTarget {
  constructor() {
    super();
    this.el = new Audio();
    this.el.preload = 'auto';
    this.queue = [];      // [{ url, key }]
    this.i = -1;
    this.loops = 1;       // повторения на цялата опашка (0 = без край)
    this.loop = 1;
    this.each = 1;        // повторения на всеки елемент
    this.rep = 1;
    this.rate = 1;
    this.el.addEventListener('ended', () => this.advance());
    this.el.addEventListener('playing', () => this.emit());
    this.el.addEventListener('pause', () => this.emit());
    this.el.addEventListener('error', () => { this.emit('fail'); });
  }
  emit(type = 'state') { this.dispatchEvent(new CustomEvent(type, { detail: this.current })); }
  get current() { return this.queue[this.i] || null; }
  get playing() { return this.i >= 0 && !this.el.paused && !this.el.error; }
  // Пуска списък; each = пъти всеки елемент, loops = пъти целият списък
  playList(items, { each = 1, loops = 1, start = 0 } = {}) {
    this.queue = items; this.each = each; this.loops = loops; this.loop = 1; this.rep = 1; this.i = start;
    this.load();
  }
  playOne(item) { this.playList([item]); }
  load() {
    const it = this.current; if (!it) return;
    this.el.src = it.url; this.el.playbackRate = this.rate; this.el.defaultPlaybackRate = this.rate;
    this.el.play().catch(() => this.emit());
    this.emit();
  }
  advance() {
    if (this.rep < this.each) { this.rep++; this.el.currentTime = 0; this.el.play(); this.emit(); return; }
    this.rep = 1;
    if (this.i < this.queue.length - 1) { this.i++; this.load(); return; }
    if (!this.loops || this.loop < this.loops) { this.loop++; this.i = 0; this.load(); return; }
    this.i = -1; this.emit('end');
  }
  toggle() { if (this.i < 0) return; this.el.paused ? this.el.play().catch(() => {}) : this.el.pause(); }
  stop() { this.el.pause(); this.el.removeAttribute('src'); this.el.load(); this.i = -1; this.queue = []; this.emit(); }
  setRate(r) { this.rate = r; this.el.playbackRate = r; }
}

// Запис от микрофона: детето/ученикът се записва и се слуша (нищо не се изпраща никъде)
export class Recorder {
  constructor() { this.chunks = []; this.rec = null; this.url = null; }
  get supported() { return !!(navigator.mediaDevices && window.MediaRecorder); }
  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.rec = new MediaRecorder(stream);
    this.rec.ondataavailable = e => this.chunks.push(e.data);
    this.rec.start();
    return new Promise(res => { this.rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(); }; });
  }
  stop() {
    if (!this.rec || this.rec.state === 'inactive') return null;
    this.rec.stop();
    if (this.url) URL.revokeObjectURL(this.url);
    // blob е готов след 'stop' – изчакваме кратко
    return new Promise(res => setTimeout(() => { this.url = URL.createObjectURL(new Blob(this.chunks, { type: this.rec.mimeType || 'audio/webm' })); res(this.url); }, 150));
  }
}

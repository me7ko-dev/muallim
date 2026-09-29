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

// Един <audio> елемент (важно за iPhone – само той е „отключен“ от докосването).
// Елемент от опашката: { url, key, start?, end? } – start/end (сек.) пускат само част от файла (фразите на езана).
export class Player extends EventTarget {
  constructor() {
    super();
    this.el = new Audio();
    this.el.preload = 'auto';
    this.queue = [];
    this.i = -1;
    this.loops = 1;       // повторения на цялата опашка (0 = без край)
    this.loop = 1;
    this.each = 1;        // повторения на всеки елемент
    this.rep = 1;
    this.gap = 0;         // пауза между елементите (мс) – време ученикът да повтори
    this.rate = 1;
    this.t = null;
    this.el.addEventListener('ended', () => this.advance());
    // край на част от файла: timeupdate идва на ~250 мс, затова последните мигове се броят с таймер
    this.el.addEventListener('timeupdate', () => {
      const it = this.current; if (!it || it.end == null || this.el.paused) return;
      const left = (it.end - this.el.currentTime) / this.el.playbackRate;
      if (left <= 0.02) this.advance();
      else if (left < 0.5) { clearTimeout(this.et); const i = this.i, rep = this.rep; this.et = setTimeout(() => { if (this.i === i && this.rep === rep && !this.el.paused) this.advance(); }, left * 1000); }
    });
    this.el.addEventListener('playing', () => this.emit());
    this.el.addEventListener('pause', () => this.emit());
    this.el.addEventListener('error', () => { if (this.i >= 0) { this.i = -1; this.emit('fail'); this.emit(); } });
  }
  emit(type = 'state') { this.dispatchEvent(new CustomEvent(type, { detail: this.current })); }
  get current() { return this.queue[this.i] || null; }
  get playing() { return this.i >= 0 && (!this.el.paused || !!this.t) && !this.el.error; }
  // Пуска списък; each = пъти всеки елемент, loops = пъти целият списък, gap = пауза между тях (мс)
  playList(items, { each = 1, loops = 1, start = 0, gap = 0 } = {}) {
    clearTimeout(this.t); this.t = null;
    this.queue = items; this.each = each; this.loops = loops; this.gap = gap; this.loop = 1; this.rep = 1; this.i = start;
    this.load();
  }
  playOne(item, opts) { this.playList([item], opts); }
  load() {
    const it = this.current; if (!it) return;
    const abs = new URL(it.url, location.href).href;
    const from = it.start || 0;
    if (this.el.src !== abs) { this.el.src = abs; }
    this.el.playbackRate = this.rate; this.el.defaultPlaybackRate = this.rate;
    this.seek(from);
    this.el.play().catch(() => this.emit());
    this.emit();
  }
  // Преди метаданните iOS не приема currentTime – изчакваме ги
  seek(t) {
    if (this.el.readyState >= 1) { if (Math.abs(this.el.currentTime - t) > 0.05) this.el.currentTime = t; return; }
    const f = () => { this.el.removeEventListener('loadedmetadata', f); if (Math.abs(this.el.currentTime - t) > 0.05) this.el.currentTime = t; };
    this.el.addEventListener('loadedmetadata', f);
  }
  advance() {
    clearTimeout(this.et);
    if (this.i < 0 || this.t) return;
    const it = this.current;
    if (it.end != null) this.el.pause();
    const next = () => {
      this.t = null;
      if (this.rep < this.each) { this.rep++; this.load(); return; }
      this.rep = 1;
      if (this.i < this.queue.length - 1) { this.i++; this.load(); return; }
      if (!this.loops || this.loop < this.loops) { this.loop++; this.i = 0; this.load(); return; }
      this.i = -1; this.emit('end'); this.emit();
    };
    const last = this.rep >= this.each && this.i >= this.queue.length - 1 && this.loops && this.loop >= this.loops;
    if (this.gap && !last) { this.t = setTimeout(next, this.gap / this.rate); this.emit(); } else next();
  }
  toggle() {
    if (this.i < 0) return;
    if (this.t) { clearTimeout(this.t); this.t = null; this.el.pause(); this.emit(); return; }
    if (this.el.paused) { const it = this.current; if (it.end != null && this.el.currentTime >= it.end) this.seek(it.start || 0); this.el.play().catch(() => {}); } else this.el.pause();
  }
  stop() { clearTimeout(this.et); clearTimeout(this.t); this.t = null; this.el.pause(); this.el.removeAttribute('src'); this.el.load(); this.i = -1; this.queue = []; this.emit(); }
  setRate(r) { this.rate = r; this.el.playbackRate = r; this.el.defaultPlaybackRate = r; }
}

// Запис от микрофона: детето/ученикът се записва и се слуша (нищо не се изпраща никъде)
export class Recorder {
  constructor() { this.chunks = []; this.rec = null; this.url = null; this.done = null; }
  get supported() { return !!(navigator.mediaDevices && window.MediaRecorder); }
  // Връща се, щом записът е започнал (хвърля грешка без разрешение за микрофона)
  async start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = [];
    this.rec = new MediaRecorder(stream);
    this.rec.ondataavailable = e => { if (e.data && e.data.size) this.chunks.push(e.data); };
    this.done = new Promise(res => { this.rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); res(); }; });
    this.rec.start();
  }
  // Спира и връща адрес на записа, когато данните са готови
  async stop() {
    if (!this.rec || this.rec.state === 'inactive') return null;
    this.rec.stop();
    await this.done;
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = URL.createObjectURL(new Blob(this.chunks, { type: this.rec.mimeType || 'audio/webm' }));
    return this.url;
  }
}

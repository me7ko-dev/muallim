// Изобразяване на всеки вид урок + поведение (аудио, запис, стъпки)
import { DATA, esc, icon, $, player, toast, lessonHref } from './app.js';
import { store, markDone } from './store.js';
import { ayahUrl, Recorder } from './audio.js';
import { figureSvg, POS_NAME } from './figure.js';
import { renderQuiz, bindQuiz, shuffle } from './quiz.js';

// Как звучи всяка буква с български букви (за срички и тестове)
export const CYR = { alif: '', ba: 'б', ta: 'т', tha: 'с', jim: 'дж', hha: 'х', kha: 'х', dal: 'д', dhal: 'з', ra: 'р', zay: 'з', sin: 'с', shin: 'ш', sad: 'с', dad: 'д', tta: 'т', zza: 'з', ayn: '’', ghayn: 'г', fa: 'ф', qaf: 'к', kaf: 'к', lam: 'л', mim: 'м', nun: 'н', ha: 'х', waw: 'в', ya: 'й' };
// „Дебели“ букви – фетхата при тях звучи „а“, при другите „е“
export const THICK = new Set(['kha', 'sad', 'dad', 'tta', 'zza', 'ghayn', 'qaf', 'ra']);
const letterById = id => DATA.letters.letters.find(l => l.id === id);
const FORM_NAMES = ['сама', 'в началото', 'в средата', 'в края'];
const ar = t => `<span class="ar">${t}</span>`;
const vowelOf = (id, v) => v === 'fetha' ? (THICK.has(id) ? 'а' : 'е') : v === 'kesra' ? 'и' : 'у';

// ---------- рендери ----------
const R = {
  letters(l) {
    return `<p class="p muted">Разгледайте всяка буква: как изглежда сама и в думата, откъде излиза звукът, пример. Чуйте я, повторете на глас и се запишете накрая.</p>
    <div class="ctrls"><button class="btn" data-seq>${icon('play')} Чуй всички букви подред</button></div>
    <div class="letters">${l.letters.map(id => letterById(id)).map(x => `<div class="card letter">
      <div><div class="big" lang="ar">${x.ar}</div><button class="btn ghost btn-sm" data-audio="audio/letters/${x.id}.mp3" style="width:100%;margin-top:8px;height:40px;padding:0 8px">${icon('play')} Чуй</button></div>
      <div><h3>${esc(x.name)} <span class="badge">${esc(x.group)}</span></h3><div class="snd">Звук: ${esc(x.sound)}</div><p>${esc(x.makhraj)}</p>
        <div class="forms">${x.forms.map((f, i) => `<span lang="ar">${f}<small>${FORM_NAMES[i]}</small></span>`).join('')}</div>
        ${x.join ? '' : '<p class="muted" style="font-size:13px">Тази буква не се свързва със следващата (само с предишната).</p>'}
        <div class="ex">${ar(x.example.ar)}<div><b>${esc(x.example.tr)}</b><br><small>${esc(x.example.bg)}</small></div></div>
      </div></div>`).join('')}</div>${recorder('Прочетете имената и звуковете на буквите на глас, запишете се и се чуйте.')}`;
  },
  extra() {
    return `<p class="p muted">Освен 28-те букви има няколко знака, които ще срещате постоянно.</p><div class="letters">${DATA.letters.extra.map(x => `<div class="card letter"><div class="big" lang="ar">${x.ar}</div><div><h3>${esc(x.name)}</h3><p>${esc(x.desc)}</p></div></div>`).join('')}</div>`;
  },
  forms() {
    const words = [['بِسْمِ', 'ب ِ س ْ م ِ', 'бисми – „в името“'], ['كِتَاب', 'ك ِ ت َ ا ب', 'китааб – „книга“'], ['مُحَمَّد', 'م ُ ح َ م ّ َ د', 'Мухаммед'], ['سَلَام', 'س َ ل َ ا م', 'селяям – „мир“'], ['قُرْآن', 'ق ُ ر ْ آ ن', 'Кур’аан'], ['اَللّٰه', 'ا ل ل ّ ٰ ه', 'Аллах']];
    return `<p class="p">Арабски се пише <b>отдясно наляво</b>. Повечето букви се хващат за съседните си и променят формата си: в началото, в средата и в края на думата. Шест букви (<span class="ar">ا د ذ ر ز و</span>) се свързват само с предишната буква – след тях винаги има „прекъсване“.</p>
    <div class="sub">Примери: отделните букви → думата</div>
    <div class="letters">${words.map(([w, parts, bg]) => `<div class="card demo" style="text-align:center"><div class="ar" style="font-size:34px;color:var(--muted)">${parts}</div><div class="muted">↓</div><div class="ar" style="font-size:64px">${w}</div><b style="font-size:18px">${esc(bg)}</b></div>`).join('')}</div>
    <div class="card note"><b>Съвет:</b> запомнете „скелета“ на буквата – точките и извивката. Формата в средата е обикновено само скелетът с точките, без „опашката“.</div>`;
  },
  haraka(l) {
    const v = l.id;
    return `<div class="card demo"><div class="ar" id="demoAr">ب${l.mark}</div><b id="demoTr">б${vowelOf('ba', v)}</b></div>
    <p class="p">${esc(l.desc)}</p>
    <div class="sub">Всички букви с ${esc(l.title.split(' –')[0].toLowerCase())} – докоснете, за да ги видите големи</div>
    <div class="syl">${DATA.letters.letters.map(x => `<button data-syl="${x.ar}${l.mark}" data-tr="${x.id === 'alif' ? vowelOf('alif', v) : CYR[x.id] + vowelOf(x.id, v)}"><span class="ar" lang="ar">${x.id === 'alif' ? 'أ' : x.ar}${l.mark}</span><small>${x.id === 'alif' ? vowelOf('alif', v) : CYR[x.id] + vowelOf(x.id, v)}</small></button>`).join('')}</div>
    ${recorder('Прочетете всички срички на глас подред, запишете се и проверете дали различавате „а/е“, „и“ и „у“.')}`;
  },
  tenvin() {
    const rows = [['ً', 'ан / ен', 'фетхатан – две чертички над буквата', 'كِتَابًا', 'китаабен'], ['ٍ', 'ин', 'кесратан – две чертички под буквата', 'كِتَابٍ', 'китаабин'], ['ٌ', 'ун', 'даммататан – две „вав“ над буквата', 'كِتَابٌ', 'китаабун']];
    return `<p class="p">Тенвинът е <b>двойна харекета</b> в края на думата. Чете се като гласна + „н“, макар че буква „нун“ не се пише. Среща се само в края на думи.</p>
    <div class="letters">${rows.map(([m, r, d, w, t]) => `<div class="card letter"><div class="big" lang="ar">ب${m}</div><div><h3>б${r}</h3><p>${d}</p><div class="ex">${ar(w)}<div><b>${t}</b></div></div></div></div>`).join('')}</div>
    <div class="sub">Упражнение – прочетете</div>
    <div class="syl big">${[['سَلَامٌ', 'селяямун'], ['رَحِيمٍ', 'рахийммин'], ['عَظِيمًا', 'азыймен'], ['نُورٌ', 'нуурун'], ['أَحَدٌ', 'ехадун'], ['شَيْءٍ', 'шей’ин']].map(([w, t]) => `<button data-syl="${w}" data-tr="${t}"><span class="ar" lang="ar">${w}</span><small>${t}</small></button>`).join('')}</div>`;
  },
  sukun() {
    return `<div class="card demo"><div class="ar">بْ</div><b>сукун – без гласна</b></div>
    <p class="p"><b>Сукун</b> (малко кръгче над буквата) означава, че буквата е <b>без гласна</b> – тя „затваря“ сричката. Пример: <span class="ar">مِنْ</span> = мин, <span class="ar">قُلْ</span> = кул.</p>
    <div class="syl big">${[['مِنْ', 'мин'], ['عَنْ', 'ан'], ['قُلْ', 'кул'], ['بَلْ', 'бел'], ['هَلْ', 'хел'], ['كُنْ', 'кун'], ['أَنْتَ', 'енте'], ['يَوْم', 'йевм']].map(([w, t]) => `<button data-syl="${w}" data-tr="${t}"><span class="ar" lang="ar">${w}</span><small>${t}</small></button>`).join('')}</div>
    <div class="card demo" style="margin-top:22px"><div class="ar">بّ</div><b>шедде – удвояване</b></div>
    <p class="p"><b>Шедде</b> (знак като малко „w“ над буквата) <b>удвоява</b> буквата: първата е със сукун, втората – с гласната на шеддето. Пример: <span class="ar">رَبِّ</span> = раб-би, <span class="ar">إِنَّ</span> = ин-не.</p>
    <div class="syl big">${[['رَبِّ', 'рабби'], ['إِنَّ', 'инне'], ['مُحَمَّد', 'Мухаммед'], ['اَللّٰه', 'Аллаах'], ['جَنَّة', 'дженне'], ['حَقّ', 'хакк']].map(([w, t]) => `<button data-syl="${w}" data-tr="${t}"><span class="ar" lang="ar">${w}</span><small>${t}</small></button>`).join('')}</div>
    ${recorder('Прочетете думите – при сукун спирайте рязко, при шедде задръжте буквата двойно.')}`;
  },
  medd() {
    const rows = [['بَا', 'баа', 'фетха + елиф → дълго „аа“'], ['بِي', 'бии', 'кесра + йе (без харекет) → дълго „ии“'], ['بُو', 'буу', 'дамма + вав (без харекет) → дълго „уу“']];
    return `<p class="p">Три букви удължават гласната пред себе си: <b>елиф</b> след фетха, <b>йе</b> след кесра и <b>вав</b> след дамма. Дългата гласна трае <b>два пъти</b> по-дълго от кратката – това е разлика, която променя смисъла на думата.</p>
    <div class="letters">${rows.map(([w, t, d]) => `<div class="card letter"><div class="big" lang="ar">${w}</div><div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}</div>
    <div class="sub">Упражнение – удължавайте ясно</div>
    <div class="syl big">${[['قَالَ', 'каале'], ['فِيهِ', 'фиихи'], ['نُور', 'нуур'], ['كِتَاب', 'китааб'], ['دِين', 'диин'], ['يَقُول', 'йекуул'], ['عَلٰى', 'аляя'], ['رَحْمٰن', 'рахмаан']].map(([w, t]) => `<button data-syl="${w}" data-tr="${t}"><span class="ar" lang="ar">${w}</span><small>${t}</small></button>`).join('')}</div>
    <div class="card note"><b>Малък елиф</b> (<span class="ar">ٰ</span> – „кинжал“) над буквата също е дълго „аа“: <span class="ar">رَحْمٰن</span>, <span class="ar">اَللّٰه</span>.</div>
    ${recorder('Прочетете думите – броете наум „едно-две“ за всяка дълга гласна.')}`;
  },
  tecvid() {
    const rules = [
      ['Медд (удължаване)', 'Естествен медд – 2 бройки (напр. قَالَ). Ако след дългата гласна има хемзе или сукун/шедде – удължава се 4–6 бройки (напр. جَآءَ, ٱلضَّآلِّينَ в края на Фатиха).', 'وَلَا ٱلضَّآلِّينَ'],
      ['Нун сакин и тенвин – 4 правила', 'Пред гърлените букви (ء ه ع ح غ خ) – ИЗХАР: „н“ се чете ясно. Пред ي ن م و – ИДГАМ с гунне: „н“ се слива в следващата буква с носов звук; пред ل ر – идгам без гунне. Пред ب – ИКЛЯБ: „н“ става „м“ (مِنۢ بَعْدِ – мим ба’ди). Пред останалите 15 букви – ИХФА: „н“ се крие, чете се през носа около 2 бройки.', 'مِنْ شَرِّ'],
      ['Мим сакин', 'Пред م – идгам с гунне; пред ب – ихфа шефеви (лек носов звук с устни); пред останалите – изхар (ясно „м“).', 'لَهُم مَّا'],
      ['Гунне', 'Носов звук при удвоени ن и م (نّ, مّ) – винаги 2 бройки: إِنَّ, ثُمَّ.', 'إِنَّ'],
      ['Калкала', 'Буквите ق ط ب ج د (запомнете: „кутбу джед“) със сукун се четат с леко „отскачане“, като ехо: أَحَدْ, ٱلْفَلَقْ.', 'قُلْ هُوَ ٱللَّهُ أَحَدْ'],
      ['Дебели и тънки букви', 'Винаги дебели (тефхим): خ ص ض غ ط ق ظ. „Ра“ е дебело при фетха/дамма и тънко при кесра. „Лям“ в думата Аллах е дебело след фетха/дамма (يَقُولُ ٱللَّهُ) и тънко след кесра (بِسْمِ ٱللَّهِ).', 'بِسْمِ ٱللَّهِ'],
      ['Спиране (вакф)', 'При спиране последната харекета отпада (سُكون): ٱلْعَالَمِينَ → аалемийн; тенвин с фетха става дълго „аа“: أَحَدًا → ехадаа; те марбута се чете „х“: ٱلصَّلَاةَ → салаах. Не спирайте на място, което разваля смисъла (знак ۘ в мусхафа означава „не спирай тук“).', 'رَبِّ ٱلْعَالَمِينَ'],
    ];
    return `<p class="p">Теджвидът е науката как всяка буква да се чете правилно – така, както е низпослан Коранът. Ето седемте правила, без които не може. Учете ги едно по едно и слушайте примерите от рецитаторите в модула „Сури за намаз“.</p>
    <div class="letters">${rules.map(([t, d, ex]) => `<div class="card dua"><h3>${t}</h3><p class="p">${d}</p><p class="ar-text" lang="ar" style="font-size:calc(var(--ar)*.8)">${ex}</p></div>`).join('')}</div>
    <div class="card note"><b>Скоро:</b> отделни уроци с аудио за всяко правило.</div>`;
  },
  surah(l) {
    const S = DATA.surahs[l.s]; const T = DATA.translit;
    const cls = `${store.get('showTr') ? '' : 'hide-tr'} ${store.get('showBg') ? '' : 'hide-bg'}`;
    return `<div class="card surah-head"><div class="ar" lang="ar">${S.ar}</div><h2>${esc(S.name)}</h2><p>${esc(S.mean)} · ${S.ayahs.length} ${S.ayahs.length === 1 ? 'айет' : 'айета'}</p></div>
    <div class="ctrls">
      <button class="btn" data-playall>${icon('play')} Пусни цялата</button>
      <button class="btn gold" data-learn>${icon('play')} Заучаване</button>
      <span class="muted" style="font-size:13px">Заучаване: всеки айет ×<b id="eachN">3</b>, цялата ×<b id="loopN">2</b></span>
      <div class="seg" id="eachSeg">${[1, 3, 5].map(n => `<button data-each="${n}" class="${n === 3 ? 'on' : ''}">×${n}</button>`).join('')}</div>
    </div>
    <div class="ayahs ${cls}">${S.ayahs.map(a => `<div class="ayah" data-a="${a.a}"><div class="ayah-top"><span class="ayah-key">${l.s}:${a.a}</span><button class="ib" data-play="${a.a}" aria-label="Пусни айет ${a.a}">${icon('play')}</button></div>
      <p class="ar-text" lang="ar">${a.ar}</p><p class="tr-text">${esc(T[`${l.s}:${a.a}`] || '')}</p><p class="bg-text">${esc(a.tr)}</p></div>`).join('')}</div>
    ${recorder('Пуснете айет, повторете го, запишете се – и сравнете с рецитатора. Повтаряйте, докато звучи еднакво.')}
    <div class="card note">Рецитатор: <b>${esc((store.get('reciter') || '').replace(/_/g, ' '))}</b> – сменя се в Настройки. Съветваме „Хусари – Муаллим“: чете бавно и повтаря, точно за учене.</div>`;
  },
  dua(l) {
    const cls = `${store.get('showTr') ? '' : 'hide-tr'} ${store.get('showBg') ? '' : 'hide-bg'}`;
    return `<div class="${cls}">${l.duas.map(id => DATA.dualar.find(d => d.id === id)).map(d => `<div class="card dua"><h3>${esc(d.name)}</h3><p class="when">${esc(d.when)}</p>${d.ar ? `<p class="ar-text" lang="ar">${d.ar}</p>` : ''}<p class="tr-text">${esc(d.tr)}</p><p class="bg-text">${esc(d.bg)}</p>${d.note ? `<div class="note">${esc(d.note)}</div>` : ''}</div>`).join('')}</div>
    ${recorder('Прочетете дуата бавно на глас по българските букви, запишете се и се чуйте. Учете по един ред на ден.')}`;
  },
  ezan() {
    const E = DATA.ezan;
    return `<p class="p">${esc(E.intro)}</p>
    <div class="ctrls"><button class="btn" data-audio="audio/ezan.mp3">${icon('play')} Чуй езана (2:34)</button><span class="muted" style="font-size:13px">Следете реда по-долу, докато слушате.</span></div>
    <div class="card">${E.lines.map(x => `<div class="ezan-line ${x.only ? 'sabah' : ''}"><span class="x">×${x.times}</span><p class="ar-text" lang="ar">${x.ar}</p><p class="tr-text">${esc(x.tr)}</p><p class="bg-text">${esc(x.bg)}${x.only ? ' <span class="badge">само сабах</span>' : ''}</p><div class="reply"><b>Отговор:</b> ${esc(x.reply)}</div></div>`).join('')}</div>
    <h3 class="h">${esc(E.dua.name)}</h3><div class="card dua"><p class="ar-text" lang="ar">${E.dua.ar}</p><p class="tr-text">${esc(E.dua.tr)}</p><p class="bg-text">${esc(E.dua.bg)}</p></div>
    ${recorder('Кажете езана ред по ред, бавно, запишете се и се чуйте.')}`;
  },
  ikamet() {
    const E = DATA.ezan;
    return `<p class="p">${esc(E.ikamet.note)}</p><div class="card dua"><p class="ar-text" lang="ar">${E.ikamet.ar}</p><p class="tr-text">${esc(E.ikamet.tr)} (×${E.ikamet.times})</p><p class="bg-text">${esc(E.ikamet.bg)}</p></div>
    <h3 class="h">Особености на икамета</h3><ul class="list">${E.ikamet.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <h3 class="h">Правила за езана</h3><ul class="list">${E.rules.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  },
  abdest() {
    const A = DATA.abdest;
    return `<p class="p">${esc(A.intro)}</p><div class="steps">${A.steps.map(s => `<div class="card step"><span class="n">${s.n}</span><div class="mid"><b>${esc(s.t)} ${s.d.includes('(ФАРЗ)') ? '<span class="badge farz">фарз</span>' : ''} ${s.times ? `<span class="x">${s.times}</span>` : ''}</b><p>${esc(s.d.replace(' (ФАРЗ)', '').replace(' (ФАРЗ – поне ¼)', ''))}</p></div></div>`).join('')}</div>`;
  },
  'abdest-rules'() {
    const A = DATA.abdest;
    return `<h3 class="h">Фарзовете на абдеста (4)</h3><ul class="list num">${A.farz.map(f => `<li><span><b>${esc(f.t)}</b><small>${esc(f.d)}</small></span></li>`).join('')}</ul>
    <h3 class="h">Сюннетите</h3><ul class="list good">${A.sunnet.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <h3 class="h">Какво разваля абдеста</h3><ul class="list bad">${A.breaks.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <h3 class="h">Какво НЕ разваля абдеста</h3><ul class="list good">${A.notbreaks.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  },
  gusul() {
    const G = DATA.abdest.gusul, T = DATA.abdest.teyemmum;
    return `<h2 class="h">Гусюл</h2><p class="p">${esc(G.intro)}</p><div class="sub">Фарзове</div><ul class="list num">${G.farz.map(t => `<li>${esc(t)}</li>`).join('')}</ul><div class="sub">Как се прави</div><ul class="list num">${G.steps.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <h2 class="h">Теяммум</h2><p class="p">${esc(T.intro)}</p><ul class="list num">${T.steps.map(t => `<li>${esc(t)}</li>`).join('')}</ul><div class="card note">${esc(T.note)}</div>`;
  },
  prayers() {
    const N = DATA.namaz;
    return `<p class="p">${esc(N.intro)}</p>${N.prayers.map(p => `<div class="card prayer"><div class="top"><h3>${esc(p.name)}</h3><span class="ar" lang="ar">${p.ar}</span></div><div class="tm">${esc(p.time)} · общо ${p.total} рекята</div><div class="rak">${p.parts.map(x => `<span class="${x.k}"><b>${x.r}</b> ${esc(x.n)}</span>`).join('')}</div><p class="nt">${esc(p.note)}</p></div>`).join('')}
    <div class="card note"><b>Ред:</b> първо сюннетът преди фарза (ако има), после фарзът, после сюннетът след него, накрая витрът (само в ятсъ). Времената за вашия град: в приложението <a href="https://me7ko-dev.github.io/quran-kerim/#/prayer" target="_blank" rel="noopener">Куран-и Керим</a>.</div>`;
  },
  sartlar() {
    const N = DATA.namaz;
    return `<h3 class="h">${esc(N.sartlar.title)}</h3><ul class="list num">${N.sartlar.items.map(x => `<li><span><b>${esc(x.t)}</b><small>${esc(x.d)}</small></span></li>`).join('')}</ul>
    <h3 class="h">${esc(N.rukunler.title)}</h3><ul class="list num">${N.rukunler.items.map(x => `<li><span><b>${esc(x.t)}</b><small>${esc(x.d)}</small></span></li>`).join('')}</ul>
    <h3 class="h">Ваджиби (задължителни; при пропуск – седжде-и сехв)</h3><ul class="list">${N.vacib.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  },
  steps2() {
    return `<p class="p muted">Разучете движенията с фигурата: докосвайте „Напред“. Под всяка стъпка са нещата, които се четат – с връзка към урока им.</p><div class="card stepper" id="stepper"></div>
    <h3 class="h">Всички стъпки накратко</h3><div class="steps">${DATA.namaz.steps2.steps.map((s, i) => `<div class="card step"><span class="n">${i + 1}</span><div class="mid"><b>${esc(s.t)}</b><p>${esc(s.d)}</p></div></div>`).join('')}</div>`;
  },
  steps34() {
    const N = DATA.namaz;
    return `<h3 class="h">${esc(N.steps34.title)}</h3><ul class="list">${N.steps34.items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <h3 class="h">${esc(N.women.title)}</h3><ul class="list">${N.women.items.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  },
  sehiv() {
    const N = DATA.namaz;
    return `<h3 class="h">${esc(N.sehiv.title)}</h3><p class="p">${esc(N.sehiv.d)}</p>
    <h3 class="h">Какво разваля намаза</h3><ul class="list bad">${N.sehiv.invalid.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
    <h3 class="h">Каза (пропуснат намаз)</h3><p class="p">${esc(N.kaza)}</p>
    <h3 class="h">Съвети за начинаещи</h3><ul class="list good">${N.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;
  },
  quiz() { return renderQuiz(); },
  build() {
    return `<p class="p muted">Буквите в думата се свързват и променят формата си. Докоснете буквите подред – от <b>първата</b> (най-дясната) до последната. Внимавайте за точките: ب ت ث ن си приличат.</p><div class="card quiz build" id="build"></div>`;
  },
};

function recorder(hint) {
  return `<div class="card rec" data-rec><h3>${icon('mic')} Запишете се и се чуйте</h3><p>${esc(hint)} Записът остава само на вашето устройство.</p><button class="btn ghost" data-recbtn>${icon('mic')} Запиши</button><div data-recout></div></div>`;
}

export function renderLesson(l, m) { return (R[l.type] || (() => '<div class="empty">Този урок още се подготвя.</div>'))(l, m); }

// ---------- поведение ----------
let cleanup = [];
const on = (el, ev, f) => { el.addEventListener(ev, f); cleanup.push(() => el.removeEventListener(ev, f)); };
export function unbindLesson() { cleanup.forEach(f => f()); cleanup = []; }

export function bindLesson(l, m, view) {
  if (l.type === 'quiz') { bindQuiz(l, m); return; }
  // срички – показват се големи в демото
  view.querySelectorAll('[data-syl]').forEach(b => on(b, 'click', () => {
    const d = $('#demoAr'); if (d) { d.textContent = b.dataset.syl; $('#demoTr').textContent = b.dataset.tr; window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else toast(b.dataset.tr);
  }));
  // букви – всички подред
  const seq = view.querySelector('[data-seq]');
  if (seq && l.letters) on(seq, 'click', () => player.playList(l.letters.map(id => ({ url: `audio/letters/${id}.mp3`, key: id })), { each: 2 }));
  // сура – аудио
  if (l.type === 'surah') bindSurah(l, view);
  if (l.type === 'steps2') bindStepper(view);
  if (l.type === 'build') bindBuild(l, m, view);
  // запис
  const rec = view.querySelector('[data-rec]');
  if (rec) bindRecorder(rec);
}

function bindSurah(l, view) {
  const S = DATA.surahs[l.s]; const r = store.get('reciter');
  const items = S.ayahs.map(a => ({ url: ayahUrl(r, l.s, a.a), key: a.a }));
  let each = 3;
  const setBtn = (playing) => { const b = view.querySelector('[data-playall]'); if (b) b.innerHTML = `${icon(playing ? 'pause' : 'play')} ${playing ? 'Пауза' : 'Пусни цялата'}`; };
  const onState = () => {
    const cur = player.current;
    view.querySelectorAll('.ayah').forEach(el => el.classList.toggle('cur', !!cur && +el.dataset.a === cur.key));
    view.querySelectorAll('[data-play]').forEach(b => b.innerHTML = icon(cur && +b.dataset.play === cur.key && player.playing ? 'pause' : 'play'));
    setBtn(player.playing);
  };
  on(player, 'state', onState); on(player, 'end', onState);
  on(player, 'fail', () => toast('Аудиото не се зареди – проверете интернет връзката.'));
  view.querySelectorAll('[data-play]').forEach(b => on(b, 'click', () => {
    const a = +b.dataset.play; const cur = player.current;
    if (cur && cur.key === a && player.queue.length === 1) player.toggle(); else player.playOne(items[a - 1]);
  }));
  on(view.querySelector('[data-playall]'), 'click', () => { if (player.queue.length === items.length && player.current) player.toggle(); else player.playList(items); });
  on(view.querySelector('[data-learn]'), 'click', () => { player.playList(items, { each, loops: 2 }); toast(`Заучаване: всеки айет ×${each}, цялата ×2`); });
  on($('#eachSeg'), 'click', e => { const b = e.target.closest('button'); if (!b) return; each = +b.dataset.each; $('#eachN').textContent = each; $('#eachSeg').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); });
}

function bindStepper(view) {
  const steps = DATA.namaz.steps2.steps; let i = 0;
  const box = $('#stepper');
  const readLink = id => {
    if (id.startsWith('s:')) { const s = +id.slice(2); const S = DATA.surahs[s]; return `<a class="chip" href="${lessonHref('sureler', s === 2 ? 'ak' : 's' + s)}">${esc(S ? S.name : id)}</a>`; }
    const d = DATA.dualar.find(x => x.id === id); const les = DATA.course.modules.find(m => m.id === 'dualar').lessons.find(L => L.duas.includes(id));
    return `<a class="chip" href="${lessonHref('dualar', les ? les.id : 'd1')}">${esc(d ? d.name : id)}</a>`;
  };
  const show = () => {
    const s = steps[i];
    box.innerHTML = `<div class="fig">${figureSvg(s.pos, 150)}</div><div class="pos">${POS_NAME[s.pos]} · стъпка ${i + 1} от ${steps.length}</div><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p>
      <div class="reads">${s.read.map(readLink).join('')}</div>
      <div class="nav"><button class="btn ghost" id="stPrev" ${i === 0 ? 'disabled' : ''}>${icon('chev-l')} Назад</button><div class="dots">${steps.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div><button class="btn" id="stNext" ${i === steps.length - 1 ? 'disabled' : ''}>Напред ${icon('chev-r')}</button></div>`;
    $('#stPrev').onclick = () => { i--; show(); }; $('#stNext').onclick = () => { i++; show(); };
  };
  show();
  on(document, 'keydown', e => { if (e.key === 'ArrowRight' && i < steps.length - 1) { i++; show(); } if (e.key === 'ArrowLeft' && i > 0) { i--; show(); } });
}

// „Сглоби думата“: думите-примери на буквите, разбити на букви. Подвеждащите букви се различават от верните само по точките.
const HARAKAT = /[ـً-ٰٟ]/g;
const TWINS = ['بتثني', 'جحخ', 'دذ', 'رز', 'سش', 'صض', 'طظ', 'عغ', 'فق', 'هة', 'اأآ', 'يى'];
const ALIFS = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا' };
function bindBuild(l, m, view) {
  const L = DATA.letters.letters, box = $('#build'), ROUNDS = 8;
  const letterOf = c => L.find(x => x.ar === (ALIFS[c] || c));
  const nameOf = c => ({ 'أ': 'Елиф с хемзе', 'إ': 'Елиф с хемзе', 'آ': 'Елиф с медд' }[c] || (letterOf(c) || DATA.letters.extra.find(x => x.ar === c) || { name: c }).name);
  let words, r, errs;
  const start = () => { words = shuffle(L.map(x => x.example)).slice(0, ROUNDS); r = 0; errs = 0; show(); };
  const show = () => {
    if (r >= words.length) {
      markDone(m.id, l.id);
      const db = $('#doneBtn'); if (db) { db.classList.add('done'); db.innerHTML = `${icon('check')} Завършен`; }
      box.innerHTML = `<div class="result"><div class="muted">Сглобихте ${words.length} думи</div><b>${errs ? `${errs} ${errs === 1 ? 'грешка' : 'грешки'}` : 'без грешка'}</b><p>${errs ? 'Вижте пак точките на буквите, които ви объркаха.' : 'Отлично! Машаллах.'}</p><div class="acts" style="justify-content:center"><button class="btn" id="bAgain">Още веднъж</button></div></div>`;
      $('#bAgain').onclick = start;
      return;
    }
    const w = words[r], chars = [...w.ar.replace(HARAKAT, '')];
    const decoys = shuffle([...new Set(chars.flatMap(c => [...(TWINS.find(g => g.includes(c)) || '')]))].filter(c => !chars.includes(c)));
    if (decoys.length < 2) decoys.push(...shuffle(L.map(x => x.ar).filter(c => !chars.includes(c) && !decoys.includes(c))));
    const tiles = shuffle([...chars, ...decoys.slice(0, 2)]);
    let i = 0, miss = 0;
    box.innerHTML = `<div class="prog">Дума ${r + 1} от ${words.length}</div>
      <div class="word"><div class="ar">${w.ar}</div><span>${esc(w.tr)} – ${esc(w.bg)}</span></div>
      <div class="slots" dir="rtl">${chars.map(() => '<span></span>').join('')}</div>
      <div class="tray" dir="rtl">${tiles.map((c, k) => `<button class="tile" data-k="${k}" lang="ar" aria-label="${esc(nameOf(c))}">${c}</button>`).join('')}</div>
      <p class="fb" aria-live="polite"></p>`;
    const fb = box.querySelector('.fb');
    box.querySelectorAll('.tile').forEach(b => b.onclick = () => {
      const c = tiles[+b.dataset.k];
      if (c !== chars[i]) {
        errs++; miss++;
        b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
        fb.className = 'fb bad';
        fb.textContent = `Това е ${nameOf(c)}. ` + (miss >= 2 ? `Подсказка: ${i ? 'следващата' : 'първата'} е ${nameOf(chars[i])}.` : `Търсете ${i ? 'следващата' : 'първата'} буква – вижте точките.`);
        return;
      }
      b.disabled = true; b.classList.add('used'); b.classList.remove('shake');
      const slot = box.querySelectorAll('.slots span')[i]; slot.textContent = c; slot.classList.add('ok');
      const le = letterOf(c); if (le) player.playOne({ url: `audio/letters/${le.id}.mp3`, key: le.id });
      i++; miss = 0;
      fb.className = 'fb'; fb.textContent = '';
      if (i < chars.length) return;
      box.querySelectorAll('.tile').forEach(t => t.disabled = true);
      fb.className = 'fb ok'; fb.textContent = `✓ Браво! ${w.tr} – ${w.bg}`;
      const nb = document.createElement('button'); nb.className = 'btn'; nb.style.marginTop = '12px';
      nb.innerHTML = `${r + 1 < words.length ? 'Следваща дума' : 'Резултат'} ${icon('chev-r')}`;
      nb.onclick = () => { r++; show(); };
      box.appendChild(nb); nb.focus();
    });
  };
  start();
}

function bindRecorder(box) {
  const rec = new Recorder(); const btn = box.querySelector('[data-recbtn]'); const out = box.querySelector('[data-recout]');
  if (!rec.supported) { btn.disabled = true; btn.textContent = 'Записът не се поддържа в този браузър'; return; }
  let recording = false;
  on(btn, 'click', async () => {
    if (!recording) {
      try { rec.start().catch(() => {}); recording = true; btn.classList.add('rec-on'); btn.innerHTML = `${icon('mic')} Спри записа`; player.stop(); }
      catch (e) { toast('Нужно е разрешение за микрофона.'); }
    } else {
      recording = false; btn.classList.remove('rec-on'); btn.innerHTML = `${icon('mic')} Запиши отново`;
      const url = await rec.stop(); if (url) out.innerHTML = `<audio controls src="${url}"></audio>`;
    }
  });
}

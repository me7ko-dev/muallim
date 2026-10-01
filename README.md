# Муаллим – учител по Коран и намаз

**На живо:** https://me7ko-dev.github.io/muallim/
**Репо:** https://github.com/me7ko-dev/muallim
**Папка на компютъра:** `C:\Users\roika\Projects\muallim`

От нулата до правилно четене на Корана и до намаза – на български, стъпка по стъпка, по ханефи мезхеб:
арабската азбука, гласните и знаците, теджвид, сурите и дуите за намаз (с аудио от рецитатори и запис от микрофона за самопроверка), езан и икамет, абдест/гусюл/теяммум, петте намаза и как се кланят (с анимирана фигура), изпити и напредък.

## Инсталиране и споделяне

- **Инсталиране без Google Play:** бутонът „Инсталирай“ (на началния екран и в Настройки). Android, Chrome и Edge показват истинския прозорец за инсталиране; на iPhone излиза картинка „Сподели → Добави към началния екран“.
- **Споделяне:** бутонът „Сподели“ – менюто на телефона или Viber, WhatsApp, Facebook, Telegram и QR код. Линкът се показва със снимка: https://me7ko-dev.github.io/muallim/share/og.jpg
- **QR код:** https://me7ko-dev.github.io/muallim/share/qr.png
- **Плакат A4 за печат:** https://me7ko-dev.github.io/muallim/share/plakat-a4.pdf

## Езици

- **Български** – основен. **Английски** – засега само интерфейсът (менюта, бутони, изпити, Настройки). Уроците са на български и се превеждат на следващата стъпка.
- Линк на английски (с английска визитка за групите): https://me7ko-dev.github.io/muallim/en/
- Изборът е в Настройки → „Език · Language“ или с `?lang=en` в адреса.
- Следващите езици: турски, албански, босненски, немски.

## Как се пуска локално

```
cd C:\Users\roika\Projects\muallim
node tools/serve.mjs
```
→ отвори http://localhost:8932/

Статичен сайт без build: всяка промяна се вижда при презареждане. `git push` в `main` → GitHub Pages се обновява за около минута.

## Устройство
- `index.html`, `css/style.css` – каркас и стилове (шрифтовете са в `fonts/`, без Google Fonts).
- `js/app.js` – рутер (`#/`, `#/kurs`, `#/m/<модул>`, `#/l/<модул>/<урок>`, `#/settings`), начало, модул, настройки.
- `js/lessons.js` – изобразяване на всеки вид урок; `js/quiz.js` – изпитите; `js/audio.js` – аудио от EveryAyah + запис от микрофона; `js/figure.js` – фигурата за намаз; `js/store.js` – напредък в localStorage.
- `data/course.json` – учебната програма (модули → уроци). Останалите `data/*.json` – съдържанието (букви, сури, транслитерация, дуи, езан, абдест, намаз).
- `sw.js` – работи офлайн (без аудиото).
- `js/pwa.js` – „Инсталирай“ и „Сподели“ (същият файл е и в Куран-и Керим). `share/` – визитката, QR кодът и плакатът.

## Проверки и инструменти

```
node tools/smoke.mjs http://localhost:8932/                  # всички екрани без грешки (сървърът да е пуснат)
NODE_PATH="$(npm root -g)" node tools/test-pwa.cjs            # „Инсталирай“ и „Сподели“ на телефон и компютър (Playwright)
NODE_PATH="$(npm root -g)" node tools/make-share.cjs          # прави наново share/og.jpg, qr.svg, qr.png, plakat-a4.pdf
NODE_PATH="$(npm root -g)" node tools/make-share.cjs en       # същото на английски + страницата en/index.html
node tools/check-i18n.cjs en                                   # всеки текст от кода да има превод в lang/en.js
NODE_PATH="$(npm root -g)" node tools/test-i18n.cjs en        # всеки екран на английски, без забравен български текст
```
(`NODE_PATH=...` е за Git Bash; нужни са `npm i -g playwright qrcode`.)

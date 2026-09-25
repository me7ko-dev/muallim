// Прави icons/icon-192.png и icon-512.png от icons/icon.svg (ползва sharp от проекта vitrini)
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const sharp = createRequire('C:/Users/roika/Projects/vitrini/package.json')('sharp');
const svg = readFileSync(new URL('../icons/icon.svg', import.meta.url));
for (const s of [192, 512]) await sharp(svg).resize(s, s).png().toFile(new URL(`../icons/icon-${s}.png`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
console.log('ok icons');

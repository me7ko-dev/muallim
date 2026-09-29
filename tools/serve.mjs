// Локален сървър: node tools/serve.mjs [порт]  →  http://localhost:8932
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const port = +(process.argv[2] || 8932);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.txt': 'text/plain; charset=utf-8' };
createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try {
    const data = await readFile(join(root, normalize(p)));
    const head = { 'Content-Type': types[extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'Accept-Ranges': 'bytes' };
    // Range – без него браузърът не може да превърта аудиото (както прави GitHub Pages)
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      const n = data.length; let a = m[1] ? +m[1] : n - +m[2], b = m[1] && m[2] ? Math.min(+m[2], n - 1) : n - 1;
      if (a < 0) a = 0;
      if (a >= n) { res.writeHead(416, { 'Content-Range': `bytes */${n}` }); return res.end(); }
      res.writeHead(206, { ...head, 'Content-Range': `bytes ${a}-${b}/${n}`, 'Content-Length': b - a + 1 });
      return res.end(data.subarray(a, b + 1));
    }
    res.writeHead(200, head);
    res.end(data);
  } catch { res.writeHead(404); res.end('404'); }
}).listen(port, () => console.log(`Муаллим: http://localhost:${port}/`));

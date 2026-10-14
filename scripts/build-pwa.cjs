const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../dist');
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}
const assets = files(root).filter((p) => !p.endsWith('sw.js') && !p.endsWith('.map'));
const hash = crypto.createHash('sha256');
for (const file of assets) hash.update(path.relative(root, file)).update(fs.readFileSync(file));
const cache = `keepfit-${hash.digest('hex').slice(0, 16)}`;
const urls = assets.map((p) => '/' + path.relative(root, p).split(path.sep).map(encodeURIComponent).join('/'));
fs.writeFileSync(path.join(root, 'sw.js'), `
const CACHE = ${JSON.stringify(cache)};
const ASSETS = ${JSON.stringify(urls)};
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      // Small batches keep hundreds of bundled exercise images manageable on mobile.
      for (let i = 0; i < ASSETS.length; i += 8) await cache.addAll(ASSETS.slice(i, i + 8));
    } catch (error) { await caches.delete(CACHE); throw error; }
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('keepfit-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  const url = new URL(event.request.url);
  if (event.request.mode !== 'navigate' && !ASSETS.includes(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = event.request.mode === 'navigate' ? '/index.html' : url.pathname;
    return (await cache.match(key)) || fetch(event.request);
  })());
});
`);
console.log(`PWA ready: ${assets.length} assets, ${(assets.reduce((n, p) => n + fs.statSync(p).size, 0) / 1024 / 1024).toFixed(1)} MB; ${cache}`);

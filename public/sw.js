const CACHE = 'dawn-run-20260901-repair-1';
const SHELL = ['/', '/index.html', '/demo', '/favicon.svg', '/apple-touch-icon.svg'];
async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);
  const response = await fetch('/index.html');
  const html = await response.text();
  await cache.put('/index.html', new Response(html, { headers: { 'Content-Type': 'text/html' } }));
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match => match[1]);
  await cache.addAll(assets);
}
self.addEventListener('install', event => event.waitUntil(precache().then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('dawn-run-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put('/index.html', copy)); return response; }).catch(() => caches.match('/index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => { if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone())); return response; })));
});

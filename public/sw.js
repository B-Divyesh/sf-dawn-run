const CACHE = 'dawn-run-20260902-polish-1';
const APP_SHELL = '/index.html';
const APP_ROUTES = ['/', '/demo', '/privacy', '/terms'];
const STATIC_SHELL = ['/favicon.svg', '/apple-touch-icon.svg'];
async function precache() {
  const cache = await caches.open(CACHE);
  const response = await fetch(APP_SHELL, { cache: 'reload' });
  if (!response.ok) throw new Error(`App shell returned ${response.status}`);
  const html = await response.clone().text();
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1]);
  await Promise.all(APP_ROUTES.map(route => cache.put(route, response.clone())));
  await cache.put(APP_SHELL, response.clone());
  await cache.addAll([...STATIC_SHELL, ...assets]);
}
self.addEventListener('install', event => event.waitUntil(precache().then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('dawn-run-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      const url = new URL(event.request.url);
      const route = APP_ROUTES.includes(url.pathname) ? url.pathname : APP_SHELL;
      try {
        const response = await fetch(event.request);
        if (response.ok && APP_ROUTES.includes(url.pathname)) {
          const cache = await caches.open(CACHE);
          await cache.put(route, response.clone());
          await cache.put(APP_SHELL, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(route, { ignoreVary: true })) || (await caches.match(APP_SHELL, { ignoreVary: true })) || Response.error();
      }
    })());
    return;
  }
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then(hit => hit || fetch(event.request).then(response => { if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone())); return response; })));
});

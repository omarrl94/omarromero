// Service worker mínimo: cachea el shell para uso sin conexión.
const C = 'guardia24h-v1';
self.addEventListener('install', (e) => e.waitUntil(caches.open(C).then((c) => c.addAll(['/', '/icono.svg']))));
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => { const k = r.clone(); caches.open(C).then((c) => c.put(e.request, k)); return r; }).catch(() => caches.match(e.request).then((m) => m || caches.match('/'))));
});

// Service worker de CodeForge: el juego funciona sin conexión una vez visitado.
//  · la página (index.html): primero la red, para recibir siempre la última versión; sin red, la copia guardada
//  · /assets/ (archivos con huella en el nombre, nunca cambian): primero la copia guardada
//  · resto del mismo origen: copia guardada y se renueva en segundo plano
// Firebase y cualquier otro dominio no se tocan.
const CACHE = 'codeforge-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// La página avisa de lo que ya ha descargado para guardarlo desde la primera visita.
self.addEventListener('message', (event) => {
  const urls = event.data && event.data.type === 'precache' ? event.data.urls : null;
  if (!Array.isArray(urls)) return;
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(urls.filter((u) => u.startsWith(self.location.origin)).map(async (u) => {
      if (await cache.match(u, { ignoreVary: true })) return;
      try { const r = await fetch(u); if (r.ok) await cache.put(u, r); } catch { /* sin red */ }
    }));
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await fetch(req);
        const shell = /\/(index\.html)?$/.test(url.pathname);
        if (fresh.ok) cache.put(shell ? new URL('./', self.registration.scope).href : req, fresh.clone());
        return fresh;
      } catch {
        return (await cache.match(req, { ignoreSearch: true, ignoreVary: true })) || (await cache.match(new URL('./', self.registration.scope).href)) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreVary: true });
    const refresh = () => fetch(req).then((r) => { if (r.ok) cache.put(req, r.clone()); return r; });
    if (hit) {
      if (!url.pathname.includes('/assets/')) event.waitUntil(refresh().catch(() => {}));
      return hit;
    }
    return refresh();
  })());
});

/* Service worker de Posesiones CBT.
   Estrategia: la app tiene que arrancar SIEMPRE, con o sin cobertura en el pabellón.
   - Precarga todo en la instalación.
   - Sirve desde caché al instante y actualiza en segundo plano (stale-while-revalidate).
   - Nunca deja que un fallo de red bloquee el arranque. */

const VERSION = '1.0.2';
const CACHE = 'cbt-posesiones-' + VERSION;

const ASSETS = [
  './',
  './index.html',
  './manual.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // addAll falla entero si un recurso falla; los pedimos de uno en uno para
    // que un icono perdido no impida instalar la app.
    await Promise.all(ASSETS.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res && res.ok) await cache.put(url, res);
      } catch (e) { /* se reintentará en el primer fetch */ }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE ? caches.delete(k) : null)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.disable(); } catch (e) {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
  if (event.data === 'GET_VERSION' && event.source) event.source.postMessage({ version: VERSION });
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Sin conexión no se intenta la red siquiera: el intento fallido hace que iOS
  // saque su aviso de "Desactiva el modo Avión" por encima de la app.
  const offline = (self.navigator && self.navigator.onLine === false);

  // Cualquier navegación (arranque de la app, recarga, vuelta desde segundo plano)
  // se resuelve con el index cacheado. Sin red, arranca igual.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      // Si la navegación apunta a un documento que ya tenemos (el manual, por
      // ejemplo), se sirve ese. El index solo es el recurso de reserva: sin este
      // orden, cualquier navegación devolvería la app y el manual no se vería.
      const cached = (await cache.match(req, { ignoreSearch: true }))
        || (await cache.match('./index.html'))
        || (await cache.match('./'));
      if (cached && offline) return cached;
      const fresh = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await fresh) || new Response(
        '<meta charset="utf-8"><body style="background:#15120e;color:#f3ece0;font:16px -apple-system,sans-serif;padding:32px;text-align:center">Sin conexión y sin copia en caché todavía. Abre la app una vez con datos o wifi.</body>',
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached && offline) return cached;
    const fresh = fetch(req).then((res) => {
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || (await fresh) || Response.error();
  })());
});

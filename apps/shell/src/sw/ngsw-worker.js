/*
 * Safety / kill-switch service worker.
 *
 * The shell no longer uses a service worker, but earlier deployments registered an
 * Angular service worker (ngsw) at /ngsw-worker.js. That stale worker stays active
 * in users' browsers and caches the app shell + API responses — so it keeps serving
 * old failures (e.g. "0 Unknown Error" for /idp-app/api/cycles) even after the
 * backend is healthy and refreshes don't clear it.
 *
 * Serving THIS file at the same /ngsw-worker.js path makes the browser's SW update
 * check pick it up, install it, then on activate: clear all caches, unregister
 * itself, and reload open tabs — so every browser self-heals and no SW remains.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (e) { /* ignore */ }

    try { await self.registration.unregister(); } catch (e) { /* ignore */ }

    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      try { client.navigate(client.url); } catch (e) { /* ignore */ }
    }
  })());
});

// Always go to the network; never serve a cached response.
self.addEventListener('fetch', () => { /* no-op — let the request hit the network */ });

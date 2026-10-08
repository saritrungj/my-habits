importScripts('/pwa-assets.js');
const CACHE = `myhabit-shell-${self.MYHABIT_BUILD}`;
const SHELL = '/offline-shell';
const ASSETS = [...self.MYHABIT_ASSETS, '/icon.svg', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS.map(url => new Request(url, { credentials: 'omit' })));
    const shell = await fetch(SHELL, { credentials: 'omit' });
    if (!shell.ok) throw new Error('Offline shell is unavailable');
    await cache.put(SHELL, shell);
    // An update waits until the old app closes; active forms and timers are preserved.
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('myhabit-shell-') && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate' && !url.pathname.startsWith('/auth/')) {
    event.respondWith((async () => {
      try { return await fetch(event.request, { signal: AbortSignal.timeout(4000) }); }
      catch { return await caches.match(SHELL) || new Response('Offline. Reconnect and reload Myhabit.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
    })());
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request, { ignoreSearch: true }).then(response => response || fetch(event.request)));
  }
  // Account responses, auth links, API data and personal records never enter this cache.
});

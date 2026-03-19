const CACHE_NAME = 'cat-pwa-v1';

// App shell resources to cache for offline / faster loads.
const APP_SHELL = [
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => {
      // Activate the new SW immediately.
      self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key))));
    }).then(() => {
      self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // For cross-origin requests (like the cat API), do a network-first approach.
  if (url.origin !== self.location.origin) {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Cache-first for our own app shell.
      const cached = await cache.match(req);
      if (cached) return cached;

      // Otherwise, try the network and cache successful responses when appropriate.
      try {
        const fresh = await fetch(req);
        // Cache only GET, and only for same-origin HTML/app shell requests.
        if (fresh && fresh.status === 200 && (req.mode === 'navigate' || url.pathname.endsWith('.html'))) {
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (e) {
        // Fall back to cached app shell (keeps install/offline UX reasonable).
        return caches.match('/index.html');
      }
    })()
  );
});


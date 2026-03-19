const CACHE_NAME = 'cat-pwa-v1';

// GitHub Pages often hosts the site under a sub-path (e.g. /pablocat/).
// Derive the app base from the SW location so cached URLs resolve correctly.
const BASE_PATH = new URL('./', self.location.href).pathname; // e.g. /pablocat/
const BASE_URL = `${self.location.origin}${BASE_PATH}`; // e.g. https://selloa.github.io/pablocat/

// App shell resources to cache for offline / faster loads.
const APP_SHELL = [
  `${BASE_URL}index.html`,
  `${BASE_URL}manifest.webmanifest`,
  `${BASE_URL}icons/icons8-cat-ios-17-outlined-16.png`,
  `${BASE_URL}icons/icons8-cat-ios-17-outlined-32.png`,
  `${BASE_URL}icons/icons8-cat-ios-17-outlined-96.png`,
  `${BASE_URL}og-preview.png`,
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
      fetch(req).catch(() => caches.match(`${BASE_URL}index.html`))
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
        return caches.match(`${BASE_URL}index.html`);
      }
    })()
  );
});


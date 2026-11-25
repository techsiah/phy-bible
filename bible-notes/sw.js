/* Offline shell. Firestore keeps its own offline cache; this worker only caches
   the static app so the cover and calendar open without a network.

   App files use network-first so a deploy is picked up on the next load. Vendor
   SDK files are versioned and immutable, so they stay cache-first. */
const CACHE = 'xmas2026-shell-v26';

const ASSETS = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'icon.png',
  'icon-1024.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'firebase-config.js',
  'js/app.js',
  'js/pwa.js',
  'js/config.js',
  'js/plan.js',
  'js/plan-ml.js',
  'js/refs.js',
  'js/streak.js',
  'js/store.js',
  'js/notes.js',
  'js/select.js',
  'js/backend.js',
  'vendor/firebase/firebase-app-compat.js',
  'vendor/firebase/firebase-auth-compat.js',
  'vendor/firebase/firebase-firestore-compat.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function put(request, response) {
  if (!response || !response.ok) return;
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  } catch (err) {
    // Quota or an opaque response; offline caching is best-effort.
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    await put(request, response);
    return response;
  } catch (err) {
    return Response.error();
  }
}

async function networkFirst(event, request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);

  const network = fetch(request, { cache: 'no-cache' })
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  if (!cached) {
    const response = await network;
    if (response) return response;
    if (request.mode === 'navigate') {
      const shell = await cache.match('index.html');
      if (shell) return shell;
    }
    return Response.error();
  }

  // Do not let a slow connection block an already-cached app shell.
  const response = await Promise.race([
    network,
    new Promise((resolve) => setTimeout(() => resolve(null), 3000))
  ]);

  if (response) return response;
  event.waitUntil(network);
  return cached;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes('/vendor/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(event, request));
});

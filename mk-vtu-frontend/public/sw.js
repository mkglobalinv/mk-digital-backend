const CACHE_NAME = 'app-cache-v5';
const STATIC_ASSETS = [
  '/index.html',
  '/offline.html',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API calls, auth, and external domains
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/auth') || request.method !== 'GET') {
    return;
  }

  // Handle Navigation requests (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Handle Static Assets (JS, CSS, Images, Fonts) - Stale While Revalidate
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2', '.webp'];
  const isStatic = staticExtensions.some(ext => url.pathname.endsWith(ext));

  if (isStatic) {
    event.respondWith(
      caches.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => null);
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Default Fallback
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).catch(() => {
        if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

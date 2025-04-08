// Define the version
const CACHE_VERSION = 'v1.0.8';
const CACHE_NAME = `gig-logger-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-cache-${CACHE_VERSION}`;

// Files to cache during installation
const FILES_TO_CACHE = [
  '/', // Root page
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/offline.html', // Offline fallback page
];

// Install event
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing version: ${CACHE_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(FILES_TO_CACHE).catch((error) => {
        console.error('[Service Worker] Failed to cache files during install:', error);
      });
    })
  );
});

// Activate event with cache cleanup
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] Activating version: ${CACHE_VERSION}`);
  const CACHE_WHITELIST = [CACHE_NAME, RUNTIME_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (!CACHE_WHITELIST.includes(cache)) {
            console.log(`[Service Worker] Deleting old cache: ${cache}`);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Log the request URL
  console.log(`[Service Worker] Fetching: ${request.url}`);

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Serve cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Fetch from network and cache dynamically
      return fetch(request)
        .then((networkResponse) => {
          if (request.url.startsWith(self.location.origin)) {
            return caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Handle navigation requests when offline
          if (request.mode === 'navigate') {
            return caches.match('/index.html'); // Serve index.html for SPA navigation
          }

          // Fallback to offline.html for other requests
          return caches.match('/offline.html');
        });
    })
  );
});
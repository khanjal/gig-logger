// Define the version
const CACHE_VERSION = 'v1.0.4';
const CACHE_NAME = `gig-logger-cache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-cache-${CACHE_VERSION}`;

// Files to cache during installation
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/main.js'
];

// Install event
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Installing version: ${CACHE_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[Service Worker] Caching app shell');
      await cache.addAll(FILES_TO_CACHE);

      // Dynamically cache all files in the assets directory
      const assetsResponse = await fetch('/assets/');
      if (assetsResponse.ok) {
        const assetsText = await assetsResponse.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(assetsText, 'text/html');
        const assetLinks = Array.from(doc.querySelectorAll('a'))
          .map(link => link.href)
          .filter(href => href.includes('/assets/'));

        await Promise.all(assetLinks.map(asset => cache.add(asset)));
      }
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
  
    // Cache Google Material Icons stylesheet
    if (request.url.includes('https://fonts.googleapis.com/icon?family=Material+Icons')) {
      event.respondWith(
        caches.open(RUNTIME_CACHE).then((cache) => {
          return cache.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
  
            return fetch(request).then((networkResponse) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          });
        })
      );
    } else if (request.url.includes('/assets/')) {
      // Serve assets from the cache
      event.respondWith(
        caches.open(RUNTIME_CACHE).then((cache) => {
          return cache.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
  
            return fetch(request).then((networkResponse) => {
              cache.put(request, networkResponse.clone());
              return networkResponse;
            });
          });
        })
      );
    } else {
      // Default behavior for other requests
      event.respondWith(
        caches.match(request).then((response) => {
          return response || fetch(request);
        })
      );
    }
  });
// Inline logger for consistent format (matches LoggerService)
const logger = {
  info: (msg, ...args) => console.info(`[INFO]: ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN]: ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR]: ${msg}`, ...args),
  log: (msg, ...args) => console.log(`[LOG]: ${msg}`, ...args)
};

// Define the version and cache names
const CACHE_VERSION = 'v1.0.9';
const STATIC_CACHE = `static-cache-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-cache-${CACHE_VERSION}`;
const API_CACHE = `api-cache-${CACHE_VERSION}`;
const SYNC_QUEUE = 'sync-queue';

// Configure cache strategies
const CACHE_STRATEGIES = {
  STATIC: {
    name: STATIC_CACHE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  DYNAMIC: {
    name: DYNAMIC_CACHE,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  API: {
    name: API_CACHE,
    maxAge: 60 * 60 * 1000, // 1 hour
  }
};

// Files to cache during installation
const FILES_TO_CACHE = [
  '/', // Root page
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/offline.html',
  '/assets/icons/**/*',
  '/assets/images/**/*',
  '/assets/json/**/*',
  '/*.css',
  '/*.js'
];

// Helper function to check if a response is valid
function isValidResponse(response) {
  return response && response.status === 200 && response.type === 'basic';
}

// Helper function to determine if a request should be cached
function shouldCache(request) {
  return (request.method === 'GET' && !request.url.includes('/api/'));
}

// Install event
self.addEventListener('install', (event) => {
  logger.info(`Service Worker - Installing version: ${CACHE_VERSION}`);
  
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_STRATEGIES.STATIC.name).then((cache) => {
      logger.info('Service Worker - Caching app shell and static assets');
      return cache.addAll(FILES_TO_CACHE).catch((error) => {
        logger.error('Service Worker - Failed to cache files during install:', error);
      });
    })
  );
});

// Activate event with cache cleanup
self.addEventListener('activate', (event) => {
  logger.info(`Service Worker - Activating version: ${CACHE_VERSION}`);
  const CACHE_WHITELIST = [
    CACHE_STRATEGIES.STATIC.name,
    CACHE_STRATEGIES.DYNAMIC.name,
    CACHE_STRATEGIES.API.name
  ];

  // Take control of all clients immediately
  event.waitUntil(Promise.all([
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!CACHE_WHITELIST.includes(cacheName)) {
            logger.info(`Service Worker - Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }),
    // Take control of all clients
    self.clients.claim()
  ]));
});

// Fetch event with improved caching strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests or browser-sync requests
  if (request.method !== 'GET' || request.url.includes('browser-sync')) {
    return;
  }

  // Different strategies for different types of requests
  if (request.url.includes('/api/')) {
    // API requests: Network first, then cache
    event.respondWith(handleApiRequest(request));
  } else if (request.headers.get('accept').includes('text/html')) {
    // HTML requests: Cache first for faster loading, then network update
    event.respondWith(handleHtmlRequest(request));
  } else {
    // Static assets: Cache first with network fallback
    event.respondWith(handleStaticRequest(request));
  }
});

// Handle API requests
async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    if (isValidResponse(response)) {
      const cache = await caches.open(CACHE_STRATEGIES.API.name);
      cache.put(request, response.clone());
      return response;
    }
  } catch (error) {
    // If offline, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // If the request fails and it's a mutation (POST/PUT/DELETE),
    // add it to the background sync queue
    if (request.method !== 'GET') {
      await addToSyncQueue(request);
    }
  }
  return new Response('{"error": "Unable to fetch data"}', {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle HTML requests with stale-while-revalidate strategy
async function handleHtmlRequest(request) {
  // Try cache first for fast response
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request)
    .then(networkResponse => {
      if (isValidResponse(networkResponse)) {
        caches.open(CACHE_STRATEGIES.DYNAMIC.name).then(cache => {
          cache.put(request, networkResponse.clone());
        });
        return networkResponse;
      }
      return null;
    })
    .catch(() => null);

  // If we have a cached response, return it immediately and update cache in background
  if (cachedResponse) {
    fetchPromise.catch(() => {}); // Fire and forget
    return cachedResponse;
  }

  // If no cache, wait for network
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }

  // If both fail, serve offline page
  const offlineResponse = await caches.match('/offline.html');
  if (offlineResponse) {
    logger.info('Service Worker - Serving offline page');
    return offlineResponse;
  }

  // Last resort - return a basic HTML response
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>App Loading...</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:Arial,sans-serif;">
        <div style="text-align:center;">
          <h2>Loading Application...</h2>
          <p>Please wait while the app loads, or <a href="javascript:location.reload()">refresh the page</a>.</p>
        </div>
      </div>
    </body>
    </html>
  `, {
    status: 200,
    headers: { 'Content-Type': 'text/html' }
  });
}

// Handle static asset requests
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fall back to network
  try {
    const response = await fetch(request);
    if (isValidResponse(response)) {
      const cache = await caches.open(CACHE_STRATEGIES.STATIC.name);
      cache.put(request, response.clone());
      return response;
    }
  } catch (error) {
    logger.error('Service Worker - Failed to fetch static asset:', error);
  }
  
  return new Response('Not Found', { status: 404 });
}

// Background sync for offline mutations
async function addToSyncQueue(request) {
  try {
    const db = await openDB();
    await db.add(SYNC_QUEUE, {
      url: request.url,
      method: request.method,
      body: await request.clone().text(),
      timestamp: Date.now()
    });
    // Register for sync if supported
    if ('sync' in self.registration) {
      await self.registration.sync.register('sync-gig-data');
    }
  } catch (error) {
    logger.error('Service Worker - Failed to add to sync queue:', error);
  }
}

// Update cache in the background
async function updateCache(request) {
  try {
    const response = await fetch(request);
    if (isValidResponse(response)) {
      const cache = await caches.open(CACHE_STRATEGIES.DYNAMIC.name);
      await cache.put(request, response);
    }
  } catch (error) {
    logger.error('Service Worker - Background cache update failed:', error);
  }
}

// Background sync event handler
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-gig-data') {
    event.waitUntil(syncData());
  }
});
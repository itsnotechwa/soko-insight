// Service Worker for SokoInsight PWA
const CACHE_NAME = 'soko-insight-v1';
const RUNTIME_CACHE = 'soko-insight-runtime-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[Service Worker] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim(); // Take control of all pages
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension:// URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // API requests - network first, cache fallback for offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response for caching
          const responseToCache = response.clone();
          
          // Only cache successful GET requests
          if (response.status === 200 && request.method === 'GET') {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Return offline response for API calls
            return new Response(
              JSON.stringify({
                error: 'Offline - This request will be synced when you come back online',
                offline: true,
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-offline-requests') {
    event.waitUntil(syncOfflineRequests());
  }
});

// Sync offline requests when back online
async function syncOfflineRequests() {
  try {
    // This will be handled by the IndexedDB sync logic in the app
    // The service worker just triggers the sync
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_OFFLINE_REQUESTS' });
    });
  } catch (error) {
    console.error('[Service Worker] Error syncing offline requests:', error);
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  // Handle push notifications here
});


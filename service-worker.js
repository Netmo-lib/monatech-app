// Service Worker for MONA-TECH PWA
// Updated for GitHub Pages deployment
const CACHE_NAME = 'monatech-v1.0.1';
const BASE_PATH = '/monatech-app'; // Your GitHub Pages path

const urlsToCache = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('✅ Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache opened');
        return cache.addAll(urlsToCache).catch(err => {
          console.error('❌ Failed to cache:', err);
          // Continue even if some files fail to cache
          return Promise.resolve();
        });
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch with cache fallback
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(error => {
          console.log('❌ Fetch failed; returning offline page instead.', error);
          // You could return a custom offline page here
        });
      })
  );
});

// Activate and clean old caches
self.addEventListener('activate', event => {
  console.log('✅ Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients immediately
  return self.clients.claim();
});

// Push notifications
self.addEventListener('push', event => {
  console.log('📬 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update from MonaTech!',
    icon: BASE_PATH + '/icon-192.png',
    badge: BASE_PATH + '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: BASE_PATH + '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: BASE_PATH + '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('MONA-TECH PRINTS', options)
  );
});

// Notification click
self.addEventListener('notificationclick', event => {
  console.log('🖱️ Notification clicked');
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(BASE_PATH + '/')
    );
  }
});

// Background Sync (for offline data sync)
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered');
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

async function syncTransactions() {
  // This would sync any pending transactions when back online
  console.log('💾 Syncing transactions...');
  // Implementation would go here
}

// Message handling
self.addEventListener('message', event => {
  console.log('📨 Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🚀 Service Worker loaded successfully!');

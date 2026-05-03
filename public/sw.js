// ZarinGold Service Worker v4.0.1
const CACHE_NAME = 'zaringold-v4.0.1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/fonts/IRANSansWeb.woff2',
  '/fonts/IRANSansWeb_Bold.woff2',
  '/fonts/IRANSansWeb_Medium.woff2',
];

// API routes that should use network-first strategy
const API_ROUTES = [
  '/api/gold/prices',
  '/api/gold/realtime',
  '/api/gold/market/analysis',
  '/api/auth/me',
  '/api/notifications',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  // Activate immediately without waiting
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Helper: check if request is an API call
function isApiRequest(url) {
  return API_ROUTES.some((route) => url.pathname.startsWith(route));
}

// Helper: check if request is for a static asset
function isStaticAsset(url) {
  const staticExtensions = [
    '.js', '.css', '.woff2', '.woff', '.ttf', '.eot',
    '.png', '.jpg', '.jpeg', '.svg', '.gif', '.ico',
    '.webp', '.avif', '.mp4', '.webm',
  ];
  return staticExtensions.some((ext) => url.pathname.endsWith(ext));
}

// Network-first strategy for API calls
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline fallback for API requests
    return new Response(
      JSON.stringify({ error: 'شما آفلاین هستید', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Cache-first strategy for static assets
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for static asset:', request.url);
    // Return a basic offline response for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      const cachedIndex = await caches.match('/');
      if (cachedIndex) {
        return cachedIndex;
      }
    }
    return new Response('Offline', { status: 503 });
  }
}

// Stale-while-revalidate for navigation requests
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then((c) => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, return cache if available
    return cachedResponse;
  });

  return cachedResponse || fetchPromise;
}

// Fetch event - route requests to appropriate strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (except same-origin API calls)
  if (url.origin !== location.origin) return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Route to appropriate strategy
  if (isApiRequest(url)) {
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  } else if (request.mode === 'navigate') {
    // Navigation requests (HTML pages)
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Handle offline fallback for navigation
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/') || new Response(
          '<!DOCTYPE html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>زرین گلد - آفلاین</title><style>body{background:#0a0a0a;color:#D4AF37;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;padding:2rem}h1{font-size:1.5rem;margin-bottom:0.5rem}p{color:#888;font-size:0.9rem}</style></head><body><div><h1>اتصال اینترنت برقرار نیست</h1><p>لطفاً اتصال اینترنت خود را بررسی کنید</p></div></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
    );
  }
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});

// ZarinGold Service Worker — DISABLED for development
// This is a no-op service worker that immediately unregisters itself.
// The real PWA service worker will be enabled in production builds.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
  // Unregister all service workers
  self.registration.unregister().then(() => {
    console.log('[SW] Service worker unregistered (dev mode)');
  });
  // Clear all caches
  caches.keys().then((names) => {
    names.forEach((name) => caches.delete(name));
  });
});

// Pass through all fetch requests (no caching)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

// Minimal service worker that doesn't cause white screen issues
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  self.clients.claim();
});

// Removed empty fetch handler to eliminate "no-op" warning and navigation overhead

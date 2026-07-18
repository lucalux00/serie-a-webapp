const CACHE_NAME = 'serie-a-pwa-cache-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.jpg',
  '/icon-512x512.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // Forza l'attivazione immediata
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // Pulisce le vecchie cache
          }
        })
      );
    }).then(() => self.clients.claim()) // Prende controllo immediato dei client
  );
});

self.addEventListener('fetch', event => {
  // Network First Strategy
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Aggiorna la cache se la richiesta va a buon fine
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback alla cache in caso di errore (offline)
        return caches.match(event.request);
      })
  );
});

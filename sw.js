const CACHE_NAME = 'anime-diib-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/contact.html',
  '/privacy.html',
  '/css/style.css',
  '/assets/icons/favicon.svg',
  '/assets/icons/favicon.png',
  '/assets/images/logo.svg',
  '/assets/images/logo.png',
  '/assets/images/screen1.jpg',
  '/assets/images/screen2.jpg',
  '/assets/images/screen3.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});

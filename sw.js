const CACHE_NAME = 'anime-diib-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/contact.html',
  '/privacy.html',
  '/style.css',
  '/favicon.png',
  '/logo.png',
  '/screen1.jpg',
  '/screen2.jpg',
  '/screen3.jpg'
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


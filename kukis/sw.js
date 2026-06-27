const CACHE_NAME = 'c8l-casino-v1';
const ASSETS = [
  '/kukis/c8l_casino_kukis.html',
  '/kukis/games/bingo_c8l.html',
  '/kukis/games/crash_rugido.html',
  '/kukis/games/daily_bonus.html',
  '/kukis/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});

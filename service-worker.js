const CACHE = 'studynova-chinese-v9-review-v2';
const PRECACHE = [
  './', './index.html', './chinesemaster_writing_vault.html', './offline.html',
  './assets/styles.css', './assets/app.js', './assets/review.js', './assets/quick-import.js',
  './assets/i18n.js', './assets/pwa.js', './manifest.webmanifest',
  './novalab-chinese-4-icons/icon-192.png', './novalab-chinese-4-icons/icon-512.png',
  './novalab-chinese-4-icons/icon-maskable-512.png'
];
const UPDATE_FIRST = new Set(['/assets/app.js', '/assets/review.js', '/assets/styles.css', '/assets/quick-import.js']);
self.addEventListener('install', event => event.waitUntil(
  caches.open(CACHE).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put('./index.html', copy));
      return response;
    }).catch(() => caches.match('./index.html').then(response => response || caches.match('./offline.html'))));
    return;
  }
  if (UPDATE_FIRST.has(url.pathname)) {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, response.clone()));
      return response;
    }).catch(() => caches.match(event.request, {ignoreSearch: true})));
    return;
  }
  if (!PRECACHE.some(path => url.pathname.endsWith(path.replace('./', '/')))) return;
  event.respondWith(caches.match(event.request, {ignoreSearch: true}).then(cached => cached || fetch(event.request)));
});

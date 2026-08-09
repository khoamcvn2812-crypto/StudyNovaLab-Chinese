const CACHE = 'studynova-chinese-v4';
const PRECACHE = [
  './', './index.html', './chinesemaster_writing_vault.html', './offline.html',
  './assets/styles.css', './assets/app.js', './assets/i18n.js', './assets/pwa.js',
  './manifest.webmanifest', './novalab-chinese-4-icons/icon-192.png',
  './novalab-chinese-4-icons/icon-512.png', './novalab-chinese-4-icons/icon-maskable-512.png'
];
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
    event.respondWith(fetch(event.request).catch(() => caches.match('./offline.html')));
    return;
  }
  if (!PRECACHE.some(path => url.pathname.endsWith(path.replace('./', '/')))) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});

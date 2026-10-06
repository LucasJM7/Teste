const CACHE_NAME = 'crechenow-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './pages/dashboard-parent.html',
  './pages/dashboard-staff.html',
  './pages/dashboard-teacher.html',
  './assets/css/main.css',
  './assets/css/components.css',
  './assets/js/app.js',
  './assets/js/auth.js',
  './assets/js/notifications.js',
  './assets/js/storage.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/') || e.request.url.includes('/data/')) {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({ error: 'Offline' }), { headers: { 'Content-Type': 'application/json' } })));
  } else {
    e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
  }
});

self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'CrecheNow', body: 'Nova mensagem' };
  e.waitUntil(self.registration.showNotification(data.title, { body: data.body, icon: './assets/img/icons/icon-192x192.png' }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow('./pages/dashboard-parent.html'));
});

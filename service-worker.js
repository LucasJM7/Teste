const CACHE_NAME = 'crechenow-v2';

// Usar caminhos RELATIVOS (./) para funcionar no GitHub Pages
const STATIC_ASSETS = [
  './',
  './index.html',
  './pages/dashboard-parent.html',
  './pages/dashboard-staff.html',
  './pages/dashboard-teacher.html',
  './assets/css/main.css',
  './assets/css/components.css',
  './assets/js/storage.js',
  './assets/js/auth.js',
  './assets/js/notifications.js',
  './assets/js/app.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

// Instalação: Precache app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache aberto:', CACHE_NAME);
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação: Limpa caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Removendo cache antigo:', key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache-first para estáticos
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/') || e.request.url.includes('/data/')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((res) => res || fetch(e.request))
    );
  }
});

// Push notifications
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'CrecheNow', body: 'Nova mensagem' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './assets/img/icons/icon-192x192.png'
    })
  );
});

// Clique na notificação
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.openWindow('./pages/dashboard-parent.html')
  );
});

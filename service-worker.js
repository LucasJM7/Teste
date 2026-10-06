const CACHE_NAME = 'crechenow-v2';

// Usar caminhos relativos (./) para funcionar em qualquer subdiretório do GitHub Pages
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

// Instalação: Precache app shell (baixa os arquivos para funcionar offline)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache aberto e precacheando arquivos');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Força a ativação imediata do novo Service Worker
});

// Ativação: Limpa caches antigos para evitar conflitos e liberar espaço
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
  self.clients.claim(); // Assume o controle das páginas abertas imediatamente
});

// Fetch: Cache-first para estáticos, Network-first para dados, fallback offline seguro
self.addEventListener('fetch', (e) => {
  // Se for uma requisição de API ou dados, tenta a rede primeiro
  if (e.request.url.includes('/api/') || e.request.url.includes('/data/')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        // Fallback seguro se estiver offline (evita erro 404 de offline.html inexistente)
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
  } else {
    // Para arquivos estáticos: tenta o cache primeiro, se não tiver, vai para a rede
    e.respondWith(
      caches.match(e.request).then((res) => {
        return res || fetch(e.request);
      })
    );
  }
});

// Push notifications (simulado para MVP)
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : { title: 'CrecheNow', body: 'Nova mensagem' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      // Caminho relativo para o ícone
      icon: './assets/img/icons/icon-192x192.png'
    })
  );
});

// Ao clicar na notificação, abre o dashboard correto
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    // Caminho relativo para o dashboard
    clients.openWindow('./pages/dashboard-parent.html')
  );
});

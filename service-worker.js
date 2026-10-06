/* ============================================================
   SERVICE WORKER - CrecheNow
   Responsável por: cache de arquivos, funcionamento offline
   e recebimento de notificações push.
   ============================================================ */

/* Nome do cache: altere para forçar atualização dos arquivos */
const CACHE_NAME = 'crechenow-v1';

/* Lista de arquivos essenciais (app shell) */
const STATIC_ASSETS = [
  '/',                              /* Raiz do site */
  '/index.html',                    /* Página de login */
  '/pages/dashboard-parent.html',   /* Painel dos pais */
  '/pages/dashboard-staff.html',    /* Painel da secretaria */
  '/pages/dashboard-teacher.html',  /* Painel do professor */
  '/assets/css/main.css',           /* Estilos principais */
  '/assets/css/components.css',     /* Componentes visuais */
  '/assets/js/storage.js',          /* Gerenciamento de dados */
  '/assets/js/auth.js',             /* Autenticação */
  '/assets/js/notifications.js',    /* Renderização e UI */
  '/assets/js/app.js',              /* Orquestração */
  /* Bootstrap via CDN */
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js'
];

/* ----------------------------------------------------------
   INSTALAÇÃO: baixa todos os arquivos estáticos para o cache
   ---------------------------------------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cache aberto:', CACHE_NAME);
      return cache.addAll(STATIC_ASSETS);
    })
  );
  /* Força o novo SW a assumir imediatamente */
  self.skipWaiting();
});

/* ----------------------------------------------------------
   ATIVAÇÃO: remove caches antigos para liberar espaço
   ---------------------------------------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Removendo cache antigo:', key);
            return caches.delete(key);
          })
      );
    })
  );
  /* Assume controle das páginas abertas */
  self.clients.claim();
});

/* ----------------------------------------------------------
   FETCH: decide de onde buscar cada requisição
   - Estáticos: cache-first (rápido)
   - API/dados: network-first (sempre atualizado)
   ---------------------------------------------------------- */
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  /* Se for requisição de API, tenta rede primeiro */
  if (url.includes('/api/') || url.includes('/data/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        /* Se offline, retorna fallback */
        return caches.match('/offline.html');
      })
    );
    return;
  }

  /* Para estáticos: cache primeiro, rede como fallback */
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});

/* ----------------------------------------------------------
   PUSH: recebe notificações do servidor (preparado para futuro)
   ---------------------------------------------------------- */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'CrecheNow', {
      body: data.body || 'Nova mensagem',
      icon: '/assets/img/icons/icon-192x192.png',
      badge: '/assets/img/icons/icon-192x192.png'
    })
  );
});

/* ----------------------------------------------------------
   NOTIFICATION CLICK: abre a página correta ao tocar na notificação
   ---------------------------------------------------------- */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/pages/dashboard-parent.html')
  );
});

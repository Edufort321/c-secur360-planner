// ============== SERVICE WORKER PWA - C-SECUR360 PLANIFICATEUR ==============
// Gestion du cache pour fonctionnement offline

// Version automatique bas�e sur la date de build - change � chaque d�ploiement
const BUILD_VERSION = '__BUILD_VERSION__'; // Sera remplac� au build
const CACHE_NAME = `c-secur360-planner-${BUILD_VERSION}`;
const RUNTIME_CACHE = `c-secur360-runtime-${BUILD_VERSION}`;

// Fichiers � mettre en cache lors de l'installation
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mise en cache des fichiers');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requ�tes r�seau
self.addEventListener('fetch', (event) => {
  // Ignorer les requ�tes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorer les requ�tes vers des domaines externes (API, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Retourner la r�ponse en cache si disponible
        if (cachedResponse) {
          return cachedResponse;
        }

        // Sinon, faire la requ�te r�seau
        return fetch(event.request)
          .then((response) => {
            // Ne pas mettre en cache les r�ponses invalides
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Cloner la r�ponse car elle ne peut �tre consomm�e qu'une fois
            const responseToCache = response.clone();

            // Mettre en cache la r�ponse pour les futures requ�tes
            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // En cas d'erreur r�seau, retourner une page offline si disponible
            return caches.match('/index.html');
          });
      })
  );
});

// Gestion des messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Notification de mise � jour disponible
self.addEventListener('controllerchange', () => {
  console.log('[Service Worker] Nouvelle version d�tect�e');
});

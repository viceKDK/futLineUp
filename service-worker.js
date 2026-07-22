const CACHE_VERSION = 'futbolclub-v20';
const APP_SHELL = [
  './futbolClub.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './src/icons.jsx',
  './src/data.jsx',
  './src/supabase.jsx',
  './src/kits.jsx',
  './src/pitch.jsx',
  './src/sidebar.jsx',
  './src/page-auth.jsx',
  './src/page-home.jsx',
  './src/page-mode.jsx',
  './src/page-editor.jsx',
  './src/page-draw.jsx',
  './src/page-kits.jsx',
  './src/page-rival.jsx',
  './src/page-share.jsx',
  './src/page-platform.jsx',
];
const OPTIONAL_EXTERNAL = [
  'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://unpkg.com/react@18.3.1/umd/react.development.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Archivo+Narrow:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(APP_SHELL);
    await Promise.allSettled(OPTIONAL_EXTERNAL.map(async url => {
      const response = await fetch(url, { mode: 'cors' });
      if (response.ok) await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestURL = new URL(event.request.url);
  if (requestURL.origin === self.location.origin && requestURL.pathname.endsWith('/src/local-config.js')) return;

  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        const cache = await caches.open(CACHE_VERSION);
        cache.put('./futbolClub.html', response.clone());
        return response;
      } catch (_) {
        return (await caches.match('./futbolClub.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok || response.type === 'opaque') {
        const cache = await caches.open(CACHE_VERSION);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (_) {
      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});

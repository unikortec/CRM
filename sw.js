const CACHE = 'unikor-crm-v2';
const ASSETS = [
  './index.html','./manifest.json','./css/style.css',
  './js/app.js','./js/firebase.js','./js/auth.js','./js/guard.js','./js/db.js',
  './js/views/dashboard.js','./js/views/clientes.js','./js/views/pedidos.js','./js/views/despesas.js','./js/views/ofx.js'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=> k!==CACHE ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e)=>{
  const req = e.request;
  const url = new URL(req.url);

  // ⚠️ só lida com http/https
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // HTML → network-first
  if (req.method === 'GET' && (url.pathname.endsWith('.html') || url.pathname === '/' )) {
    e.respondWith(
      fetch(req).then(r=>{
        const copy = r.clone();
        caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
        return r;
      }).catch(()=> caches.match(req))
    );
    return;
  }

  // Demais estáticos → SWR
  if (req.method === 'GET') {
    e.respondWith(
      caches.match(req).then(cached=>{
        const fetching = fetch(req).then(r=>{
          const copy = r.clone();
          caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{});
          return r;
        }).catch(()=> cached);
        return cached || fetching;
      })
    );
  }
});

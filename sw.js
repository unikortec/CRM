const CACHE = 'unikor-crm-v1';
const ASSETS = [
  './index.html', './manifest.json',
  './css/style.css',
  './js/app.js','./js/firebase.js','./js/auth.js','./js/guard.js','./js/db.js',
  './js/views/dashboard.js','./js/views/clientes.js','./js/views/pedidos.js','./js/views/despesas.js','./js/views/ofx.js'
];

self.addEventListener('install', (e)=> {
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e)=> {
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE?caches.delete(k):null))));
  self.clients.claim();
});

// network-first para HTML; SWR para estáticos
self.addEventListener('fetch', (e)=>{
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/crm/')) {
    e.respondWith(fetch(req).then(r=>{
      const copy=r.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); return r;
    }).catch(()=>caches.match(req)));
  } else {
    e.respondWith(caches.match(req).then(cached=> {
      const fetcher = fetch(req).then(r=>{
        const copy=r.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); return r;
      }).catch(()=>cached);
      return cached || fetcher;
    }));
  }
});

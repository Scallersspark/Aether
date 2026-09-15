const APP_VERSION = '9.9.2';
const CACHE_NAME = 'aether-v' + APP_VERSION;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './print.js',
  './db.js',
  './qrcode.js',
  './_p8.js',
  './_p9.js',
  './login.html',
  './login.js',
  './login.css',
  './canvasjs.min.js',
  './dexie.min.js',
  './lucide.min.js',
  './html2canvas.min.js',
  './jspdf.umd.min.js',
  './css/all.min.css',
  './webfonts/fa-brands-400.woff2',
  './webfonts/fa-regular-400.woff2',
  './webfonts/fa-solid-900.woff2',
  './manifest.json',
  './icon.svg?v=3',
  './icon-192.png?v=3',
  './icon-512.png?v=3',
  './watermark.png?v=4'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        ASSETS.map(url => cache.add(url).catch(() => {}))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.matchAll()).then(clients => {
      clients.forEach(client => client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION }));
    })
  );
  self.clients.claim();
});

function openDB() {
  return new Promise((resolve, reject) => {
    var req = indexedDB.open('AetherPDFs', 1);
    req.onupgradeneeded = function(e) { e.target.result.createObjectStore('pdfs'); };
    req.onsuccess = function(e) { resolve(e.target.result); };
    req.onerror = function(e) { reject(e); };
  });
}

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  if (url.origin === location.origin && url.searchParams.has('download')) {
    var docId = url.searchParams.get('download');
    var fname = url.searchParams.get('name') || 'Aether_Document';
    e.respondWith(
      openDB().then(db => {
        return new Promise((resolve) => {
          if (!db.objectStoreNames.contains('pdfs')) {
            resolve(new Response('Document not found. Please open this link on the device where the document was generated.', { status: 404, headers: { 'Content-Type': 'text/plain' } }));
            return;
          }
          var tx = db.transaction('pdfs', 'readonly');
          var get = tx.objectStore('pdfs').get(docId);
          get.onsuccess = function() {
            if (get.result && get.result.blob) {
              var blob = get.result.blob;
              var realName = (get.result.filename || fname) + '.pdf';
              resolve(new Response(blob, {
                headers: {
                  'Content-Type': 'application/pdf',
                  'Content-Disposition': 'attachment; filename="' + realName + '"',
                  'Content-Length': blob.size
                }
              }));
            } else {
              resolve(new Response('Document not found. Please open this link on the device where the document was generated.', { status: 404, headers: { 'Content-Type': 'text/plain' } }));
            }
          };
          get.onerror = function() {
            resolve(new Response('Error retrieving document.', { status: 500, headers: { 'Content-Type': 'text/plain' } }));
          };
        });
      }).catch(function() {
        return new Response('Service unavailable.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp && resp.status === 200) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match(e.request))
  );
});

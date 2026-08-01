// Service worker stub — adds offline caching for key assets
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('v1').then(c=>c.addAll(['/','/index.html','/css/style.css'])));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});

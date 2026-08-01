// minimal service worker placeholder - enable offline support by expanding this file
self.addEventListener('install', function(event){
  self.skipWaiting();
});
self.addEventListener('activate', function(event){
  clients.claim();
});
self.addEventListener('fetch', function(event){
  // This is intentionally minimal. Implement caching strategies as needed.
});

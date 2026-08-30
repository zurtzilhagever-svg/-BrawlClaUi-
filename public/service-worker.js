const CACHE = "brawlclaui-v62";
const ASSETS = ["/play/", "/play/style.css?v=59", "/play/play.js?v=61", "/characters/blaze.png?v=79", "/characters/boomer.png?v=79", "/characters/fangli.png?v=79", "/characters/pixel.png?v=79", "/characters/tank.png?v=79", "/characters/bazaar.png?v=79", "/characters/masterv.png?v=79", "/mobile/", "/mobile/style.css?v=36", "/mobile/controller.js?v=36", "/shared/firebase-progress.js", "/shared/gamepad.js", "/shared/qr-generator.js", "/shared/runtime.js", "/native-config.js", "/manifest.webmanifest", "/icons/icon.svg"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || event.request.url.includes("socket.io")) return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});

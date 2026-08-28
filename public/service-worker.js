const CACHE = "brawlclaui-v94";
const ASSETS = ["/play/", "/logo.png?v=65", "/icons/favicon-48.png?v=65", "/icons/icon-192.png?v=65", "/icons/icon-512.png?v=65", "/play/style.css?v=93", "/play/play.js?v=94", "/characters/blaze.png?v=62", "/characters/boomer.png?v=62", "/characters/fangli.png?v=62", "/characters/pixel.png?v=62", "/characters/tank.png?v=62", "/characters/bazaar.png?v=62", "/characters/ari.png?v=85", "/characters/skyfalcon.png?v=87", "/characters/masterv.png?v=77", "/characters/mash.png?v=62", "/mobile/", "/mobile/style.css?v=38", "/mobile/controller.js?v=38", "/shared/firebase-progress.js", "/shared/qr-generator.js", "/shared/runtime.js", "/native-config.js", "/manifest.webmanifest", "/icons/icon.svg"];
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

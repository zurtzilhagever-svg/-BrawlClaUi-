const CACHE = "brawlclaui-v108";
const ASSETS = ["/play/", "/logo.png?v=65", "/icons/favicon-48.png?v=65", "/icons/icon-192.png?v=65", "/icons/icon-512.png?v=65", "/play/style.css?v=107", "/play/play.js?v=108", "/characters/blaze.png?v=62", "/characters/boomer.png?v=62", "/characters/fangli.png?v=62", "/characters/pixel.png?v=62", "/characters/tank.png?v=62", "/characters/bazaar.png?v=62", "/characters/ari.png?v=97", "/characters/skyfalcon.png?v=98", "/characters/seashark.png?v=95", "/characters/shoopi.png?v=103", "/characters/tuli.png?v=107", "/characters/tuli-car.png?v=105", "/characters/gack.png?v=107", "/characters/gack-car.png?v=107", "/characters/masterv.png?v=77", "/characters/mash.png?v=62", "/mobile/", "/mobile/style.css?v=38", "/mobile/controller.js?v=38", "/shared/firebase-progress.js", "/shared/qr-generator.js", "/shared/runtime.js", "/native-config.js", "/manifest.webmanifest", "/icons/icon.svg"];
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

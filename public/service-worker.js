const CACHE = "brawlclaui-v59";
const ASSETS = ["/play/", "/play/style.css?v=59", "/play/play.js?v=59", "/characters/blaze.png?v=57", "/characters/boomer.png?v=57", "/characters/fangli.png?v=57", "/characters/pixel.png?v=57", "/characters/tank.png?v=57", "/characters/bazaar.png?v=57", "/characters/mash.png?v=57", "/mobile/", "/mobile/style.css?v=36", "/mobile/controller.js?v=36", "/shared/firebase-progress.js", "/shared/gamepad.js", "/shared/qr-generator.js", "/shared/runtime.js", "/native-config.js", "/manifest.webmanifest", "/icons/icon.svg"];
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

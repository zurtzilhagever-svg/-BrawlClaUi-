const CACHE = "couchbrawl-v6";
const ASSETS = ["/play/", "/play/style.css", "/play/play.js", "/shared/gamepad.js", "/shared/qr-generator.js", "/shared/runtime.js", "/native-config.js", "/manifest.webmanifest", "/icons/icon.svg"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => { if (event.request.method !== "GET" || event.request.url.includes("socket.io")) return; event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request))); });

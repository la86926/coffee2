/* Service worker ligero: la guía abre sin conexión (textos, portadas y
   cronómetros). Los videos no se guardan en caché: se piden a la red. */
const VERSION = "mi-cafe-v1.0.2";
const SHELL = [
  "./",
  "index.html",
  "css/styles.css?v=1.0.2",
  "js/app.js?v=1.0.2",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "icons/apple-touch-icon.png",
  "img/utensilios-640.webp",
  "img/utensilios-1000.webp",
  "img/u1-cacerola-pequena.webp",
  "img/u2-jarro-rojo.webp",
  "img/u3-prensa-francesa.webp",
  "img/u4-tetera.webp",
  "img/u5-cacerola-grande.webp",
  "img/u6-cuchara.webp",
  "img/completo.webp"
].concat(Array.from({ length: 10 }, (_, i) => `img/paso-${i + 1}-thumb.webp`),
         Array.from({ length: 10 }, (_, i) => `img/paso-${i + 1}-card.webp`),
         Array.from({ length: 10 }, (_, i) => `img/paso-${i + 1}.webp`));

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith(".mp4") || req.headers.has("range")) return; // videos: siempre red

  // Página: primero la red (contenido siempre actualizado), caché si no hay conexión.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put("index.html", copy));
        return res;
      }).catch(() => caches.match("index.html"))
    );
    return;
  }

  // Recursos estáticos versionados: caché primero, luego red.
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});

/* Service worker ligero: la guía abre sin conexión (textos, portadas y
   cronómetros). Los videos no se guardan en caché: se piden a la red. */
const VERSION = "mi-cafe-v1.0.10";
const SHELL = [
  "./",
  "index.html",
  "css/styles.css?v=1.0.10",
  "js/app.js?v=1.0.10",
  "manifest.webmanifest",
  "icons/icon.svg",
  "icons/icon-192.png",
  "img/utensilios-640.webp?v=3",
  "img/utensilios-1000.webp?v=3"
]; // lo mínimo: el resto de imágenes se guarda solo cuando se ve (no compite con la primera carga)

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

// Al tocar el aviso de "¡Listo!", vuelve a la pestaña de la guía.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    const c = list.find((w) => "focus" in w);
    return c ? c.focus() : self.clients.openWindow("./");
  }));
});

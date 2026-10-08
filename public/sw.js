const CACHE = "delimt-v1";
const OFFLINE_URL = "/offline.html";

const STATIC_ASSETS = [
  "/",
  "/app",
  "/offline.html",
  "/favicon.svg",
  "/manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/api/")) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => {
          if (cached) return cached;
          if (e.request.destination === "document") {
            return caches.match(OFFLINE_URL);
          }
        })
      )
  );
});

// Push notifications
self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? {};
  e.waitUntil(
    self.registration.showNotification(data.title || "delimt", {
      body: data.body || "Stay strong.",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      tag: "delimt-intervention",
      renotify: true,
      data: { url: "/app" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/app") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow("/app");
    })
  );
});
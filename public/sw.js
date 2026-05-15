/* Carte PWA — cache shell minimal uniquement (pas d’API / pas de données). */
const VERSION = "carte-shell-v1";
const OFFLINE_URL = "/offline";
const SHELL_PATHS = [OFFLINE_URL, "/manifest.webmanifest", "/icons/icon-192", "/icons/icon-512"];

function isShellPath(pathname) {
  return SHELL_PATHS.some((p) => pathname === p || pathname.startsWith(p + "?"));
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(VERSION).then((cache) =>
      cache.addAll(SHELL_PATHS).catch(() => {
        /* ignore partial precache failures */
      }),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== VERSION) return caches.delete(key);
            return undefined;
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api")) return;
  if (url.pathname.startsWith("/auth")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && (res.ok || res.type === "opaqueredirect")) return res;
          throw new Error("navigate-fail");
        })
        .catch(() =>
          caches.match(OFFLINE_URL, { ignoreSearch: true }).then(
            (cached) =>
              cached ||
              new Response("Hors ligne", {
                status: 503,
                headers: { "Content-Type": "text/plain; charset=utf-8" },
              }),
          ),
        ),
    );
    return;
  }

  if (!isShellPath(url.pathname)) return;

  event.respondWith(
    caches.open(VERSION).then((cache) =>
      cache.match(request, { ignoreSearch: true }).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res && res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    ),
  );
});

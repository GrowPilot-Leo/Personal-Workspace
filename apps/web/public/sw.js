const CACHE_NAME = "growpilot-shell-v2";
const APP_SHELL = ["/", "/dashboard", "/learning", "/icon.svg"];
const OFFLINE_DOCUMENT = `<!doctype html>
<html lang="zh-CN">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>GrowPilot · 离线</title>
  <body>
    <main>
      <h1>当前处于离线状态</h1>
      <p>这个页面还没有缓存。恢复网络后重试即可。</p>
    </main>
  </body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      } catch {
        if (request.mode === "navigate") {
          return (
            (await caches.match(request)) ||
            (await caches.match("/dashboard")) ||
            new Response(OFFLINE_DOCUMENT, {
              status: 503,
              headers: { "Content-Type": "text/html; charset=utf-8" },
            })
          );
        }

        return (
          (await caches.match(request)) ||
          new Response("Offline resource unavailable", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }
    })(),
  );
});

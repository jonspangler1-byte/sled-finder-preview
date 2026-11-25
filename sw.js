// Sled Finder service worker: Web Push only (no asset caching, so the app cannot go stale).
// Registered by the live app when a VAPID public key is set. See docs/go-live.md.
self.addEventListener("install", (event) => { self.skipWaiting(); });
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); } catch (e) {}
    await self.clients.claim();
  })());
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) {
    try { data = { body: event.data && event.data.text() }; } catch (e2) { data = {}; }
  }
  const title = data.title || "Sled Finder";
  const opts = {
    body: data.body || "There's something new in Sled Finder.",
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    data: { href: data.href || "#/notifications" },
  };
  event.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || "#/notifications";
  event.waitUntil((async () => {
    const url = new URL(href, self.registration.scope);
    const clientsArr = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of clientsArr) {
      try {
        if (c.url && new URL(c.url).origin === url.origin && "focus" in c) {
          await c.focus();
          if (c.navigate) await c.navigate(url.href);
          else if (c.postMessage) c.postMessage({ type: "sf-open", href: url.hash || href });
          return;
        }
      } catch (e) { /* try the next client */ }
    }
    await self.clients.openWindow(url.href);
  })());
});

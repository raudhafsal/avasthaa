import { precacheAndRoute } from "workbox-precaching";
import { offlineFallback } from "workbox-recipes";

// next-pwa's InjectManifest mode replaces this with the actual list of
// build assets to precache.
precacheAndRoute(self.__WB_MANIFEST);

// Replaces the `fallbacks.document` option from GenerateSW mode, which
// isn't available once a custom service worker (swSrc) is in use.
offlineFallback({
  pageFallback: "/offline",
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Avas Thaa", body: event.data.text() };
  }

  const title = payload.title || "Avas Thaa";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url || "/notifications" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/notifications";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});

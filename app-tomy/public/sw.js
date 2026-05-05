self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Nueva notificación", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Notificación", {
      body: payload.body ?? "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: payload.url ?? "/" },
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: payload.tag ?? "notification",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});

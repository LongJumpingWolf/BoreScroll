// Shorts Reader — service worker.
// Two jobs: (1) let the page call registration.showNotification() for the
// local break-timer fallback, (2) handle real push events delivered by the
// backend in /api, which work even if this tab/app is fully closed.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Shorts Reader', body: event.data ? event.data.text() : 'Time to resume.' };
  }

  const title = data.title || 'Time to resume scrolling';
  const options = {
    body: data.body || 'Your break is over — back to the deck.',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: 'shorts-break',
    renotify: true,
    data: { url: data.url || './' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

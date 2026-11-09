// Push handling added to the generated service worker (vite.config.ts → workbox.importScripts):
// shows each notification and, when tapped, opens (or focuses) the app on the right screen.
self.addEventListener('push', (event) => {
  let message = { title: 'Voley APP', body: '', url: '/' }
  try {
    message = { ...message, ...event.data.json() }
  } catch {
    // A push without JSON still shows something.
  }
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: message.tag,
      renotify: Boolean(message.tag),
      data: { url: message.url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url ?? '/', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url.startsWith(self.location.origin))
      if (open) return open.focus().then(() => open.navigate(url))
      return self.clients.openWindow(url)
    }),
  )
})

// Keep protected demo content out of Cache Storage, including after an origin migration.
self.addEventListener('activate', (event) => {
  const prefix = 'astro-vital-shell:' + self.registration.scope + ':'
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith(prefix)).map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()))
})

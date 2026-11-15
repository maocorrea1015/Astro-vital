/* Build metadata is injected by pwaPlugin. */
const scope = self.registration.scope
const cachePrefix = `astro-vital-shell:${scope}:`
const cacheName = cachePrefix + SHELL_REVISION
const staticUrls = new Set(SHELL_FILES.map((file) => new URL(file, scope).href))
const index = new URL('index.html', scope).href

function staticType(url, response) {
  const contentType = response.headers.get('content-type') ?? ''
  if (url.endsWith('.html')) return contentType.includes('text/html')
  if (url.endsWith('.js')) return /(?:java|ecma)script/.test(contentType)
  if (url.endsWith('.css')) return contentType.includes('text/css')
  if (url.endsWith('.png')) return contentType.includes('image/png')
  return contentType.includes('json') && url.endsWith('.webmanifest')
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const files = await Promise.all([...staticUrls].map(async (url) => {
      const response = await fetch(url, { credentials: 'omit', redirect: 'error', cache: 'reload' })
      if (!response.ok || !staticType(url, response) || /\b(?:private|no-store)\b/i.test(response.headers.get('cache-control') ?? '')) {
        throw new Error('Recurso público no disponible para el shell.')
      }
      return [url, response]
    }))
    const cache = await caches.open(cacheName)
    try {
      await Promise.all(files.map(([url, response]) => cache.put(url, response)))
    } catch (error) {
      await caches.delete(cacheName)
      throw error
    }
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys
      .filter((key) => key.startsWith(cachePrefix) && key !== cacheName)
      .map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET' || request.headers.has('Authorization') || request.headers.has('X-API-Key')) return

  let key = request.url
  if (request.mode === 'navigate') {
    const url = new URL(key)
    url.search = ''
    url.hash = ''
    if (url.href !== scope && url.href !== index) return
    key = index
  } else if (!staticUrls.has(key) || key === index) {
    return
  }

  event.respondWith((async () => {
    const cache = await caches.open(cacheName)
    return (await cache.match(key)) ?? fetch(request)
  })())
})

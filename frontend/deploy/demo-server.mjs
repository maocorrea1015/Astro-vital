import { createHash, timingSafeEqual } from 'node:crypto'
import { readFile, access } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname } from 'node:path'

const dist = new URL('../dist-demo/', import.meta.url)
const media = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
}
const staticPath = /^\/(?:index\.html|manifest\.webmanifest|sw\.js|(?:assets|icons)\/[\w.-]+)$/
const flaskPath = /^\/demo(\/api\/astronauts(?:\/[\w-]{1,32}\/(?:status|readings))?)$/
const json = 'application/json; charset=utf-8'
const digest = (value) => createHash('sha256').update(value).digest()

const { ASTRO_DEMO_PASSWORD: password, ASTRO_DEMO_FLASK_URL: flaskOrigin,
  ASTRO_DEMO_FLASK_API_KEY: apiKey, HOST = '127.0.0.1', PORT = '8080' } = process.env
if (!password || !/^[!-~]{24,}$/.test(password) || !apiKey || !flaskOrigin || password === apiKey) {
  throw new Error('Configura los secretos distintos del jurado y de Flask, y el origen Flask del laboratorio.')
}
const flask = URL.canParse(flaskOrigin) ? new URL(flaskOrigin) : null
if (!flask || flask.username || flask.password || flask.pathname !== '/' || flask.search || flask.hash ||
    !(flask.protocol === 'https:' || (flask.protocol === 'http:' && ['127.0.0.1', '[::1]', 'localhost'].includes(flask.hostname)))) {
  throw new Error('El origen Flask requiere HTTPS o HTTP en loopback.')
}
await access(new URL('index.html', dist))
const expected = digest('Basic ' + Buffer.from('jurado:' + password).toString('base64'))
const server = createServer(async (request, response) => {
  const send = (status, content, type = json, headers = {}) => {
    response.writeHead(status, {
      'Cache-Control': 'private, no-store', 'Content-Type': type,
      'X-Content-Type-Options': 'nosniff', 'Cross-Origin-Resource-Policy': 'same-origin', ...headers,
    })
    response.end(request.method === 'HEAD' ? undefined : content)
  }
  if (!timingSafeEqual(digest(request.headers.authorization ?? ''), expected)) {
    return send(401, '{"error":"Demo access is required."}', json,
      { 'WWW-Authenticate': 'Basic realm="Astro-vital demo", charset="UTF-8"' })
  }
  const [pathname, query] = (request.url ?? '').split('?', 2)
  if (pathname === '/demo/session' && request.method === 'GET') return send(200, '{"educationalDemo":true}')

  const route = flaskPath.exec(pathname)
  if (route) {
    if (request.method !== 'GET') return send(405, '{"error":"Method not allowed."}', json, { Allow: 'GET' })
    try {
      const target = new URL(route[1], flask)
      if (query) target.search = query
      const upstream = await fetch(target, {
        headers: { Accept: 'application/json', 'X-API-Key': apiKey },
        signal: AbortSignal.timeout(8000), redirect: 'error',
      })
      const headers = {}
      if (upstream.headers.has('retry-after')) headers['Retry-After'] = upstream.headers.get('retry-after')
      const content = await upstream.json()
      return send(upstream.status, JSON.stringify(content), json, headers)
    } catch {
      return send(502, '{"error":"Flask is unavailable."}')
    }
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return send(405, '{"error":"Method not allowed."}', json, { Allow: 'GET, HEAD' })
  }
  const file = pathname === '/' ? '/index.html' : pathname
  const contentType = media[extname(file)]
  if (staticPath.test(file) && contentType) {
    try {
      return send(200, await readFile(new URL(file.slice(1), dist)), contentType)
    } catch {
      return send(404, '{"error":"Resource not found."}')
    }
  }
  return send(404, '{"error":"Resource not found."}')
})

server.listen(Number(PORT), HOST, () => console.log('Servidor de demo Astro-vital disponible.'))

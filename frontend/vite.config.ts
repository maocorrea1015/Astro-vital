import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import { pwaPlugin } from './src/pwa/pwaPlugin'

const localReadsEnabled = process.env.VITE_LOCAL_ANONYMOUS_READ === 'true'
const loopbackHost = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/
const readPath = /^\/api\/(?:health|astronauts(?:\/[a-zA-Z0-9_-]{1,32}\/(?:status|readings))?)$/

function protectLocalReads(): Plugin {
  return {
    name: 'astro-vital-local-reads',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = (request.url ?? '').split('?')[0]
        if (path !== '/api' && !path.startsWith('/api/')) return next()

        const { host, origin, 'sec-fetch-site': site } = request.headers
        const remote = request.socket.remoteAddress
        const loopback = remote === '127.0.0.1' || remote === '::1' || remote === '::ffff:127.0.0.1'
        if (
          localReadsEnabled && loopback && host && loopbackHost.test(host)
          && (!origin || origin === `http://${host}`)
          && (!site || site === 'same-origin' || site === 'none')
          && request.method === 'GET' && readPath.test(path)
        ) return next()

        response.writeHead(403, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
        response.end(JSON.stringify({ error: 'Lectura local no autorizada.' }))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), pwaPlugin(), protectLocalReads()],
  // Vite preview can inherit server.proxy unless explicitly overridden.
  preview: { proxy: {} },
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: localReadsEnabled ? {
      '^/api(?:/|$)': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    } : undefined,
  },
})

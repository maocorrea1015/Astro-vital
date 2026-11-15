import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { runInNewContext } from 'node:vm'

const dist = new URL('../dist/', import.meta.url)
const workerSource = await readFile(new URL('sw.js', dist), 'utf8')
const scope = 'https://example.test/astro-vital/'

test('manifiesto e iconos locales coinciden con el inventario compilado', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', dist), 'utf8'))
  assert.equal(manifest.display, 'standalone')
  assert.equal(new URL(manifest.start_url, scope).href, scope + '#/')
  assert.equal(new URL(manifest.scope, scope).href, scope)
  assert.deepEqual(manifest.icons.map(({ sizes }) => sizes), ['192x192', '512x512', '512x512'])
  assert.equal(manifest.icons[2].purpose, 'maskable')
  for (const icon of manifest.icons) {
    const png = await readFile(new URL(icon.src, dist))
    assert.equal(png.subarray(12, 16).toString(), 'IHDR')
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes)
    assert.ok(workerSource.includes(JSON.stringify(icon.src)))
  }
})

function loadWorker(overrides = {}) {
  const handlers = new Map()
  runInNewContext(workerSource, {
    URL,
    self: { registration: { scope }, addEventListener: (event, handler) => handlers.set(event, handler) },
    caches: { open: async () => ({ match: async (key) => key }) },
    ...overrides,
  })
  return handlers
}

test('el worker entrega el shell de su ámbito y deja API y solicitudes autenticadas a la red', async () => {
  const handle = loadWorker().get('fetch')
  function dispatch(url, mode = 'cors', headers = {}, method = 'GET') {
    let response
    handle({
      request: { url, mode, method, headers: new Headers(headers) },
      respondWith: (value) => { response = value },
    })
    return response
  }

  assert.equal(await dispatch(scope + '?fixture=1#/monitoreo', 'navigate'), scope + 'index.html')
  assert.equal(await dispatch(scope + 'icons/astro-vital-192.png'), scope + 'icons/astro-vital-192.png')
  assert.equal(dispatch(scope + 'api/health'), undefined)
  assert.equal(dispatch(scope + 'gateway/api/astronauts', 'navigate'), undefined)
  assert.equal(dispatch('https://other.test/astro-vital/', 'navigate'), undefined)
  assert.equal(dispatch(scope + 'icons/astro-vital-192.png?token=fixture'), undefined)
  assert.equal(dispatch(scope + 'icons/astro-vital-192.png', 'cors', { 'X-API-Key': 'fixture' }), undefined)
  assert.equal(dispatch(scope, 'navigate', { Authorization: 'fixture' }), undefined)
  assert.equal(dispatch(scope, 'navigate', {}, 'POST'), undefined)
})

test('la instalación rechaza respuestas privadas antes de guardar el shell', async () => {
  let opened = false
  const handle = loadWorker({
    fetch: async (_url, options) => {
      assert.equal(options.credentials, 'omit')
      assert.equal(options.redirect, 'error')
      return new Response('fixture', { headers: { 'content-type': 'text/html', 'cache-control': 'private' } })
    },
    caches: { open: async () => { opened = true } },
  }).get('install')
  let completion
  handle({ waitUntil: (value) => { completion = value } })
  await assert.rejects(completion, /Recurso público no disponible/)
  assert.equal(opened, false)
})

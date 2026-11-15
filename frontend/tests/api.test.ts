import assert from 'node:assert/strict'
import test from 'node:test'

import { adaptAlert, adaptAstronautStatus, adaptHistoricalReading, adaptNote, formatTimestamp, getFreshness } from '../src/services/api/adapters.ts'
import { createAstronautApi } from '../src/services/api/astronauts.ts'
import { ApiError } from '../src/services/api/client.ts'
import {
  ContractError, decodeAcknowledgeReceipt, decodeAlerts, decodeAstronautStatus, decodeAstronauts,
  decodeNoteReceipt, decodeNotes, decodeReadings,
} from '../src/services/api/validators.ts'

// Synthetic variations of the shapes in Backend/docs/API.md. No live provider or records.
const ts = 1712345678
const astronaut = {
  astronaut_id: 'astro-01', nombre: 'Demo', estado_general: 'normal',
  estado_conexion: 'offline', ultimo_contacto: 0,
}
const reading = { variable: 'activity', valor: 0, ts, calidad: 'degraded' }
const activeAlert = {
  id: 1, ts, variable: 'heart_rate', valor: 72, severidad: 'info', mensaje: 'Mensaje de prueba', guia: '',
}
const status = {
  ...astronaut, lecturas: [reading], alertas_activas: [activeAlert],
  linea_base: [{ variable: 'activity', promedio: 0, desviacion: 0, muestras: 1 }], guia_actual: null,
}
const options = { publicBaseUrl: 'https://example.test', protectedPathPrefix: '/gateway' }
const health = { status: 'ok', service: 'astra-health-backend' }
const json = (body: unknown, status = 200, headers?: HeadersInit) => Response.json(body, { status, headers })
const apiError = (kind: ApiError['kind'], status?: number, retry?: number) => (error: unknown) =>
  error instanceof ApiError && error.kind === kind && error.status === status && error.retryAfterSeconds === retry

test('adapta segundos, cero, ausencia de contacto, unidad pendiente y sensor degradado sin inferir origen', () => {
  const model = adaptAstronautStatus(decodeAstronautStatus(status))
  assert.equal(model.connection, 'offline')
  assert.equal(model.reportedStatus, 'normal')
  assert.equal(model.lastContactAtMs, null)
  assert.deepEqual(model.readings[0], {
    variable: 'activity', value: 0, unit: null, measuredAtMs: ts * 1000, quality: 'degraded', source: 'unknown',
  })
  assert.equal(model.baselines[0].sampleCount, 1)
  assert.equal(model.activeAlerts[0].acknowledged, false)
  assert.equal(model.activeAlerts[0].acknowledgedAtMs, null)
  assert.equal('guia' in model.activeAlerts[0], false)
  assert.equal(formatTimestamp(null, 'es-CO', 'UTC'), null)
  assert.equal(formatTimestamp(ts * 1000, 'es-CO', 'UTC'), new Intl.DateTimeFormat(
    'es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' },
  ).format(ts * 1000))
  assert.equal(getFreshness(ts * 1000, ts * 1000 + 500), 'unknown')
  assert.equal(getFreshness(ts * 1000, ts * 1000 + 500, 100), 'stale')
  assert.equal(getFreshness(ts * 1000, ts * 1000 + 500, 500), 'recent')
})

test('distingue listas vacías válidas de objetos incompletos y campos inválidos', () => {
  assert.deepEqual(decodeAstronauts([]), [])
  assert.throws(() => decodeAstronauts({}), ContractError)
  assert.throws(() => decodeAstronauts([{ ...astronaut, astronaut_id: '../astro' }]), ContractError)
  for (const patch of [
    { valor: '0' }, { valor: null }, { valor: Infinity }, { calidad: 'valid' }, { ts: NaN },
    { ts: 8.65e12 }, { variable: 'unknown' },
  ]) {
    assert.throws(() => decodeAstronautStatus({ ...status, lecturas: [{ ...reading, ...patch }] }), ContractError)
  }
  assert.throws(() => decodeAstronautStatus({ ...status, estado_conexion: 'normal' }), ContractError)
  assert.throws(() => decodeAstronautStatus({ ...status, guia_actual: undefined }), ContractError)
})

test('valida formas adicionales de histórico, reconocimiento y notas', () => {
  const [entry] = decodeReadings([{ ...reading, variable: 'heart_rate', id: 3, astronaut_id: 'astro-01' }])
  assert.equal(adaptHistoricalReading(entry).unit, 'bpm')
  const alert = { ...activeAlert, astronaut_id: 'astro-01', reconocida: 1, reconocida_en: ts, creado_en: ts }
  assert.equal(adaptAlert(decodeAlerts([alert])[0]).acknowledgedAtMs, ts * 1000)
  assert.equal(adaptAlert(decodeAlerts([{ ...alert, reconocida: 0, reconocida_en: null }])[0]).acknowledged, false)
  assert.throws(() => decodeAlerts([{ ...alert, reconocida: true }]), ContractError)
  assert.throws(() => decodeAlerts([{ ...alert, severidad: 'other' }]), ContractError)
  const [note] = decodeNotes([{ id: 4, astronaut_id: 'astro-01', ts, texto: 'Nota ficticia', creado_en: ts }])
  assert.equal(adaptNote(note).recordedAtMs, ts * 1000)
  assert.deepEqual(decodeAcknowledgeReceipt({ status: 'ok' }), { status: 'ok' })
  assert.deepEqual(decodeNoteReceipt({ nota_id: 4 }), { nota_id: 4 })
})

test('usa health público sin credenciales, y protege lecturas detrás de un prefijo de mismo origen', async () => {
  const calls: { url: string; init?: RequestInit }[] = []
  const fetchImpl: typeof fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    return json(String(url).endsWith('/health') ? health : String(url).endsWith('/status') ? status : [astronaut])
  }
  const publicOnly = createAstronautApi({ publicBaseUrl: options.publicBaseUrl, fetchImpl })
  await assert.rejects(publicOnly.listAstronauts(), apiError('access-unconfigured'))
  assert.deepEqual(await publicOnly.getHealth(), health)

  const api = createAstronautApi({ ...options, fetchImpl })
  assert.equal((await api.listAstronauts())[0].id, 'astro-01')
  assert.equal((await api.getAstronautStatus('astro-01')).id, 'astro-01')
  await assert.rejects(api.getAstronautStatus('../x'), apiError('invalid-request'))
  await assert.rejects(api.getAstronautStatus('another'), ContractError)

  assert.deepEqual(calls.map(({ url }) => url), [
    'https://example.test/api/health', '/gateway/api/astronauts',
    '/gateway/api/astronauts/astro-01/status', '/gateway/api/astronauts/another/status',
  ])
  for (const [i, { init }] of calls.entries()) {
    assert.deepEqual([...new Headers(init?.headers).entries()], [['accept', 'application/json']])
    assert.equal(init?.credentials, i === 0 ? 'omit' : 'same-origin')
    assert.equal(init?.redirect, 'error')
    assert.equal(init?.cache, 'no-store')
  }
  for (const prefix of ['//example.test', 'https://example.test', '/a/../b', '/a%2Fb']) {
    assert.throws(() => createAstronautApi({ ...options, protectedPathPrefix: prefix }), apiError('configuration'))
  }
})

test('normaliza errores HTTP, fallo de red, JSON inválido y contrato inválido', async () => {
  for (const [code, kind] of [[400, 'invalid-request'], [401, 'unauthorized'], [404, 'not-found'], [405, 'http'], [500, 'server']] as const) {
    const api = createAstronautApi({ ...options, fetchImpl: async () => new Response('error', { status: code }) })
    await assert.rejects(api.listAstronauts(), apiError(kind, code))
  }
  const offline = createAstronautApi({ ...options, fetchImpl: async () => { throw new TypeError('offline') } })
  await assert.rejects(offline.getHealth(), apiError('network'))
  const badJson = createAstronautApi({ ...options, fetchImpl: async () => new Response('<html>') })
  await assert.rejects(badJson.getHealth(), apiError('invalid-response', 200))
  const badShape = createAstronautApi({ ...options, fetchImpl: async () => json({ status: 'ok' }) })
  await assert.rejects(badShape.getHealth(), ContractError)
})

test('respeta 429 entre rutas del mismo acceso, sin repetir automáticamente', async () => {
  let calls = 0
  const api = createAstronautApi({
    ...options,
    fetchImpl: async () => {
      calls++
      return json({ error: 'límite', retry_after: 23 }, 429, { 'Retry-After': '60' })
    },
  })
  await assert.rejects(api.listAstronauts(), apiError('rate-limited', 429, 60))
  await assert.rejects(api.getAstronautStatus('astro-01'), apiError('rate-limited', 429, 60))
  assert.equal(calls, 1)
  const body = createAstronautApi({ ...options, fetchImpl: async () => json({ error: 'límite', retry_after: 23 }, 429) })
  await assert.rejects(body.listAstronauts(), apiError('rate-limited', 429, 23))
  const malformed = createAstronautApi({ ...options, fetchImpl: async () => new Response('límite', { status: 429 }) })
  await assert.rejects(malformed.listAstronauts(), apiError('rate-limited', 429))
})

test('distingue cancelación y timeout y mantiene independientes las llamadas cancelables', async () => {
  let calls = 0
  const waitForAbort: typeof fetch = async (_url, init) => {
    calls++
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
    })
  }
  const api = createAstronautApi({ ...options, timeoutMs: 25, fetchImpl: waitForAbort })
  const controller = new AbortController()
  const cancelled = api.getHealth(controller.signal)
  const timedOut = api.getHealth()
  controller.abort()
  await assert.rejects(cancelled, apiError('cancelled'))
  await assert.rejects(timedOut, apiError('timeout'))
  await assert.rejects(api.getHealth(controller.signal), apiError('cancelled'))
  assert.equal(calls, 2)
})

test('agrupa solicitudes simultáneas sin señal y vuelve a consultar al terminar', async () => {
  let calls = 0
  const api = createAstronautApi({ ...options, fetchImpl: async () => { calls++; return json(health) } })
  assert.deepEqual(await Promise.all([api.getHealth(), api.getHealth()]), [health, health])
  assert.equal(calls, 1)
  await api.getHealth()
  assert.equal(calls, 2)
})

test('consulta únicamente el histórico documentado y adapta valores, calidad y hora', async () => {
  const calls: string[] = []
  const history = [
    { ...reading, astronaut_id: 'astro-01', id: 2 },
    { ...reading, astronaut_id: 'astro-01', id: 1, ts: ts - 60, variable: 'radiation_cpm' },
  ]
  const api = createAstronautApi({
    ...options,
    fetchImpl: async (url) => {
      calls.push(String(url))
      return json(history)
    },
  })
  const readings = await api.getAstronautReadings('astro-01')
  assert.deepEqual(calls, ['/gateway/api/astronauts/astro-01/readings'])
  assert.deepEqual(readings.map(({ id, value, unit, measuredAtMs, quality, source }) => ({
    id, value, unit, measuredAtMs, quality, source,
  })), [
    { id: 2, value: 0, unit: null, measuredAtMs: ts * 1000, quality: 'degraded', source: 'unknown' },
    { id: 1, value: 0, unit: 'CPM', measuredAtMs: (ts - 60) * 1000, quality: 'degraded', source: 'unknown' },
  ])
  await assert.rejects(api.getAstronautReadings('../x'), apiError('invalid-request'))
  await assert.rejects(api.getAstronautReadings('astro-02'), ContractError)
})

test('mantiene el acceso al histórico desactivado por defecto y distingue vacío y error', async () => {
  const disabled = createAstronautApi({ fetchImpl: async () => {
    assert.fail('Una consulta sin acceso configurado no debe usar fetch')
  } })
  await assert.rejects(disabled.getAstronautReadings('astro-01'), apiError('access-unconfigured'))
  const empty = createAstronautApi({ ...options, fetchImpl: async () => json([]) })
  assert.deepEqual(await empty.getAstronautReadings('astro-01'), [])
  const failed = createAstronautApi({ ...options, fetchImpl: async () => new Response(null, { status: 500 }) })
  await assert.rejects(failed.getAstronautReadings('astro-01'), apiError('server', 500))
})

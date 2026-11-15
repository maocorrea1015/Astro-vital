import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

import { createServer } from 'vite'

const { chromium } = createRequire(import.meta.url)(process.argv[2] || 'playwright')
const executablePath = process.argv[3]
const evidence = process.argv[4]

const entry = [
  "import {createRoot} from 'react-dom/client';",
  "import {ThemeProvider} from '@mui/material/styles';",
  "import CssBaseline from '@mui/material/CssBaseline';",
  "import {App} from './app/App';",
  "import {theme} from './app/theme';",
  "import {createAstronautApi} from './services/api/astronauts';",
  "const api = createAstronautApi({protectedPathPrefix:'/fixture'});",
  "createRoot(document.getElementById('root')).render(<ThemeProvider theme={theme}><CssBaseline/><p style={{position:'absolute',top:2,right:16,color:'#adc3d2',fontSize:11}}>Datos sintéticos · ensayo local</p><App crewApi={api}/></ThemeProvider>);",
].join('\n')

const fixtureCatalog = {
  status: 'approved', version: 'fixture-1',
  review: { reviewer: 'Fixture', reviewedOn: '2026-11-15', reference: 'Fixture', audience: 'Fixture', scope: 'Fixture' },
  sources: [{ id: 'test', organization: 'Fixture', title: 'Fixture', url: 'https://example.invalid', version: '1', accessedOn: '2026-11-15', section: 'Fixture' }],
  questions: [{
    id: 'figure', kind: 'single', prompt: 'Elige una figura de prueba', sourceIds: ['test'],
    options: [{ id: 'circle', label: 'Círculo' }, { id: 'square', label: 'Cuadrado' }],
  }],
}

const server = await createServer({
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{
    name: 'mission-control-fixtures', enforce: 'pre',
    transform(code, id) {
      const path = id.replaceAll('\\', '/')
      if (path.endsWith('/src/main.tsx')) return entry
      if (path.endsWith('/src/app/assistanceContent.ts')) {
        return code.replace("const assistanceCatalog: AssistanceCatalog = { status: 'pending' }",
          "const assistanceCatalog: AssistanceCatalog = location.search.includes('questions=1') ? " + JSON.stringify(fixtureCatalog) + " : {status: 'pending'}")
      }
    },
  }],
})

const ts = 1794732821
const crew = [
  { astronaut_id: 'astro-01', nombre: 'Elena Vega', estado_general: 'critical', estado_conexion: 'online', ultimo_contacto: ts },
  { astronaut_id: 'astro-02', nombre: 'Mateo Ríos', estado_general: 'normal', estado_conexion: 'offline', ultimo_contacto: 0 },
]
const readings = [
  { variable: 'heart_rate', valor: 141.5, ts, calidad: 'ok' },
  { variable: 'spo2', valor: 98.2, ts, calidad: 'ok' },
  { variable: 'temperature', valor: 36.5, ts, calidad: 'degraded' },
  { variable: 'activity', valor: 18.4, ts, calidad: 'ok' },
  { variable: 'radiation_cpm', valor: 0, ts, calidad: 'sensor_fault' },
]

let browser
try {
  await server.listen()
  const base = 'http://127.0.0.1:' + server.httpServer.address().port + '/'
  browser = await chromium.launch({ executablePath })
  if (evidence) await mkdir(evidence, { recursive: true })
  for (const width of [1440, 1024, 768, 375, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    page.setDefaultTimeout(12_000)
    const requests = []
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.includes('/api/')) {
        requests.push({ method: request.method(), secret: request.headers()['x-api-key'] })
      }
    })
    let result = width === 320 ? 'fail' : 'ready'
    await page.route('**/fixture/api/**', async (route) => {
      const endpoint = new URL(route.request().url()).pathname
      if (result === 'fail') return route.fulfill({ status: 502 })
      if (endpoint.endsWith('/astronauts')) return route.fulfill({ json: result === 'empty' ? [] : crew })
      const second = endpoint.includes('astro-02')
      if (endpoint.endsWith('/readings')) {
        const series = [70.5, 74, 71.7, 76, 72, 80, 141.5].map((valor, i) => ({ ...readings[0], valor, ts: ts - (6 - i) * 20 }))
        return route.fulfill({ json: second ? [] : [...series, ...readings.slice(1)].map((item, i) => ({ ...item, id: i + 1, astronaut_id: 'astro-01' })) })
      }
      return route.fulfill({ json: {
        ...crew[second ? 1 : 0], lecturas: second ? [] : readings, linea_base: [], guia_actual: null,
        alertas_activas: second ? [] : [{ id: 1, ...readings[0], severidad: 'critical', mensaje: 'Texto excluido del fixture', guia: '' }],
      } })
    })
    const dashboard = page.getByRole('heading', { name: 'Centro de control de salud' })
    const roster = page.getByRole('list', { name: 'Astronautas disponibles' })
    const panel = (name) => page.getByRole('region', { name, exact: true })
    const alert = panel('Estado y asistencia')
    const map = panel('Mapa de telemetría')
    const metrics = panel('Indicadores')
    const trend = panel('Tendencia')
    const on = (section, text) => section.getByText(text, { exact: true }).waitFor()
    await page.goto(base + '#/')
    await dashboard.waitFor()
    if (width === 320) {
      await page.getByRole('alert').waitFor()
      result = 'empty'
      await page.getByRole('button', { name: 'Reintentar' }).click()
      await on(page, 'No hay astronautas disponibles.')
      result = 'ready'
      await page.reload()
    }
    await on(alert, '1 alerta activa')
    await on(metrics, '141,5')
    await on(trend, '7 muestras')
    await on(metrics, 'Fallo de sensor')
    assert.equal(await alert.getByText('Texto excluido del fixture').count(), 0)
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width)
    if (evidence) await page.screenshot({ path: resolve(evidence, 'panel-' + width + '.png'), fullPage: true })
    if (width === 1440) {
      const height = await page.evaluate(() => document.documentElement.scrollHeight)
      assert.ok(height <= 900, 'Height: ' + height + ' ' + (await page.locator('.mission-panel').evaluateAll(panels => panels.map(p => [p.className, p.getBoundingClientRect().height]))).flat())
    }

    const hotspots = map.locator('svg [role="button"]')
    const targets = [/Temperatura/, /Frecuencia cardíaca/, /Saturación/, /Actividad/, /Radiación/]
    const names = [/Temperatura/, /Frecuencia cardíaca/, /Saturación/, /Actividad/, /Radiación/]
    assert.equal(await hotspots.count(), 5)
    for (const [index, name] of targets.entries()) {
      const hotspot = map.getByRole('button', { name })
      if (index % 2) await hotspot.click()
      else { await hotspot.focus(); await page.keyboard.press(index ? 'Space' : 'Enter') }
      assert.equal(await hotspot.getAttribute('aria-pressed'), 'true')
      assert.equal(await metrics.getByRole('button', { name: names[index], pressed: true }).count(), 1)
    }
    await on(trend, '1 muestra · serie insuficiente')
    assert.equal(await map.locator('.mission-marker').first().evaluate((e) => getComputedStyle(e).transitionDuration), '0s')
    const second = roster.getByRole('button', { name: /Mateo/ })
    await second.click()
    assert.equal(await second.getAttribute('aria-pressed'), 'true')
    await on(alert, 'Sin alertas activas.')
    await alert.getByText(/Nodo sin conexión/).waitFor()
    assert.equal(await alert.getByRole('link', { name: 'Iniciar asistencia' }).getAttribute('href'), '#/asistencia/astro-02')
    await alert.getByRole('link', { name: 'Iniciar asistencia' }).click()
    await page.getByRole('heading', { name: 'Asistencia', level: 1 }).waitFor()
    assert.equal(await roster.getByRole('button', { name: /Mateo/ }).getAttribute('aria-pressed'), 'true')
    await on(page, 'El cuestionario de asistencia está pendiente de validación médica')

    if (width === 375) {
      await page.goto(base + '?questions=1#/asistencia/astro-02')
      await page.getByRole('button', { name: 'Iniciar sesión' }).click()
      await page.getByRole('radio', { name: 'Círculo' }).check()
      await page.getByRole('link', { name: 'Inicio', exact: true }).click()
      await dashboard.waitFor()
      await page.evaluate(() => { location.hash = '#/asistencia/astro-02' })
      await page.getByRole('radio', { name: 'Círculo' }).waitFor()
      assert.equal(await page.getByRole('radio', { name: 'Círculo' }).isChecked(), true)
      await page.getByRole('button', { name: 'Cancelar sesión' }).click()
      assert.equal(await page.getByRole('radio').count(), 0)
    }
    assert.ok(requests.length > 0 && requests.every(({ method, secret }) => method === 'GET' && secret === undefined))
    assert.deepEqual(errors, [])
    console.log(width + ' px · selección, figura, histórico, alertas, asistencia contextual y solo GET')
    await page.close()
  }
} finally {
  await browser?.close()
  await server.close()
}

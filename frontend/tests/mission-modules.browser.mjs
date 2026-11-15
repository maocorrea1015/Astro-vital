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
  "createRoot(document.getElementById('root')).render(<ThemeProvider theme={theme}><CssBaseline/><p style={{position:'absolute',top:2,right:16,color:'#adc3d2',fontSize:11}}>Synthetic data · local test</p><App crewApi={api}/></ThemeProvider>);",
].join('\n')

const fixtureCatalog = {
  status: 'approved', version: 'fixture-1',
  review: { reviewer: 'Fixture', reviewedOn: '2026-11-15', reference: 'Fixture', audience: 'Fixture', scope: 'Fixture' },
  sources: [{ id: 'test', organization: 'Fixture', title: 'Fixture', url: 'https://example.invalid', version: '1', accessedOn: '2026-11-15', section: 'Fixture' }],
  questions: [{
    id: 'figure', kind: 'single', prompt: 'Choose a test shape', sourceIds: ['test'],
    options: [{ id: 'circle', label: 'Circle' }, { id: 'square', label: 'Square' }],
  }, {
    id: 'color', kind: 'multiple', prompt: 'Choose test colors', sourceIds: ['test'],
    options: [{ id: 'red', label: 'Red' }, { id: 'blue', label: 'Blue' }],
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
  for (const width of [1440, 1366, 1024, 768, 375, 320]) {
    const height = width === 1366 ? 768 : 900
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' })
    page.setDefaultTimeout(10000)
    const requests = [], errors = []
    const dimensions = {}
    let mode = 'ready'
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.includes('/api/')) requests.push([request.method(), request.headers()['x-api-key']])
    })
    await page.route('**/fixture/api/**', async (route) => {
      const endpoint = new URL(route.request().url()).pathname
      if (mode === 'error') return route.fulfill({ status: 502 })
      if (endpoint.endsWith('/astronauts')) return route.fulfill({ json: mode === 'empty' ? [] : crew })
      const second = endpoint.includes('astro-02')
      if (endpoint.endsWith('/readings')) {
        const series = [70.5, 74, 71.7, 76, 72, 80, 141.5].map((valor, i) => ({ ...readings[0], valor, ts: ts - (6 - i) * 20 }))
        return route.fulfill({ json: second ? [] : [...series, ...readings.slice(1)].map((item, i) => ({ ...item, id: i + 1, astronaut_id: 'astro-01' })) })
      }
      return route.fulfill({ json: {
        ...crew[second ? 1 : 0], lecturas: second ? [] : readings, linea_base: [], guia_actual: null,
        alertas_activas: second ? [] : [
          { id: 1, ...readings[0], severidad: 'critical', mensaje: 'Texto excluido del fixture', guia: '' },
          { id: 2, ...readings[2], severidad: 'warning', mensaje: 'Otro texto excluido', guia: '' },
        ],
      } })
    })
    const region = (name) => page.getByRole('region', { name, exact: true })
    const title = (name) => page.getByRole('heading', { name, level: 1, exact: true }).waitFor()
    const go = async (name, pageTitle = name) => {
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name, exact: true }).click()
      await title(pageTitle)
    }
    const roster = page.getByRole('list', { name: 'Available Astronauts' })
    const pick = (name) => roster.getByRole('button', { name }).click()
    const isSelected = async (name) => assert.equal(await roster.getByRole('button', { name }).getAttribute('aria-pressed'), 'true')
    const measure = async (key) => {
      const viewport = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }))
      assert.equal(viewport.w, width, key + ' desborda ' + width)
      dimensions[key] = viewport.h
      if (width === 1440) assert.ok(viewport.h <= height, key + ' excede el viewport: ' + viewport.h)
      if (evidence && [1440, 375].includes(width)) await page.screenshot({ path: resolve(evidence, key + '-' + width + '.png'), fullPage: true })
    }

    await page.goto(base + '#/')
    await title('Mission Control')
    await region('Status and Assistance').getByText('2 active alerts', { exact: true }).waitFor()
    await measure('inicio')
    await go('Crew')
    await region('Astronaut Profile').getByText('141.5', { exact: true }).waitFor()
    await isSelected(/Elena/)
    await measure('tripulacion')
    const telemetryMap = region('Telemetry Map')
    const temperature = telemetryMap.getByRole('button', { name: /Body Temperature/ })
    await temperature.focus()
    await page.keyboard.press('Enter')
    assert.equal(await temperature.getAttribute('aria-pressed'), 'true')
    await pick(/Mateo/)
    await isSelected(/Mateo/)
    await page.getByRole('link', { name: 'View Monitoring', exact: true }).click()
    await title('Monitoring')
    await isSelected(/Mateo/)
    await page.getByText('No readings available in this time range.', { exact: true }).waitFor()
    await pick(/Elena/)
    await isSelected(/Elena/)
    await page.getByRole('heading', { name: 'Trend Over Time · Heart Rate' }).waitFor()
    await page.getByRole('button', { name: 'Previous Reading' }).waitFor()
    await measure('monitoreo')
    await page.getByRole('button', { name: 'Previous Reading' }).click()
    await page.getByText('Reading 6 of 7', { exact: false }).waitFor()
    await region('Trend Over Time').getByRole('button', { name: 'Body Temperature', exact: true }).click()
    await page.getByRole('heading', { name: 'Trend Over Time · Body Temperature' }).waitFor()
    await page.getByRole('button', { name: 'Show as an accessible data table' }).click()
    await page.getByRole('table').waitFor()

    await go('Alerts')
    await isSelected(/Elena/)
    await page.getByRole('list', { name: 'Alert list' }).getByRole('button', { name: /Heart Rate/ }).waitFor()
    await measure('alertas')
    await page.getByRole('button', { name: 'Warnings', exact: true }).click()
    const list = page.getByRole('list', { name: 'Alert list' })
    assert.equal(await list.getByRole('listitem').count(), 1)
    assert.match(await list.innerText(), /Body Temperature/)
    assert.equal(await page.getByText('Texto excluido del fixture', { exact: true }).count(), 0)
    await go('Medical Assistance')
    await isSelected(/Elena/)
    await page.getByText('The assistance questionnaire is pending medical review', { exact: true }).waitFor()
    assert.equal(await page.getByRole('radio').count(), 0)
    await measure('asistencia')
    await page.getByRole('button', { name: 'Confirm Astronaut', exact: true }).click()
    await page.getByRole('heading', { name: 'Astronaut confirmed: Elena Vega', exact: true }).waitFor()
    await page.getByRole('button', { name: 'Cancel Session' }).click()

    if (width === 375) {
      await page.goto(base + '?questions=1#/asistencia/astro-01')
      await page.getByRole('button', { name: 'Start Session' }).click()
      await region('Guided Assistance').getByRole('heading', { name: 'Choose a test shape' }).waitFor()
      await page.getByRole('radio', { name: 'Circle' }).check()
      await page.getByRole('button', { name: 'Next' }).click()
      await page.getByRole('checkbox', { name: 'Red' }).check()
      await page.getByRole('checkbox', { name: 'Blue' }).check()
      await page.getByRole('button', { name: 'Previous' }).click()
      await page.getByRole('radio', { name: 'Square' }).check()
      await go('Home', 'Mission Control')
      await page.evaluate(() => { location.hash = '#/asistencia/astro-01' })
      await page.getByRole('radio', { name: 'Circle' }).waitFor()
      assert.equal(await page.getByRole('radio', { name: 'Square' }).isChecked(), true)
      await page.getByRole('button', { name: 'Next' }).click()
      assert.equal(await page.getByRole('checkbox', { name: 'Blue' }).isChecked(), true)
      await page.getByRole('button', { name: 'Finish Questionnaire' }).click()
      await region('Guided Assistance').getByRole('heading', { name: 'Questionnaire Complete' }).waitFor()
      await page.getByRole('button', { name: 'Cancel Session' }).click()
      assert.equal(await page.getByRole('radio').count(), 0)
    }
    if (width === 1440) {
      mode = 'empty'
      await page.goto(base + '#/tripulacion')
      await page.reload()
      await page.getByText('No astronauts available', { exact: true }).waitFor()
      await measure('tripulacion-vacia')
      mode = 'error'
      await page.getByRole('button', { name: 'Retry' }).click()
      await page.getByRole('alert').waitFor()
      mode = 'ready'
      await page.getByRole('button', { name: 'Retry' }).click()
      await roster.waitFor()
    }
    assert.ok(requests.length && requests.every(([method,key]) => method === 'GET' && key === undefined))
    assert.deepEqual(errors, [])
    console.log(JSON.stringify({width,height,dimensions,requests:requests.length}))
    await page.close()
  }
} finally {
  await browser?.close()
  await server.close()
}

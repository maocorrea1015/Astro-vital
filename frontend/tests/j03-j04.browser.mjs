import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[2] || 'playwright')
const executablePath = process.argv[3]

const entry = [
  "import { createRoot } from 'react-dom/client'",
  "import { ThemeProvider } from '@mui/material/styles'",
  "import CssBaseline from '@mui/material/CssBaseline'",
  "import { App } from './app/App'",
  "import { theme } from './app/theme'",
  "import { createAstronautApi } from './services/api/astronauts'",
  "const api = createAstronautApi({ protectedPathPrefix: '/fixture' })",
  "createRoot(document.getElementById('root')).render(<ThemeProvider theme={theme}><CssBaseline/><p role='note'>Synthetic data · local test</p><App crewApi={api}/></ThemeProvider>)",
].join('\n')

const server = await createServer({
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{
    name: 'j03-j04-fixture',
    enforce: 'pre',
    transform(_code, id) {
      if (id.replaceAll('\\', '/').endsWith('/src/main.tsx')) return entry
    },
  }],
})
let browser

try {
  await server.listen()
  const base = 'http://127.0.0.1:' + server.httpServer.address().port + '/'
  browser = await chromium.launch({ executablePath })
  for (const width of [1440, 375, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 850 } })
    page.setDefaultTimeout(10_000)
    const errors = []
    const requests = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('500')) errors.push(message.text()) })
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.includes('/api/')) {
        requests.push({ method: request.method(), key: request.headers()['x-api-key'] })
      }
    })

    const ts = 1712345678
    const crew = ['demo-a', 'demo-b'].map((id, index) => ({
      astronaut_id: id, nombre: index === 0 ? 'Prueba A' : 'Prueba B',
      estado_general: 'normal', estado_conexion: index === 0 ? 'offline' : 'online',
      ultimo_contacto: ts,
    }))
    const latest = { variable: 'radiation_cpm', valor: 0, ts, calidad: 'ok' }
    const readings = [
      { ...latest, id: 3, ts: ts + 910, valor: 0.00004, calidad: 'degraded' },
      { ...latest, id: 2, variable: 'activity', ts: ts + 1, calidad: 'sensor_fault' },
      { ...latest, id: 1 },
    ].map((reading) => ({ ...reading, astronaut_id: 'demo-b' }))
    const activeAlerts = ['warning', 'critical'].map((severidad, index) => ({
      id: index + 1, variable: 'heart_rate', valor: 0, severidad,
      ts, mensaje: 'Texto sin aprobación', guia: 'Guía sin aprobación',
    }))
    let statusCallsA = 0
    await page.route('**/fixture/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname
      if (route.request().method() !== 'GET') return route.fulfill({ status: 405 })
      if (path.endsWith('/astronauts')) return route.fulfill({ json: crew })
      const isA = path.includes('/demo-a/')
      if (path.endsWith('/readings')) return route.fulfill({ json: isA ? [] : readings })
      if (isA && new URL(page.url()).hash.startsWith('#/alertas')) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (++statusCallsA === 1) return route.fulfill({ status: 500 })
      }
      return route.fulfill({ json: {
        ...crew[isA ? 0 : 1], lecturas: isA ? [] : [latest], linea_base: [],
        guia_actual: null, alertas_activas: isA ? [] : activeAlerts,
      } })
    })

    const nav = page.getByRole('navigation', { name: 'Main navigation' })
    const link = (name) => nav.getByRole('link', { name, exact: true })
    const roster = page.getByRole('list', { name: 'Available Astronauts' })
    const astronaut = (id) => roster.getByRole('button', { name: new RegExp(id) })
    const choose = (id) => astronaut(id).click()
    const visible = (text) => page.getByText(text, { exact: true }).first().waitFor()
    const titleAlerts = () => page.getByRole('heading', { name: 'Alerts', level: 1, exact: true }).waitFor()
    const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width)

    await page.goto(base + '#/')
    await link('Crew').focus()
    await page.keyboard.press('Enter')
    await page.getByRole('heading', { name: 'Crew', exact: true }).waitFor()
    await visible('Prueba B')
    await page.goto(base + '#/tripulacion/detalle/demo-b')
    await page.getByRole('heading', { name: 'Readings · Prueba B' }).waitFor()
    await visible('0')
    await noOverflow()

    await link('Monitoring').click()
    await choose('demo-a')
    await visible('No readings available in this time range.')
    await choose('demo-b')
    await page.getByRole('button', { name: 'Activity', exact: true }).click()
    await visible('No usable readings to plot a trend line.')
    const tables = page.getByRole('button', { name: 'Show as an accessible data table' })
    await page.getByRole('button', { name: 'Radiation', exact: true }).click()
    await tables.first().focus()
    await page.keyboard.press('Enter')
    const table = page.getByRole('table')
    await table.waitFor()
    const rows = table.getByRole('row')
    assert.match(await rows.nth(1).innerText(), /0 CPM/)
    assert.match(await rows.nth(2).innerText(), /0[.,]00004 CPM/)
    assert.match(await rows.nth(1).innerText(), /UTC/)
    assert.match(await rows.nth(1).innerText(), /Estimated chart gap/)
    assert.match(await rows.nth(2).innerText(), /Degraded/)
    assert.equal(await page.getByRole('group', { name: 'Time range filter' }).count(), 0)
    await noOverflow()

    await link('Medical Assistance').click()
    assert.equal(await astronaut('demo-b').getAttribute('aria-pressed'), 'true')
    await page.getByRole('button', { name: 'Confirm Astronaut' }).click()
    await visible('The assistance questionnaire is pending medical review')

    await link('Alerts').click()
    await titleAlerts()
    await choose('demo-a')
    await visible('Loading active alerts…')
    await visible('Could not load active alerts.')
    await page.getByRole('button', { name: 'Retry' }).click()
    await visible('No alerts available.')
    await choose('demo-b')
    await visible('Active alerts for the selected astronaut. The API did not report their source.')
    const critical = page.getByRole('button', { name: 'Critical', exact: true })
    await critical.waitFor()
    await page.keyboard.press('Tab')
    await critical.focus()
    assert.equal(await critical.evaluate((button) => document.activeElement === button), true)
    assert.equal(await critical.evaluate((button) => getComputedStyle(button).outlineStyle), 'solid')
    await page.keyboard.press('Enter')
    const list = page.getByRole('list', { name: 'Alert list' })
    assert.equal(await list.getByRole('listitem').count(), 1)
    const alertDetail = page.getByRole('region', { name: 'Alert Details', exact: true })
    assert.match(await alertDetail.innerText(), /Critical Status/)
    assert.match(await alertDetail.innerText(), /Pending Validation/)
    assert.doesNotMatch(await alertDetail.innerText(), /Texto sin aprobación|Guía sin aprobación/)
    assert.equal(await page.getByRole('button', { name: /acknowledge alert/i }).count(), 0)
    assert.equal(await page.getByRole('button', { name: 'Informational', exact: true }).count(), 0)
    await noOverflow()
    await choose('demo-a')
    await visible('No alerts available.')
    assert.ok(requests.length > 0)
    assert.ok(requests.every(({ method, key }) => method === 'GET' && key === undefined))
    assert.deepEqual(errors, [])
    console.log(width + ' px · tripulación, detalle, histórico, asistencia, filtros, carga, vacío, error, teclado y solo GET')
    await page.close()
  }
} finally {
  await browser?.close()
  await server.close()
}

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
  "createRoot(document.getElementById('root')).render(<ThemeProvider theme={theme}><CssBaseline/><p role='note'>Datos sintéticos · ensayo local</p><App crewApi={api}/></ThemeProvider>)",
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
      if (isA) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        if (++statusCallsA === 1) return route.fulfill({ status: 500 })
      }
      return route.fulfill({ json: {
        ...crew[isA ? 0 : 1], lecturas: isA ? [] : [latest], linea_base: [],
        guia_actual: null, alertas_activas: isA ? [] : activeAlerts,
      } })
    })

    const nav = page.getByRole('navigation', { name: 'Navegación principal' })
    const link = (name) => nav.getByRole('link', { name, exact: true })
    const choose = (id) => page.getByRole('combobox', { name: 'Astronauta', exact: true }).selectOption(id)
    const visible = (text) => page.getByText(text, { exact: true }).first().waitFor()
    const noOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width)

    await page.goto(base + '#/')
    await link('Tripulación').focus()
    await page.keyboard.press('Enter')
    await page.getByRole('heading', { name: 'Tripulación', exact: true }).waitFor()
    await visible('Prueba B')
    await page.goto(base + '#/tripulacion/detalle/demo-b')
    await page.getByRole('heading', { name: 'Mediciones · Prueba B' }).waitFor()
    await visible('0')
    await noOverflow()

    await link('Monitoreo').click()
    await choose('demo-a')
    await visible('No hay lecturas disponibles en este intervalo.')
    await choose('demo-b')
    await page.getByRole('heading', { name: 'Evolución temporal · Radiación' }).waitFor()
    await visible('No hay muestras utilizables para trazar una línea de tendencia.')
    const tables = page.getByRole('button', { name: 'Visualizar como tabla de datos accesible' })
    await tables.first().focus()
    await page.keyboard.press('Enter')
    const table = page.getByRole('table')
    await table.waitFor()
    const rows = table.getByRole('row')
    assert.match(await rows.nth(1).innerText(), /0 CPM/)
    assert.match(await rows.nth(2).innerText(), /0[.,]00004 CPM/)
    assert.match(await rows.nth(1).innerText(), /UTC/)
    assert.match(await rows.nth(1).innerText(), /Discontinuidad estimada de visualización/)
    assert.match(await rows.nth(2).innerText(), /Degradada/)
    assert.equal(await page.getByRole('group', { name: 'Filtro de ventana temporal' }).count(), 0)
    await noOverflow()

    await link('Asistencia').click()
    assert.equal(await page.getByRole('combobox', { name: 'Astronauta', exact: true }).inputValue(), 'demo-b')
    await page.getByRole('button', { name: 'Confirmar astronauta' }).click()
    await visible('El cuestionario de asistencia está pendiente de validación médica')

    await link('Alertas').click()
    await choose('demo-a')
    await visible('Cargando alertas…')
    await visible('No se pudieron cargar las alertas.')
    await page.getByRole('button', { name: 'Reintentar' }).click()
    await visible('No hay alertas disponibles.')
    await choose('demo-b')
    await visible('Avisos activos del astronauta seleccionado · Procedencia no informada por la API.')
    const critical = page.getByRole('button', { name: 'Críticas', exact: true })
    await critical.waitFor()
    await page.keyboard.press('Tab')
    await critical.focus()
    assert.equal(await critical.evaluate((button) => document.activeElement === button), true)
    assert.equal(await critical.evaluate((button) => getComputedStyle(button).outlineStyle), 'solid')
    await page.keyboard.press('Enter')
    const list = page.getByRole('list', { name: 'Lista de alertas' })
    assert.equal(await list.getByRole('listitem').count(), 1)
    assert.match(await list.innerText(), /Estado crítico/)
    assert.match(await list.innerText(), /pendiente de validación/)
    assert.doesNotMatch(await list.innerText(), /Texto sin aprobación|Guía sin aprobación/)
    assert.equal(await page.getByRole('button', { name: /reconocer alerta/i }).count(), 0)
    assert.equal(await page.getByRole('button', { name: 'Informativas', exact: true }).count(), 0)
    await noOverflow()
    await choose('demo-a')
    await visible('No hay alertas disponibles.')
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

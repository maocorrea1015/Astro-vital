import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'vite'

const { chromium } = createRequire(import.meta.url)(process.argv[2] || 'playwright')
const evidence = process.argv[4]
process.env.VITE_ASSISTANCE_DEMO = 'true'
const entry = [
  "import {createRoot} from 'react-dom/client';",
  "import {ThemeProvider} from '@mui/material/styles';",
  "import CssBaseline from '@mui/material/CssBaseline';",
  "import {App} from './app/App';",
  "import {theme} from './app/theme';",
  "import {createAstronautApi} from './services/api/astronauts';",
  "createRoot(document.getElementById('root')).render(<ThemeProvider theme={theme}><CssBaseline/><App crewApi={createAstronautApi({protectedPathPrefix:'/fixture'})}/></ThemeProvider>);",
].join('\n')
const server = await createServer({
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{ name: 'observation-fixture', enforce: 'pre', transform(_code, id) {
    if (id.replaceAll('\\', '/').endsWith('/src/main.tsx')) return entry
  } }],
})
const astronaut = { astronaut_id: 'astro-01', nombre: 'Astronauta de prueba', estado_general: 'critical', estado_conexion: 'online', ultimo_contacto: 1794732821 }
const reading = { variable: 'heart_rate', valor: 141.5, ts: 1794732821, calidad: 'degraded' }
let browser
try {
  await server.listen()
  const base = 'http://127.0.0.1:' + server.httpServer.address().port + '/'
  browser = await chromium.launch({ executablePath: process.argv[3] })
  if (evidence) await mkdir(evidence, { recursive: true })
  for (const [width, height] of [[1440,900],[1366,768],[1024,900],[768,900],[375,900],[320,900]]) {
    const page = await browser.newPage({ viewport: { width, height } })
    const requests = [], errors = []
    page.setDefaultTimeout(10000)
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('request', (req) => { if (new URL(req.url()).pathname.includes('/api/')) requests.push([req.method(), req.headers()['x-api-key']]) })
    await page.route('**/fixture/api/**', (route) => {
      const url = new URL(route.request().url())
      if (url.pathname.endsWith('/astronauts')) return route.fulfill({ json: [astronaut] })
      if (url.pathname.endsWith('/readings')) return route.fulfill({ json: [{ ...reading, id: 1, astronaut_id: astronaut.astronaut_id }] })
      return route.fulfill({ json: {
        ...astronaut, lecturas: width === 320 ? [] : [reading], linea_base: [],
        alertas_activas: width === 320 ? [] : [{ ...reading, id: 1, severidad: 'critical', mensaje: 'Dato de control excluido', guia: 'Texto de guía excluido' }],
        guia_actual: { mensaje: 'Dato de control excluido', guia: 'Texto de guía excluido' },
      } })
    })
    const button = (name) => page.getByRole('button', { name, exact: true })
    const text = (name) => page.getByText(name, { exact: true }).first().waitFor()
    const layout = async () => {
      const size = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
        panel: [...document.querySelectorAll('.rapid-center,.rapid-options')].map((node) => ({
          client: node.clientHeight, scroll: node.scrollHeight, bottom: node.getBoundingClientRect().bottom,
        })),
      }))
      assert.equal(size.width, width)
      if (width >= 1366) {
        assert.ok(size.height <= height + 1, JSON.stringify(size))
        assert.ok(size.panel.every(({ client, scroll, bottom }) => scroll <= client + 1 && bottom <= height + 1), JSON.stringify(size))
        const controls = await page.locator('.observation-rapid button:not(:disabled),.observation-rapid a').evaluateAll((items) =>
          items.filter((item) => !item.closest('.module-astronauts')).map((item) => item.getBoundingClientRect().bottom))
        assert.ok(controls.every((bottom) => bottom <= height + 1))
      }
    }
    const shot = async (name) => {
      await layout()
      if (evidence && [1440,1366,375,320].includes(width)) await page.screenshot({ path: resolve(evidence, name + '-' + width + '.png'), fullPage: true })
    }
    if (width === 320) {
      await page.goto(base + '#/asistencia/astro-01')
    } else {
      await page.goto(base + '#/alertas/astro-01')
      await button('Ver información relacionada').click()
      const document = page.getByRole('dialog')
      await document.getByRole('heading', { name: /C-01/ }).waitFor()
      assert.equal(await page.getByText('Texto de guía excluido').count(), 0)
      await document.getByRole('button', { name: 'Cerrar' }).click()
      await page.getByRole('link', { name: 'Iniciar asistencia', exact: true }).click()
      await text('Aviso #1 · Crítica')
      assert.match(page.url(), /aviso=1$/)
    }
    await button('Iniciar evaluación A-01').waitFor()
    await layout()
    await button('Iniciar evaluación A-01').click()
    await text('Q01 · Paso 1 de 4')
    assert.equal(await page.getByRole('group').count(), 1)
    assert.equal(await button('Siguiente').isDisabled(), true)
    const unknowable = page.getByRole('radio', { name: 'No se puede determinar', exact: true })
    if (width === 320) await unknowable.check()
    else {
      await page.getByRole('radio', { name: 'No responde', exact: true }).focus()
      await page.keyboard.press('Space')
    }
    await shot('pregunta')
    if (width === 375) {
      await page.evaluate(() => { location.hash = '#/' })
      await page.getByRole('heading', { name: 'Centro de control de salud' }).waitFor()
      await page.evaluate(() => { location.hash = '#/asistencia/astro-01' })
      await text('Aviso #1 · Crítica')
      assert.equal(await page.getByRole('radio', { name: 'No responde', exact: true }).isChecked(), true)
    }
    await button('Siguiente').click()
    await text('Q02 · Paso 2 de 4')
    if (width === 320) await unknowable.check()
    else await page.getByRole('radio', { name: /boqueos/ }).check()
    await layout()
    await button('Anterior').click()
    if (width === 320) assert.equal(await unknowable.isChecked(), true)
    else assert.equal(await page.getByRole('radio', { name: 'No responde', exact: true }).isChecked(), true)
    await button('Siguiente').click()
    await button('Siguiente').click()
    await text('Q06a · Paso 3 de 4')
    await unknowable.check()
    await button('Siguiente').click()
    await text('Q06b · Paso 4 de 4')
    await unknowable.check()
    await layout()
    await button('Ver resultado').click()
    const result = width === 320 ? 'Información insuficiente' : 'Priorizar contacto'
    const guide = page.getByRole('dialog')
    await guide.getByRole('heading', { name: width === 320 ? /Guía F/ : /Guía A/ }).waitFor()
    const dimensions = await guide.evaluate((paper) => {
      const body = paper.querySelector('.first-aid-content')
      return [paper.getBoundingClientRect().bottom, body.scrollHeight, body.clientHeight, document.documentElement.scrollHeight, document.documentElement.scrollWidth]
    })
    assert.equal(dimensions[4], width)
    if (width >= 1366) assert.ok(dimensions[0] <= height + 1 && dimensions[1] <= dimensions[2] + 1 && dimensions[3] <= height + 1, JSON.stringify(dimensions))
    if (evidence && [1440,1366,375,320].includes(width)) await page.screenshot({ path: resolve(evidence, 'guia-' + width + '.png'), animations: 'disabled' })
    await guide.getByRole('button', { name: 'Paso siguiente' }).click()
    await guide.getByText('Paso 2 de 3').waitFor()
    await guide.getByRole('button', { name: 'Paso anterior' }).click()
    await guide.getByText('Paso 1 de 3').waitFor()
    await page.keyboard.press('Escape')
    await guide.waitFor({ state: 'hidden' })
    await page.waitForFunction(() => document.activeElement?.textContent === 'Abrir guía')
    await button('Abrir guía').click()
    await guide.getByText('Paso 1 de 3').waitFor()
    await guide.getByRole('button', { name: 'Cerrar guía' }).click()
    await guide.waitFor({ state: 'hidden' })
    await shot(width === 320 ? 'informacion-insuficiente' : 'resultado-alerta')
    await button('Revisar y corregir').click()
    await page.getByRole('button', { name: 'Editar Q03', exact: true }).click()
    await text('Q03 · Observación complementaria')
    await unknowable.check()
    await layout()
    await button('Ver resultado').click()
    await page.getByRole('heading', { name: result, exact: true }).waitFor()
    await button('Consultar fichas y fuentes').click()
    await page.getByRole('dialog').getByRole('heading', { name: /C-03/ }).waitFor()
    await page.getByRole('dialog').getByRole('button', { name: 'Cerrar' }).click()
    await button('Cancelar sesión').click()
    assert.equal(await page.getByRole('radio').count(), 0)
    if (width === 375) {
      await page.context().setOffline(true)
      await text('Datos de misión no disponibles')
    }
    assert.ok(requests.length && requests.every(([method, key]) => method === 'GET' && key === undefined))
    assert.deepEqual(errors, [])
    console.log(width + '×' + height + ' · Q01/Q02/entorno/optativa/resultado, dimensiones, solo GET (' + requests.length + ')')
    await page.close()
  }
} finally {
  await browser?.close()
  await server.close()
}

import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const [, , base, playwright, executablePath, evidence] = process.argv
const { chromium } = createRequire(import.meta.url)(playwright ?? 'playwright')
const password = process.env.ASTRO_DEMO_PASSWORD
const key = process.env.ASTRO_DEMO_FLASK_API_KEY
assert.ok(base && password && key)
const authorization = 'Basic ' + Buffer.from('jurado:' + password).toString('base64')
const auth = { headers: { authorization } }
const workspace = (await readdir('dist-demo/assets')).find((name) => /^ObservationWorkspace-.*\.js$/.test(name))
assert.ok(workspace)
assert.ok(!(await readdir('dist/assets')).some((name) => /ObservationWorkspace|ObservationDocument/.test(name)))
for (const dir of ['dist', 'dist-demo']) {
  for (const name of await readdir(join(dir, 'assets'))) {
    const body = await readFile(join(dir, 'assets', name))
    assert.equal(body.includes(password) || body.includes(key), false)
  }
}
for (const path of ['/', '/?demo=true', '/sw.js', '/demo/session', '/demo/api/astronauts', '/assets/' + workspace]) {
  assert.equal((await fetch(base + path)).status, 401, path)
}
assert.equal((await fetch(base + '/demo/session', { headers: { authorization: 'Basic invalid' } })).status, 401)
assert.deepEqual(await (await fetch(base + '/demo/session', auth)).json(), { educationalDemo: true })
assert.match((await fetch(base + '/assets/' + workspace, auth)).headers.get('cache-control'), /no-store/)
assert.equal((await fetch(base + '/demo/api/astronauts', { ...auth, method: 'POST' })).status, 405)
assert.equal((await fetch(base + '/demo/api/readings', auth)).status, 404)
const crew = await (await fetch(base + '/demo/api/astronauts', auth)).json()
assert.deepEqual(crew.map((node) => node.astronaut_id).sort(), ['astro-01','astro-02','astro-03','astro-04','astro-05'])
if (evidence) await mkdir(evidence, { recursive: true })

const browser = await chromium.launch({ executablePath })
try {
  const anonymous = await browser.newPage()
  await anonymous.goto(base + '/?demo=true#/asistencia/astro-02').catch(() => {})
  assert.equal(await anonymous.getByRole('button', { name: 'Start A-01 Assessment' }).count(), 0)
  await anonymous.close()
  for (const [width, height] of [[1440,900],[1366,768],[375,900],[320,900]]) {
    const context = await browser.newContext({ viewport: { width, height }, httpCredentials: { username: 'jurado', password, origin: base } })
    const page = await context.newPage()
    const requests = []
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('request', (request) => {
      if (new URL(request.url()).origin === base) requests.push(request)
    })
    const button = (name) => page.getByRole('button', { name, exact: true })
    const checkEnglish = async () => {
      assert.equal(await page.locator('html').getAttribute('lang'), 'en')
      const copy = await page.locator('body').innerText()
      assert.doesNotMatch(copy, /[¿¡áéíóúñ]|\b(?:pendiente|tripulación|respuesta|siguiente|disponible)\b/i)
    }
    await page.goto(base + '/#/')
    const nav = page.getByRole('navigation', { name: 'Main navigation' })
    await page.getByRole('heading', { name: 'Mission Control', level: 1 }).waitFor()
    for (const area of ['Crew', 'Monitoring', 'Alerts']) {
      await nav.getByRole('link', { name: area, exact: true }).click()
      await page.getByRole('heading', { name: area, level: 1 }).waitFor()
      await page.getByRole('button', { name: /Synthetic Astronaut 02/ }).first().click()
      await checkEnglish()
      if (evidence && width === 1440) await page.screenshot({ path: join(evidence, area.toLowerCase() + '-1440.png'), animations: 'disabled' })
    }
    await page.getByText('Heart Rate', { exact: true }).first().waitFor()
    await page.getByRole('link', { name: 'Start Medical Assistance', exact: true }).click()
    assert.match(page.url(), /asistencia\/astro-02\?aviso=\d+/)
    await page.getByText(/Alert #\d+ · Critical/).waitFor()
    await page.getByRole('button', { name: 'Start A-01 Assessment' }).click()
    const desktopFits = async () => {
      const dims = await page.evaluate(() => {
        const body = document.querySelector('.first-aid-content')
        return { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
          modal: body ? body.scrollHeight - body.clientHeight : 0 }
      })
      assert.equal(dims.width, width)
      if (width >= 1366) assert.ok(dims.height <= height + 1 && dims.modal <= 1, JSON.stringify(dims))
    }
    for (const [index, name] of ['Does not respond', /gasping/, 'Unable to determine', 'Unable to determine'].entries()) {
      await page.getByRole('radio', { name }).check()
      await desktopFits()
      await page.getByRole('button', { name: index === 3 ? 'View Result' : 'Next', exact: true }).click()
    }
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('heading', { name: /First-Aid Guidance A/ }).waitFor()
    await checkEnglish()
    await desktopFits()
    await dialog.getByRole('button', { name: 'Next Step' }).click()
    await dialog.getByText('Step 2 of 3').waitFor()
    if (evidence) await page.screenshot({ path: join(evidence, 'guia-produccion-' + width + '.png'), animations: 'disabled' })
    await dialog.getByRole('button', { name: 'Next Step' }).click()
    await dialog.getByText('Step 3 of 3').waitFor()
    await checkEnglish()
    await desktopFits()
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'hidden' })
    await page.getByRole('heading', { name: 'Prioritize Contact' }).waitFor()
    await page.getByRole('button', { name: 'Open Guidance' }).click()
    await dialog.getByText('Step 1 of 3').waitFor()
    await page.evaluate(() => navigator.serviceWorker.ready)
    assert.equal(await page.evaluate(() => caches.keys().then((keys) => keys.some((item) => item.startsWith('astro-vital-shell:')))), false)
    if (width === 1440) {
      await dialog.getByRole('button', { name: 'Close Guidance' }).click()
      await button('End Session').click()
      for (const [id, choices, optional] of [
        ['B', ['Does not respond', 'Breathing normally', 'No', 'No']],
        ['C', ['Unable to determine', 'Unable to determine', 'No', 'Yes']],
        ['D', ['Unable to determine', 'Unable to determine', 'No', 'No'], ['Q03', 'Yes, there is visible evidence']],
        ['E', ['Unable to determine', 'Unable to determine', 'No', 'No'], ['Q04', 'Yes']],
        ['F', Array(4).fill('Unable to determine')],
      ]) {
        await button('Start A-01 Assessment').click()
        for (const [index, choice] of choices.entries()) {
          await page.getByRole('radio', { name: choice, exact: true }).check()
          await button(index === 3 ? 'View Result' : 'Next').click()
        }
        if (optional) {
          await dialog.getByRole('button', { name: 'Close Guidance' }).click()
          await button('Review and Correct').click()
          await button('Edit ' + optional[0]).click()
          await page.getByRole('radio', { name: optional[1], exact: true }).check()
          await button('View Result').click()
          await button('Open Guidance').click()
        }
        await dialog.getByRole('heading', { name: new RegExp('First-Aid Guidance ' + id + ' ·') }).waitFor()
        for (let step = 1; step <= 3; step++) {
          await dialog.getByText('Step ' + step + ' of 3').waitFor()
          await checkEnglish()
          if (step < 3) await dialog.getByRole('button', { name: 'Next Step' }).click()
        }
        if (evidence) await page.screenshot({ path: join(evidence, 'guide-' + id + '-1440.png'), animations: 'disabled' })
        await dialog.getByRole('button', { name: 'Close Guidance' }).click()
        await button('End Session').click()
      }
    }
    assert.deepEqual(errors, [])
    assert.ok(requests.some((request) => new URL(request.url()).pathname === '/demo/session'))
    for (const request of requests) {
      assert.equal(request.method(), 'GET')
      assert.equal(await request.headerValue('x-api-key'), null)
    }
    console.log(width + '×' + height + ' · Flask, alerta, A-01, interpretación, modal y caché protegida')
    await context.close()
  }
} finally {
  await browser.close()
}

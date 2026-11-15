import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { selectFirstAid } from '../src/app/firstAidGuidance.ts'
import { observationQuestions, medicalCards, indicatorContext } from '../src/app/observationContent.ts'
import { observationWarning } from '../src/app/observationMode.ts'

const spanish = /[¿¡áéíóúñ]|\b(?:pendiente|respuesta|siguiente|respiración|tripulación|información|observaciones|disponible|sangrado)\b/i

test('the English medical catalog covers every question, brief, and guidance step', () => {
  const scenarios = [
    ['A', { Q01: 'no', Q02: 'no' }, [1]],
    ['B', { Q01: 'no', Q02: 'yes' }, [2]],
    ['C', { Q06b: 'yes' }, []],
    ['D', { Q03: 'yes' }, []],
    ['E', { Q04: 'yes' }, [2]],
    ['F', { Q01: 'unknown' }, []],
  ]
  const copy = [observationWarning,
    ...observationQuestions.flatMap(({ prompt, applicability, options }) => [prompt, applicability, ...options.map(({ label }) => label)]),
    ...medicalCards.flatMap(({ title, scope, text, limit }) => [title, scope, text, limit]),
    ...Object.values(indicatorContext).map(({ text }) => text),
  ]
  for (const [id, entries, earthReferences] of scenarios) {
    const answers = new Map(Object.entries(entries).map(([key, value]) => [key, [value]]))
    const guide = selectFirstAid({ id: 'astro-01', name: 'Test Astronaut' }, answers, [], [])
    assert.equal(guide.id, id)
    assert.equal(guide.status, 'Pending Medical Review')
    assert.deepEqual(guide.steps.flatMap(([, , , kind], index) => kind === 'earth-reference' ? [index] : []), earthReferences)
    copy.push(guide.title, guide.evidence, ...guide.steps.flatMap(([label, title, text]) => [label, title, text]))
  }
  for (const text of copy) {
    assert.ok(text.trim())
    assert.doesNotMatch(text, spanish)
  }
})

test('HTML and PWA publish English language metadata', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
  const manifest = JSON.parse(await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'))
  assert.match(html, /<html lang="en">/)
  assert.equal(manifest.lang, 'en-US')
  assert.doesNotMatch(manifest.description, spanish)
})

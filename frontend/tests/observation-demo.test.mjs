import assert from 'node:assert/strict'
import test from 'node:test'
import { approvedAssistanceQuestions } from '../src/app/assistanceContent.ts'
import { observationDemo, observationQuestions, observationSources, medicalCards, indicatorContext } from '../src/app/observationContent.ts'
import { interpretObservation, observationQuestionAt, observationStepFor, resultStep } from '../src/app/observationInterpretation.ts'
import { selectFirstAid } from '../src/app/firstAidGuidance.ts'
import { allowsObservationDemo } from '../src/app/observationMode.ts'

test('el catálogo operativo queda pendiente y el documental solo se activa por opt-in de desarrollo en loopback', () => {
  assert.deepEqual(approvedAssistanceQuestions, [])
  assert.equal(observationDemo.status, 'pending-medical-review')
  assert.equal(allowsObservationDemo(true, 'true', '127.0.0.1'), true)
  assert.equal(allowsObservationDemo(false, 'true', '127.0.0.1'), false)
  assert.equal(allowsObservationDemo(true, undefined, 'localhost'), false)
  assert.equal(allowsObservationDemo(true, 'true', 'example.invalid'), false)
})

test('A-01 conserva identificación, referencias y respuesta indeterminada, con Q05 excluida', () => {
  assert.equal(observationDemo.id, 'A-01')
  assert.equal(observationDemo.excluded.id, 'Q05')
  assert.equal(observationDemo.groups.length, 4)
  assert.deepEqual(observationQuestions.map(({id}) => id), ['Q01','Q02','Q03','Q04','Q07','Q06a','Q06b','Q08a','Q08b'])
  const sources = new Set(observationSources.map(({id}) => id))
  assert.equal(sources.size, 11)
  for (const question of observationQuestions) {
    assert.equal(question.options.find(({id}) => id === 'unknown')?.label, 'Unable to determine')
    assert.ok(question.sourceIds.every((id) => sources.has(id)))
  }
  const cards = medicalCards.map(({id}) => id)
  assert.deepEqual(cards, ['C-01','C-02','C-03'])
  for (const context of Object.values(indicatorContext)) {
    assert.ok(context.cards.every((id) => cards.includes(id)))
    assert.ok(context.sources.every((id) => sources.has(id)))
  }
})

test('la ruta rápida prioriza respuesta, respiración y entorno, con observaciones opcionales', () => {
  assert.deepEqual([0,1,2,3].map(step => observationQuestionAt(step)?.id), ['Q01','Q02','Q06a','Q06b'])
  assert.equal(observationQuestionAt(resultStep), undefined)
  assert.equal(observationQuestionAt(observationStepFor('Q03'))?.id, 'Q03')
  assert.equal(observationQuestionAt(observationStepFor('Q05')), undefined)
})

test('sin datos o con sensor fallido se conserva incertidumbre y falta de evidencia', () => {
  assert.equal(interpretObservation(new Map()).priority, 'Insufficient Information')
  const result = interpretObservation(new Map([['Q01',['unknown']]]), [{quality:'sensor_fault'}])
  assert.equal(result.unknown, 1)
  assert.equal(result.failed, 1)
  assert.equal(result.situations.length, 0)
  assert.equal(result.flagged, false)
})

test('observaciones y avisos discordantes permanecen separados', () => {
  const normalBreathing = new Map([['Q02',['yes']]])
  const result = interpretObservation(normalBreathing, [{quality:'ok'}], [{variable:'spo2',severity:'critical'}])
  assert.equal(result.different, true)
  assert.equal(result.flagged, true)
  assert.equal(result.reason, 'Flask reported a critical alert.')
  assert.equal(result.situations.length, 0)
  const combination = interpretObservation(new Map([['Q01',['no']],['Q02',['no']]]))
  assert.equal(combination.flagged, true)
  assert.equal(combination.situations.length, 2)
  assert.match(combination.action, /authorized mission procedure/)
})

test('las seis guías siguen las observaciones y conservan incertidumbre y fuentes', () => {
  const cases = [
    ['A', { Q01: 'no', Q02: 'no' }],
    ['B', { Q01: 'no', Q02: 'yes' }],
    ['C', { Q06b: 'yes' }],
    ['D', { Q03: 'yes' }],
    ['E', { Q04: 'yes' }],
    ['F', { Q01: 'unknown' }],
  ]
  const select = (answers, readings = [], alerts = []) => selectFirstAid(
    { id: 'astro-02', name: 'Prueba' }, new Map(Object.entries(answers).map(([id, answer]) => [id, [answer]])), readings, alerts,
  )
  for (const [id, answers] of cases) {
    const guide = select(answers)
    assert.equal(guide.id, id)
    assert.equal(guide.steps.length, 3)
    assert.equal(guide.sources.length, guide.sourceIds.length)
    assert.equal(guide.uncertain, true)
  }
  const simultaneous = select({ Q01: 'no', Q02: 'no', Q06a: 'yes', Q03: 'yes', Q04: 'yes' })
  assert.equal(simultaneous.id, 'A')
  assert.deepEqual(simultaneous.additional.map(({id}) => id), ['C', 'D', 'E'])
  const latest = { measuredAtMs: 2, quality: 'sensor_fault' }
  const onlyTelemetry = select({}, [latest, { measuredAtMs: 1, quality: 'ok' }], [{ severity: 'critical', variable: 'spo2' }])
  assert.equal(onlyTelemetry.id, 'F')
  assert.equal(onlyTelemetry.critical, true)
  assert.equal(onlyTelemetry.latest, latest)
  assert.equal(onlyTelemetry.uncertain, true)
})

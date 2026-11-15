import assert from 'node:assert/strict'
import test from 'node:test'
import { approvedAssistanceQuestions, getApprovedAssistanceQuestions } from '../src/app/assistanceContent.ts'
import { answerQuestion, moveQuestion, questionProgress, startAssistanceSession } from '../src/app/assistanceSession.ts'

// Non-clinical structural fixtures. These definitions are never included in the app.
const options = [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]
const questions = [
  { id: 'single', kind: 'single', prompt: 'Prueba estructural 1', options },
  { id: 'multiple', kind: 'multiple', prompt: 'Prueba estructural 2', options },
]

test('el catálogo sin aprobación no habilita pasos ni respuestas', () => {
  const session = startAssistanceSession('astro-01')
  assert.equal(approvedAssistanceQuestions.length, 0)
  assert.equal(questionProgress(session, approvedAssistanceQuestions), null)
  assert.equal(moveQuestion(session, approvedAssistanceQuestions, 1), session)
  assert.equal(answerQuestion(session, approvedAssistanceQuestions, ['a']), session)
})

test('admite opción única y múltiple, progreso, regreso y corrección local', () => {
  const initial = startAssistanceSession('astro-01')
  assert.equal(moveQuestion(initial, questions, 1), initial)
  assert.equal(answerQuestion(initial, questions, ['a', 'b']), initial)
  assert.equal(answerQuestion(initial, questions, ['otra']), initial)
  const first = answerQuestion(initial, questions, ['a'])
  const second = moveQuestion(first, questions, 1)
  assert.deepEqual(questionProgress(second, questions), { current: 2, total: 2 })
  assert.equal(answerQuestion(second, questions, ['a', 'a']), second)
  const multiple = answerQuestion(second, questions, ['a', 'b'])
  const corrected = answerQuestion(moveQuestion(multiple, questions, -1), questions, ['b'])
  assert.deepEqual(corrected.answers.get('single'), ['b'])
  assert.deepEqual(corrected.answers.get('multiple'), ['a', 'b'])
  assert.equal(initial.answers.size, 0)
  assert.equal(answerQuestion(corrected, questions, []).answers.has('single'), false)
})

test('solo incorpora la versión aprobada y con fuentes trazables', () => {
  const approved = {
    status: 'approved',
    version: 'prueba-1',
    review: { reviewer: 'Prueba', reviewedOn: '2026-11-15', reference: 'Prueba', audience: 'Prueba', scope: 'Prueba' },
    sources: [{ id: 'fixture', organization: 'Prueba', title: 'Prueba', url: 'https://example.invalid', version: '1', accessedOn: '2026-11-15', section: 'Prueba' }],
    questions: questions.map((question) => ({ ...question, sourceIds: ['fixture'] })),
  }
  assert.equal(getApprovedAssistanceQuestions(approved), approved.questions)
  assert.deepEqual(getApprovedAssistanceQuestions({ ...approved, status: 'pending' }), [])
  assert.deepEqual(getApprovedAssistanceQuestions({ ...approved, review: { ...approved.review, reference: '' } }), [])
  assert.deepEqual(getApprovedAssistanceQuestions({ ...approved, sources: [] }), [])
  assert.deepEqual(getApprovedAssistanceQuestions({ ...approved, questions: [{ ...approved.questions[0], sourceIds: ['ausente'] }] }), [])
  assert.deepEqual(getApprovedAssistanceQuestions({ ...approved, questions: [approved.questions[0], approved.questions[0]] }), [])
})

test('finaliza solo con respuesta, vuelve para corregir y una sesión nueva empieza vacía', () => {
  const initial = startAssistanceSession('astro-01')
  const first = answerQuestion(initial, questions, ['a'])
  const last = moveQuestion(first, questions, 1)
  assert.equal(moveQuestion(last, questions, 1), last)
  const answered = answerQuestion(last, questions, ['a', 'b'])
  const complete = moveQuestion(answered, questions, 1)
  assert.equal(complete.astronautId, initial.astronautId)
  assert.equal(questionProgress(complete, questions), null)
  assert.equal(moveQuestion(complete, questions, 1), complete)
  const back = moveQuestion(complete, questions, -1)
  assert.deepEqual(back, answered)
  assert.deepEqual(answerQuestion(back, questions, ['b']).answers.get('multiple'), ['b'])
  assert.deepEqual(startAssistanceSession(complete.astronautId), initial)
})

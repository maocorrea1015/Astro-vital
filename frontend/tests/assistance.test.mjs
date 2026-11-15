import assert from 'node:assert/strict'
import test from 'node:test'
import { approvedAssistanceQuestions } from '../src/app/assistanceContent.ts'
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

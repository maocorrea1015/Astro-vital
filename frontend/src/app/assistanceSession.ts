export interface AssistanceQuestion {
  id: string
  kind: 'single' | 'multiple'
  prompt: string
  options: readonly { id: string; label: string }[]
}

export interface AssistanceSession {
  astronautId: string
  startedAtMs?: number
  observationAlertId?: number
  step: number
  answers: ReadonlyMap<string, readonly string[]>
}

export function startAssistanceSession(astronautId: string, startedAtMs?: number): AssistanceSession {
  return { astronautId, step: 0, answers: new Map(), ...(startedAtMs === undefined ? {} : { startedAtMs }) }
}

export function questionProgress(session: AssistanceSession, questions: readonly AssistanceQuestion[]) {
  if (!questions[session.step]) return null
  return { current: session.step + 1, total: questions.length }
}

export function answerQuestion(
  session: AssistanceSession,
  questions: readonly AssistanceQuestion[],
  optionIds: readonly string[],
): AssistanceSession {
  const question = questions[session.step]
  if (
    !question || (question.kind === 'single' && optionIds.length > 1)
    || new Set(optionIds).size !== optionIds.length
    || !optionIds.every((id) => question.options.some((option) => option.id === id))
  ) return session

  const answers = new Map(session.answers)
  if (optionIds.length) answers.set(question.id, [...optionIds])
  else answers.delete(question.id)
  return { ...session, answers }
}

export function moveQuestion(
  session: AssistanceSession,
  questions: readonly AssistanceQuestion[],
  direction: -1 | 1,
): AssistanceSession {
  const question = questions[session.step]
  const step = session.step + direction
  if (direction === -1 && !questions[step]) return session
  if (direction === 1 && (!question || !session.answers.has(question.id))) return session
  return { ...session, step }
}

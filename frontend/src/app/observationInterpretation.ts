import type { Alert, Reading } from '../services/api/adapters.ts'
import type { AssistanceSession } from './assistanceSession.ts'
import { observationQuestions } from './observationContent.ts'

export const coreIds = ['Q01', 'Q02', 'Q06a', 'Q06b'] as const
export const resultStep = coreIds.length
export const optionalQuestions = observationQuestions.filter(({ id }) => !coreIds.some((core) => core === id))
const coreQuestions = coreIds.map((id) => observationQuestions.find((question) => question.id === id)!)

export function observationQuestionAt(step: number) {
  return step < resultStep ? coreQuestions[step] : optionalQuestions[step - resultStep - 1]
}

export function observationStepFor(id: string) {
  const core = coreQuestions.findIndex((question) => question.id === id)
  return core >= 0 ? core : resultStep + 1 + optionalQuestions.findIndex((question) => question.id === id)
}

export function interpretObservation(answers: AssistanceSession['answers'], readings: readonly Reading[] = [], alerts: readonly Alert[] = []) {
  const observation = (id: string) => answers.get(id)?.[0]
  const pending = coreIds.filter((id) => !observation(id)).length
  const unknown = [...answers.values()].filter(([value]) => value === 'unknown').length
  const critical = alerts.some((alert) => alert.severity === 'critical')
  const support = observation('Q01') === 'no' && observation('Q02') === 'no'
  const situations = [
    observation('Q01') === 'no' && { title: 'Falta de respuesta observada', evidence: 'Q01 · No responde', related: 'Frecuencia cardíaca y actividad aportan contexto.' },
    observation('Q02') === 'no' && { title: 'Respiración anormal reportada', evidence: 'Q02 · No respira o presenta boqueos o jadeos', related: 'Consulta la SpO₂ y su calidad por separado.' },
    observation('Q06b') === 'yes' && { title: 'Alarma o entorno hostil reportado', evidence: 'Q06b · Sí', related: 'La observación requiere contraste con el estado del entorno.' },
    observation('Q06a') === 'yes' && { title: 'Contexto EVA o traje espacial', evidence: 'Q06a · Sí', related: 'El contexto operativo no determina la causa del evento.' },
    observation('Q03') === 'yes' && { title: 'Trauma o sangrado reportado', evidence: 'Q03 · Evidencia visible', related: 'La telemetría no confirma la observación visual.' },
    observation('Q04') === 'yes' && { title: 'Antecedente de atragantamiento', evidence: 'Q04 · Sí', related: 'El antecedente requiere valoración independiente.' },
    observation('Q07') === 'yes' && { title: 'Fluidos visibles reportados', evidence: 'Q07 · Sí', related: 'Registro visual, independiente de los sensores.' },
    critical && alerts.some((alert) => alert.variable === 'heart_rate' && alert.severity === 'critical') &&
      { title: 'Aviso cardiovascular reportado', evidence: 'Flask · Alerta crítica de frecuencia cardíaca', related: 'El aviso no establece la causa ni el estado de conciencia.' },
  ].filter((item): item is { title: string; evidence: string; related: string } => item !== false).slice(0, 3)
  const different = observation('Q02') === 'yes' && alerts.some((alert) => alert.variable === 'spo2')
  const failed = readings.filter((reading) => reading.quality === 'sensor_fault').length
  const degraded = readings.filter((reading) => reading.quality === 'degraded').length

  return {
    priority: critical || support ? 'Priorizar contacto' : situations.length ? 'Solicitar valoración' : 'Información insuficiente',
    flagged: critical || support,
    reason: support ? 'Se reportaron falta de respuesta y respiración anormal.' : critical ? 'Flask reportó una alerta crítica.' : situations.length ? 'Hay observaciones concretas para revisar.' : 'El registro disponible no permite orientar la valoración.',
    pending, unknown, situations, failed, degraded, different,
    action: 'Contacta al CMO o al canal médico según el procedimiento autorizado de la misión. Si la situación preocupa, pide ayuda sin esperar a completar la evaluación.',
  }
}

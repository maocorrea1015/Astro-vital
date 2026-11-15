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
    observation('Q01') === 'no' && { title: 'Observed unresponsiveness', evidence: 'Q01 · Does not respond', related: 'Heart rate and activity provide context.' },
    observation('Q02') === 'no' && { title: 'Reported abnormal breathing', evidence: 'Q02 · Not breathing or only gasping', related: 'Review SpO₂ and its quality separately.' },
    observation('Q06b') === 'yes' && { title: 'Reported alarm or hazardous environment', evidence: 'Q06b · Yes', related: 'Compare this observation with the environmental status.' },
    observation('Q06a') === 'yes' && { title: 'EVA or spacesuit context', evidence: 'Q06a · Yes', related: 'The mission context does not establish the cause of the event.' },
    observation('Q03') === 'yes' && { title: 'Reported trauma or bleeding', evidence: 'Q03 · Visible evidence', related: 'Telemetry does not confirm the visual observation.' },
    observation('Q04') === 'yes' && { title: 'History of choking', evidence: 'Q04 · Yes', related: 'This history requires independent assessment.' },
    observation('Q07') === 'yes' && { title: 'Reported visible fluids', evidence: 'Q07 · Yes', related: 'Visual observation independent of sensor data.' },
    critical && alerts.some((alert) => alert.variable === 'heart_rate' && alert.severity === 'critical') &&
      { title: 'Reported cardiovascular alert', evidence: 'Flask · Critical heart rate alert', related: 'The alert does not establish the cause or the level of consciousness.' },
  ].filter((item): item is { title: string; evidence: string; related: string } => item !== false).slice(0, 3)
  const different = observation('Q02') === 'yes' && alerts.some((alert) => alert.variable === 'spo2')
  const failed = readings.filter((reading) => reading.quality === 'sensor_fault').length
  const degraded = readings.filter((reading) => reading.quality === 'degraded').length

  return {
    priority: critical || support ? 'Prioritize Contact' : situations.length ? 'Request Assessment' : 'Insufficient Information',
    flagged: critical || support,
    reason: support ? 'Unresponsiveness and abnormal breathing were reported.' : critical ? 'Flask reported a critical alert.' : situations.length ? 'Specific observations are available for review.' : 'The available record is insufficient to guide assessment.',
    pending, unknown, situations, failed, degraded, different,
    action: 'Contact the CMO or medical channel according to authorized mission procedure. If you are concerned, request help without waiting to complete the assessment.',
  }
}

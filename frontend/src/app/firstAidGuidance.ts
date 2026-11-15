import type { Alert, Astronaut, Reading } from '../services/api/adapters.ts'
import type { AssistanceSession } from './assistanceSession.ts'
import { observationSources } from './observationContent.ts'

type GuideId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
type Step = readonly [label: string, title: string, text: string]
const contact: Step = ['Coordinación', 'Contactar al canal autorizado', 'Solicita apoyo del CMO o del canal médico según el procedimiento de misión, sin esperar a completar la guía.']
const terrestrial: Step = ['Límite espacial', 'Aplicabilidad pendiente', 'La ficha v0.1 carece de una técnica validada para microgravedad o EVA. Sigue únicamente los procedimientos autorizados para la misión.']
const catalog: Record<GuideId, { title: string; sourceIds: string[]; steps: readonly Step[] }> = {
  A: { title: 'Falta de respuesta y respiración anormal reportadas', sourceIds: ['R10','R08','R05'], steps: [
    ['Posible emergencia vital', 'Activa el procedimiento de misión', 'Se declararon falta de respuesta y ausencia de respiración normal o boqueos. Solicita al CMO o al canal médico de inmediato.'],
    ['Referencia terrestre · Personal capacitado', 'Soporte vital básico terrestre', 'C-01 documenta activación de emergencias, compresiones y disponibilidad de un DEA en soporte vital básico terrestre. El personal capacitado sigue su protocolo y la orientación del servicio de emergencias terrestre.'],
    terrestrial,
  ] },
  B: { title: 'Falta de respuesta con respiración observable', sourceIds: ['R08','R10','R05'], steps: [
    contact, ['Observación', 'Registrar cambios observables', 'Mantén atención a cambios visibles, especialmente en la respiración. Comunica lo observado y cuándo cambió.'],
    ['Referencia terrestre', 'Posición de recuperación · Alcance documental', 'C-02 documenta la posición lateral en fuentes terrestres. La ficha no localizó validación en microgravedad. Evita movilizaciones fuera de un protocolo autorizado.'],
  ] },
  C: { title: 'Entorno operativo reportado', sourceIds: ['R02','R05','R07'], steps: [
    ['Coordinación', 'Activar el procedimiento de seguridad de misión', 'Comunica la alarma ambiental o el contexto EVA declarado al personal responsable y al canal autorizado.'],
    ['Evidencia', 'Separar observación y sensor', 'Comunica qué condición se vio o fue reportada y, por separado, qué variable midió el sensor y con qué calidad.'],
    ['Límite espacial', 'Conservar la incertidumbre', 'El contexto y las lecturas por sí solos no identifican hipoxia, intoxicación ni descompresión. La ficha no autoriza rescate ni modificaciones del traje.'],
  ] },
  D: { title: 'Trauma o sangrado visible reportado', sourceIds: ['R08','R10','R05'], steps: [
    ['Coordinación', 'Comunicar el hallazgo al CMO', 'Activa el procedimiento de misión y comunica qué se observó y cuándo.'], contact,
    ['Límite espacial', 'Esperar orientación autorizada', 'La ficha no aporta técnicas de inmovilización o movilización validadas en microgravedad.'],
  ] },
  E: { title: 'Antecedente de atragantamiento reportado', sourceIds: ['R10','R05'], steps: [
    contact, ['Evidencia', 'Comunicar el antecedente', 'Describe el episodio observado o conocido. El antecedente no confirma la causa de la falta de respuesta.'],
    ['Referencia terrestre', 'Obstrucción de vía aérea en fuentes AHA', 'La AHA documenta maniobras en el entorno terrestre. La ficha no permite trasladarlas a microgravedad. Sigue el procedimiento autorizado de misión.'],
  ] },
  F: { title: 'Información insuficiente', sourceIds: ['R05','R09'], steps: [
    ['Incertidumbre', 'Identificar qué falta', 'Separa las observaciones no determinadas de las mediciones ausentes o fallidas y los avisos disponibles.'],
    contact, ['Comunicación', 'Preparar el contexto observable', 'Comunica la identificación, las observaciones, la hora, la calidad de las muestras y los avisos reportados. La ausencia de datos no demuestra ausencia de riesgo.'],
  ] },
}

export function selectFirstAid(astronaut: Astronaut, answers: AssistanceSession['answers'], readings: readonly Reading[], alerts: readonly Alert[]) {
  const value = (id: string) => answers.get(id)?.[0]
  const candidates: [GuideId, boolean, string][] = [
    ['A', value('Q01') === 'no' && value('Q02') === 'no', 'Q01 · Falta de respuesta y Q02 · Respiración anormal'],
    ['C', value('Q06a') === 'yes' || value('Q06b') === 'yes', [value('Q06a') === 'yes' && 'Q06a · EVA o traje', value('Q06b') === 'yes' && 'Q06b · Alarma o entorno reportado'].filter(Boolean).join(' · ')],
    ['D', value('Q03') === 'yes', 'Q03 · Trauma o sangrado visible'],
    ['E', value('Q04') === 'yes', 'Q04 · Antecedente de atragantamiento'],
    ['B', value('Q01') === 'no' && value('Q02') === 'yes', 'Q01 · Falta de respuesta y Q02 · Respiración normal reportada'],
  ]
  const matches = candidates.filter(([, matches]) => matches)
  const [id, , evidence] = matches[0] ?? ['F', true, 'Sin una combinación observacional para las otras guías.']
  const selection = catalog[id]
  return { ...selection, id, evidence, astronaut, scenario: 'A-01', version: 'v0.1', status: 'Pendiente de revisión médica',
    additional: matches.slice(1).map(([id]) => ({ id, title: catalog[id].title })),
    uncertain: !readings.length || readings.some(({ quality }) => quality !== 'ok') || answers.size === 0 || [...answers.values()].some(([a]) => a === 'unknown')
      || (value('Q02') === 'yes' && alerts.some(({ variable }) => variable === 'spo2')),
    latest: readings.reduce<Reading | undefined>((current, reading) => !current || current.measuredAtMs < reading.measuredAtMs ? reading : current, undefined),
    critical: alerts.some(({ severity }) => severity === 'critical'),
    sources: observationSources.filter(({ id }) => selection.sourceIds.includes(id)),
  }
}

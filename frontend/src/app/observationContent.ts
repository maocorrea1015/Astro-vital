import type { AssistanceSource } from './assistanceContent.ts'
import type { AssistanceQuestion } from './assistanceSession.ts'

function source(id: string, organization: string, title: string, url: string, version: string, section: string): AssistanceSource {
  return { id, organization, title, url, version, section, accessedOn: '2026-11-15' }
}

export const observationSources = [
  source('R01', 'NASA', 'Risks of Human Spaceflight', 'https://www.nasa.gov/hrp/risks/', '21 jul 2026', 'Human Physiology / Behavioral Performance / Space Radiation'),
  source('R02', 'NASA', '5 Hazards of Human Spaceflight', 'https://www.nasa.gov/hrp/hazards/', '12 jun 2026', 'Distance, Gravity, Hostile Environments y Radiation'),
  source('R03', 'NASA', 'Ongoing HRP Research', 'https://www.nasa.gov/hrp/ongoing-hrp-research/', 'No indicada', 'Human Investigations'),
  source('R04', 'Canadian Space Agency', 'Monitoring radiation for astronaut health', 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp', '26 feb 2026', 'Instrumento CANS'),
  source('R05', 'NASA', '6.0 Medical Operations (NASA-STD-3001 Vol. 1)', 'https://www.nasa.gov/reference/6-0-medical-operations/', '21 abr 2026', '6.0, 6.1, 6.2, 6.3, 6.4 y 6.5'),
  source('R06', 'IFRC', 'International first aid, resuscitation and education guidelines', 'https://www.ifrc.org/document/international-first-aid-resuscitation-and-education-guidelines', '17 nov 2020', 'Descripción general de directrices'),
  source('R07', 'NASA', '5.0 Training (NASA-STD-3001 Vol. 1)', 'https://www.nasa.gov/reference/5-0-training/', '21 abr 2026', '5.1, 5.2 y 5.3'),
  source('R08', 'American Red Cross', 'First Aid for Someone Unresponsive & Breathing', 'https://www.redcross.org/take-a-class/resources/learn-first-aid/unresponsive-and-breathing-person', 'Fecha exacta no indicada', 'Unresponsive & Breathing Person / General Care'),
  source('R09', 'NASA', 'NASA Spaceflight Human System Standard Vol. 1: Crew Health', 'https://www.nasa.gov/reference/nasa-std-3001v1/', '8 abr 2026', 'Foreword / 1.0 Scope'),
  source('R10', 'American Heart Association', 'Part 7: Adult Basic Life Support (Guías 2025)', 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support', 'Circulation 2025', '6.1, 6.3, 8.3, 10.1, 10.2 y 12'),
  source('R11', 'Canadian Space Agency', 'Why do we conduct science experiments in space?', 'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp', 'No indicada', 'Preparing for deep-space destinations'),
] as const

export interface ObservationQuestion extends AssistanceQuestion {
  sourceIds: readonly string[]
  applicability: 'Terrestre' | 'Terrestre sin validación espacial' | 'Contexto espacial documentado'
}

function question(id: string, prompt: string, labels: readonly [string, string], sourceIds: readonly string[], applicability: ObservationQuestion['applicability'] = 'Terrestre'): ObservationQuestion {
  return {
    id, kind: 'single', prompt, sourceIds, applicability,
    options: [{ id: 'yes', label: labels[0] }, { id: 'no', label: labels[1] }, { id: 'unknown', label: 'No se puede determinar' }],
  }
}

export const observationDemo = {
  id: 'A-01',
  title: 'Tripulante que no responde ante un intento de comunicación',
  version: 'v0.1',
  date: '2026-11-15',
  status: 'pending-medical-review',
  audience: 'Participantes en un ensayo educativo con datos sintéticos',
  excluded: { id: 'Q05', reason: 'Comprobación de pulso carotídeo reservada a personal con formación y autorización verificables.', sourceIds: ['R10'] },
  groups: [
    { title: 'Respuesta y respiración', questions: [
      question('Q01', '¿El astronauta responde o se mueve ante el intento de comunicación?', ['Responde, habla o se mueve', 'No responde'], ['R08', 'R10']),
      question('Q02', '¿Se observa movimiento del tórax o respiración normal?', ['Respira con normalidad', 'No respira o presenta boqueos o jadeos'], ['R08', 'R10']),
    ] },
    { title: 'Observaciones y antecedentes', questions: [
      question('Q03', '¿Existe sangrado masivo visible o evidencia de traumatismo en cabeza o cuello?', ['Sí, existe evidencia visible', 'No se observa'], ['R08', 'R10']),
      question('Q04', '¿Hay un antecedente visible o conocido de atragantamiento antes de la falta de respuesta?', ['Sí', 'No'], ['R10'], 'Terrestre sin validación espacial'),
      question('Q07', '¿Se observa vómito, sangre o fluidos visibles en la boca del tripulante?', ['Sí', 'No'], ['R08']),
    ] },
    { title: 'Entorno operativo', questions: [
      question('Q06a', '¿El astronauta está en una operación EVA o dentro de un traje espacial?', ['Sí', 'No'], ['R01', 'R02', 'R07'], 'Contexto espacial documentado'),
      question('Q06b', '¿Existe una alarma ambiental activa o evidencia reportada de un entorno hostil?', ['Sí', 'No'], ['R01', 'R02', 'R07'], 'Contexto espacial documentado'),
    ] },
    { title: 'Disponibilidad de apoyo', questions: [
      question('Q08a', '¿Está disponible un Oficial Médico de la Tripulación (CMO)?', ['Sí', 'No'], ['R05', 'R07'], 'Contexto espacial documentado'),
      question('Q08b', '¿Está disponible el canal de comunicación con Tierra?', ['Sí', 'No'], ['R02', 'R05'], 'Contexto espacial documentado'),
    ] },
  ],
} as const

export const observationQuestions = observationDemo.groups.flatMap(({ questions }) => [...questions])

export const medicalCards = [
  { id: 'C-01', title: 'Reconocimiento inicial', scope: 'Referencia terrestre sin validación espacial',
    text: 'La ficha reúne literatura terrestre sobre reconocimiento de falta de respuesta y respiración observable. Registra lo observado y las dudas de interpretación, especialmente sin entrenamiento.',
    limit: 'La ficha no localizó evidencia aplicable al reconocimiento dentro de un traje EVA o en microgravedad.', sources: ['R08', 'R10', 'R06'] },
  { id: 'C-02', title: 'Falta de respuesta con respiración observable', scope: 'Referencia terrestre sin validación espacial',
    text: 'Las fuentes terrestres estudian la respiración espontánea y el riesgo de aspiración en este escenario.',
    limit: 'La ficha no localizó evidencia que valide la posición de recuperación en microgravedad. La aplicación operativa requiere una pauta espacial revisada.', sources: ['R08', 'R10'] },
  { id: 'C-03', title: 'Operaciones médicas espaciales', scope: 'Contexto espacial documentado',
    text: 'La ficha remite a NASA-STD-3001 para formación, rol del CMO, apoyo desde Tierra y privacidad de comunicaciones médicas.',
    limit: 'La disponibilidad del apoyo depende del perfil de misión y la distancia. La disponibilidad que se registre en la demo es descriptiva.', sources: ['R09', 'R07', 'R05', 'R02', 'R01'] },
] as const

export const indicatorContext = {
  heart_rate: { text: 'La frecuencia cardíaca aporta contexto cardiovascular. La ficha señala que el movimiento y el contacto del sensor pueden afectar la señal.', cards: ['C-01'], sources: ['R01', 'R10'] },
  spo2: { text: 'La SpO₂ aporta contexto sobre la oxigenación periférica. La ficha describe el movimiento y la perfusión como limitaciones de lectura. El origen de una variación requiere evaluación independiente.', cards: ['C-01', 'C-02'], sources: ['R01', 'R10'] },
  temperature: { text: 'La temperatura aporta contexto térmico. La ficha no localizó umbrales de temperatura asociados a pérdida de respuesta en microgravedad.', cards: ['C-01'], sources: ['R08'] },
  activity: { text: 'El registro de movimiento es un indicador contextual propuesto por el equipo. La inmovilidad por sí sola no permite determinar el estado de conciencia.', cards: ['C-01', 'C-03'], sources: ['R05'] },
  radiation_cpm: { text: 'La lectura describe radiación ambiental en CPM. La ficha remite a investigación de exposición espacial. La cifra de esta interfaz no permite determinar una dosis individual ni un evento fisiológico agudo.', cards: ['C-03'], sources: ['R04', 'R01'] },
} as const

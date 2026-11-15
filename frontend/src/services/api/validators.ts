import type {
  AcknowledgeReceiptDto,
  ActiveAlertDto,
  AlertDto,
  AstronautDto,
  AstronautStatusDto,
  BaselineDto,
  ErrorDto,
  HealthDto,
  HistoricalReadingDto,
  NoteDto,
  NoteReceiptDto,
  ReadingDto,
} from './contracts.ts'

type Check = (value: unknown) => boolean
export type Decoder<T> = (value: unknown) => T

export class ContractError extends Error {
  readonly responseType: string

  constructor(responseType: string) {
    super(`Respuesta incompatible con el contrato: ${responseType}.`)
    this.name = 'ContractError'
    this.responseType = responseType
  }
}

function shape<T extends object>(fields: { [K in keyof T]-?: Check }) {
  return (value: unknown): value is T => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
    const record = value as Record<string, unknown>
    return Object.entries<Check>(fields).every(([field, check]) => check(record[field]))
  }
}

function list<T>(check: (value: unknown) => value is T) {
  return (value: unknown): value is T[] => Array.isArray(value) && value.every(check)
}

function decode<T>(name: string, check: (value: unknown) => value is T): Decoder<T> {
  return (value) => {
    if (!check(value)) throw new ContractError(name)
    return value
  }
}

const text = (value: unknown) => typeof value === 'string'
const finite = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const positiveId = (value: unknown) => count(value) && value !== 0
const timestamp = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 8.64e12
const oneOf = <T extends string | number>(...values: T[]): Check => (value) => values.some((item) => item === value)
const nullable = (check: Check): Check => (value) => value === null || check(value)
export const isAstronautId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,32}$/.test(value)
const variable = oneOf('heart_rate', 'spo2', 'temperature', 'radiation_cpm', 'activity')

const astronautFields = {
  astronaut_id: isAstronautId,
  nombre: text,
  estado_general: oneOf('normal', 'warning', 'critical'),
  estado_conexion: oneOf('online', 'offline'),
  ultimo_contacto: (value: unknown) => value === 0 || timestamp(value),
}
const readingFields = { variable, valor: finite, ts: timestamp, calidad: oneOf('ok', 'degraded', 'sensor_fault') }
const alertFields = {
  id: positiveId, ts: timestamp, variable, valor: finite,
  severidad: oneOf('info', 'warning', 'critical'), mensaje: text, guia: text,
}
const checkAstronaut = shape<AstronautDto>(astronautFields)
const checkReading = shape<ReadingDto>(readingFields)
const checkActiveAlert = shape<ActiveAlertDto>(alertFields)
const checkBaseline = shape<BaselineDto>({ variable, promedio: finite, desviacion: finite, muestras: count })
const checkGuide = shape<NonNullable<AstronautStatusDto['guia_actual']>>({ mensaje: text, guia: text })
const checkHistory = shape<HistoricalReadingDto>({ ...readingFields, id: positiveId, astronaut_id: isAstronautId })
const checkAlert = shape<AlertDto>({
  ...alertFields, astronaut_id: isAstronautId, reconocida: oneOf(0, 1),
  reconocida_en: nullable(timestamp), creado_en: timestamp,
})
const checkNote = shape<NoteDto>({
  id: positiveId, astronaut_id: isAstronautId, ts: timestamp, texto: text, creado_en: timestamp,
})

export const decodeHealth = decode('salud del servicio', shape<HealthDto>({ status: oneOf('ok'), service: text }))
export const decodeAstronauts = decode('lista de astronautas', list(checkAstronaut))
export const decodeAstronautStatus = decode('estado de astronauta', shape<AstronautStatusDto>({
  ...astronautFields, lecturas: list(checkReading), alertas_activas: list(checkActiveAlert),
  linea_base: list(checkBaseline), guia_actual: nullable(checkGuide),
}))
export const decodeReadings = decode('historial de lecturas', list(checkHistory))
export const decodeAlerts = decode('lista de alertas', list(checkAlert))
export const decodeNotes = decode('lista de notas', list(checkNote))
export const decodeNoteReceipt = decode('confirmación de nota', shape<NoteReceiptDto>({ nota_id: positiveId }))
export const decodeAcknowledgeReceipt = decode('confirmación de reconocimiento', shape<AcknowledgeReceiptDto>({ status: oneOf('ok') }))

export const decodeError = decode('error HTTP', shape<ErrorDto>({
  error: text,
  retry_after: (value) => value === undefined || count(value),
}))

import type {
  ActiveAlertDto, AlertDto, AlertSeverity, AstronautDto, AstronautStatusDto,
  ConnectionStatus, GeneralStatus, HistoricalReadingDto, NoteDto, ReadingDto, SensorQuality, Variable,
} from './contracts.ts'

export type MeasurementUnit = 'bpm' | '%' | '°C' | 'CPM'
export type Freshness = 'unknown' | 'recent' | 'stale'

export interface Astronaut {
  id: string
  name: string
  reportedStatus: GeneralStatus
  connection: ConnectionStatus
  lastContactAtMs: number | null
}

export interface Reading {
  variable: Variable
  value: number
  unit: MeasurementUnit | null
  measuredAtMs: number
  quality: SensorQuality
  source: 'unknown'
}

export interface HistoricalReading extends Reading {
  id: number
  astronautId: string
}

export interface Alert {
  id: number
  variable: Variable
  value: number
  severity: AlertSeverity
  reportedMessage: string
  measuredAtMs: number
  acknowledged: boolean
  acknowledgedAtMs: number | null
  source: 'unknown'
}

export interface Baseline {
  variable: Variable
  mean: number
  standardDeviation: number
  sampleCount: number
}

export interface AstronautStatus extends Astronaut {
  readings: Reading[]
  activeAlerts: Alert[]
  baselines: Baseline[]
}

export interface Note {
  id: number
  astronautId: string
  recordedAtMs: number
  text: string
  createdAtMs: number
}

const units: Record<Variable, MeasurementUnit | null> = {
  heart_rate: 'bpm',
  spo2: '%',
  temperature: '°C',
  radiation_cpm: 'CPM',
  activity: null,
}

export function adaptAstronaut(dto: AstronautDto): Astronaut {
  return {
    id: dto.astronaut_id,
    name: dto.nombre,
    reportedStatus: dto.estado_general,
    connection: dto.estado_conexion,
    lastContactAtMs: dto.ultimo_contacto === 0 ? null : dto.ultimo_contacto * 1000,
  }
}

export function adaptReading(dto: ReadingDto): Reading {
  return {
    variable: dto.variable,
    value: dto.valor,
    unit: units[dto.variable],
    measuredAtMs: dto.ts * 1000,
    quality: dto.calidad,
    source: 'unknown',
  }
}

export function adaptHistoricalReading(dto: HistoricalReadingDto): HistoricalReading {
  return { ...adaptReading(dto), id: dto.id, astronautId: dto.astronaut_id }
}

function adaptReportedAlert(dto: ActiveAlertDto, acknowledged: boolean, acknowledgedAtMs: number | null): Alert {
  return {
    id: dto.id, variable: dto.variable, value: dto.valor, severity: dto.severidad,
    reportedMessage: dto.mensaje, measuredAtMs: dto.ts * 1000, source: 'unknown',
    acknowledged, acknowledgedAtMs,
  }
}

export function adaptAlert(dto: AlertDto): Alert {
  return adaptReportedAlert(dto, dto.reconocida === 1, dto.reconocida_en === null ? null : dto.reconocida_en * 1000)
}

export function adaptAstronautStatus(dto: AstronautStatusDto): AstronautStatus {
  return {
    ...adaptAstronaut(dto),
    readings: dto.lecturas.map(adaptReading),
    activeAlerts: dto.alertas_activas.map((alert) => adaptReportedAlert(alert, false, null)),
    baselines: dto.linea_base.map((entry) => ({
      variable: entry.variable, mean: entry.promedio,
      standardDeviation: entry.desviacion, sampleCount: entry.muestras,
    })),
  }
}

export function adaptNote(dto: NoteDto): Note {
  return {
    id: dto.id, astronautId: dto.astronaut_id, recordedAtMs: dto.ts * 1000,
    text: dto.texto, createdAtMs: dto.creado_en * 1000,
  }
}

export function formatTimestamp(timestampMs: number | null, locale: string, timeZone: string): string | null {
  if (timestampMs === null) return null
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(timestampMs)
}

export function getFreshness(measuredAtMs: number, nowMs: number, maxAgeMs?: number): Freshness {
  const age = nowMs - measuredAtMs
  if (maxAgeMs === undefined || !Number.isFinite(maxAgeMs) || maxAgeMs < 0 || !Number.isFinite(age) || age < 0) {
    return 'unknown'
  }
  return age > maxAgeMs ? 'stale' : 'recent'
}

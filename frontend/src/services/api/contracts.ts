export type AstronautId = string
export type GeneralStatus = 'normal' | 'warning' | 'critical'
export type ConnectionStatus = 'online' | 'offline'
export type Variable = 'heart_rate' | 'spo2' | 'temperature' | 'radiation_cpm' | 'activity'
export type SensorQuality = 'ok' | 'degraded' | 'sensor_fault'
export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface HealthDto {
  status: 'ok'
  service: string
}

export interface ErrorDto {
  error: string
  retry_after?: number
}

export interface AstronautDto {
  astronaut_id: AstronautId
  nombre: string
  estado_general: GeneralStatus
  estado_conexion: ConnectionStatus
  ultimo_contacto: number
}

export interface ReadingDto {
  variable: Variable
  valor: number
  ts: number
  calidad: SensorQuality
}

export interface HistoricalReadingDto extends ReadingDto {
  id: number
  astronaut_id: AstronautId
}

export interface ActiveAlertDto {
  id: number
  ts: number
  variable: Variable
  valor: number
  severidad: AlertSeverity
  mensaje: string
  guia: string
}

export interface AlertDto extends ActiveAlertDto {
  astronaut_id: AstronautId
  reconocida: 0 | 1
  reconocida_en: number | null
  creado_en: number
}

export interface BaselineDto {
  variable: Variable
  promedio: number
  desviacion: number
  muestras: number
}

export interface AstronautStatusDto extends AstronautDto {
  lecturas: ReadingDto[]
  alertas_activas: ActiveAlertDto[]
  linea_base: BaselineDto[]
  guia_actual: Pick<ActiveAlertDto, 'mensaje' | 'guia'> | null
}

export interface NoteDto {
  id: number
  astronaut_id: AstronautId
  ts: number
  texto: string
  creado_en: number
}

export interface CreateNoteDto {
  texto: string
  ts?: number
}

export interface NoteReceiptDto {
  nota_id: number
}

export interface AcknowledgeReceiptDto {
  status: 'ok'
}

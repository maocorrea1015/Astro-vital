import { formatTimestamp, type Reading } from '../services/api/adapters'

export const variables: Record<Reading['variable'], string> = {
  heart_rate: 'Frecuencia cardíaca',
  spo2: 'Saturación de oxígeno',
  temperature: 'Temperatura',
  radiation_cpm: 'Radiación',
  activity: 'Actividad',
}

export const qualities: Record<Reading['quality'], string> = {
  ok: 'Válida según la fuente',
  degraded: 'Degradada',
  sensor_fault: 'Fallo del sensor',
}

export function displayTime(timestampMs: number | null) {
  const formatted = formatTimestamp(timestampMs, 'es-CO', 'UTC')
  return formatted === null ? 'Sin contacto registrado' : `${formatted} UTC`
}

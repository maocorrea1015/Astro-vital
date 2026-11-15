import type { CrewMemberItem, MeasurementIndicatorProps, MeasurementTrendProps } from '../features/crew/components/index.ts'
import type { AlertsPanelItem } from '../features/alerts/components/index.ts'
import { formatTimestamp, type Alert, type Astronaut, type Reading } from '../services/api/adapters.ts'

export const variables: Record<Reading['variable'], string> = {
  heart_rate: 'Frecuencia cardíaca',
  spo2: 'Saturación de oxígeno',
  temperature: 'Temperatura',
  radiation_cpm: 'Radiación',
  activity: 'Actividad',
}

export function displayTime(timestampMs: number | null) {
  const formatted = formatTimestamp(timestampMs, 'es-CO', 'UTC')
  return formatted === null ? 'Sin contacto registrado' : `${formatted} UTC`
}

export function toCrewMember(astronaut: Astronaut): CrewMemberItem {
  return {
    id: astronaut.id,
    name: astronaut.name,
    generalStatus: astronaut.reportedStatus,
    connectionStatus: astronaut.connection,
    lastContactFormatted: astronaut.lastContactAtMs === null ? null : displayTime(astronaut.lastContactAtMs),
  }
}

export function toMeasurementIndicator(reading: Reading): MeasurementIndicatorProps {
  return {
    variable: reading.variable,
    variableLabel: variables[reading.variable],
    value: reading.value,
    unit: reading.unit,
    quality: reading.quality,
    timeFormatted: displayTime(reading.measuredAtMs),
  }
}

export function toMeasurementTrends(readings: readonly Reading[]): MeasurementTrendProps[] {
  const trends = new Map<Reading['variable'], MeasurementTrendProps>()
  for (const reading of readings) {
    let trend = trends.get(reading.variable)
    if (!trend) {
      trend = { variable: reading.variable, variableLabel: variables[reading.variable], unit: reading.unit, points: [] }
      trends.set(reading.variable, trend)
    }
    trend.points.push({
      timestamp: reading.measuredAtMs / 1000,
      timeFormatted: displayTime(reading.measuredAtMs),
      value: reading.value,
      quality: reading.quality,
    })
  }
  return [...trends.values()].map((trend) => ({
    ...trend,
    points: trend.points.sort((a, b) => a.timestamp - b.timestamp),
  }))
}

export function toActiveAlert(alert: Alert): AlertsPanelItem {
  return {
    id: alert.id,
    severity: alert.severity,
    variable: alert.variable,
    variableLabel: variables[alert.variable],
    message: 'Aviso para revisión · Contenido pendiente de validación',
    timeFormatted: displayTime(alert.measuredAtMs),
    acknowledged: alert.acknowledged,
  }
}

import type { CrewMemberItem, MeasurementIndicatorProps } from '../features/crew/components'
import { formatTimestamp, type Astronaut, type Reading } from '../services/api/adapters'

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

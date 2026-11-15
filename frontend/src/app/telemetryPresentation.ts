import type { CrewMemberItem, MeasurementIndicatorProps, MeasurementTrendProps } from '../features/crew/components/index.ts'
import type { AlertsPanelItem } from '../features/alerts/components/index.ts'
import { formatTimestamp, type Alert, type Astronaut, type Reading } from '../services/api/adapters.ts'

export function astronautLabel({ name, id }: Pick<Astronaut, 'name' | 'id'>) {
  // Localize the documented demo labels while preserving names returned by Flask.
  if (name === 'Astronauta Demo') return 'Demo Astronaut'
  const synthetic = /^Astronauta sintético (\d{2})$/.exec(name)
  return synthetic ? 'Synthetic Astronaut ' + synthetic[1] : name || id
}

export const variables: Record<Reading['variable'], string> = {
  heart_rate: 'Heart Rate',
  spo2: 'Oxygen Saturation (SpO₂)',
  temperature: 'Body Temperature',
  radiation_cpm: 'Radiation',
  activity: 'Activity',
}

export function displayTime(timestampMs: number | null) {
  const formatted = formatTimestamp(timestampMs, 'en-US', 'UTC')
  return formatted === null ? 'No contact recorded' : `${formatted} UTC`
}

export function toCrewMember(astronaut: Astronaut): CrewMemberItem {
  return {
    id: astronaut.id,
    name: astronautLabel(astronaut),
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

const historicalTime = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC',
})

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
      timeFormatted: historicalTime.format(reading.measuredAtMs) + ' UTC',
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
    message: 'Alert for Review · Content Pending Validation',
    timeFormatted: displayTime(alert.measuredAtMs),
    acknowledged: alert.acknowledged,
  }
}

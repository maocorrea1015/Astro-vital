import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toActiveAlert, toMeasurementIndicator, toMeasurementTrends } from '../src/app/telemetryPresentation.ts'
import { adaptAstronautStatus, adaptHistoricalReading } from '../src/services/api/adapters.ts'
import { decodeAstronautStatus, decodeReadings } from '../src/services/api/validators.ts'

test('J03 conserva el cero, UTC, calidad y unidades al preparar series inmutables', () => {
  const common = { astronaut_id: 'demo', variable: 'radiation_cpm' }
  const readings = decodeReadings([
    { ...common, id: 2, ts: 1712345680, valor: 0.00004, calidad: 'degraded' },
    { ...common, id: 1, ts: 1712345678, valor: 0, calidad: 'ok' },
    { ...common, id: 3, variable: 'activity', ts: 1712345679, valor: 0, calidad: 'sensor_fault' },
  ]).map(adaptHistoricalReading)
  const before = structuredClone(readings)
  const [radiation, activity] = toMeasurementTrends(readings)
  assert.deepEqual(readings, before)
  assert.equal(radiation.unit, 'CPM')
  assert.deepEqual(radiation.points.map(({ timestamp, value, quality }) => [timestamp, value, quality]), [
    [1712345678, 0, 'ok'], [1712345680, 0.00004, 'degraded'],
  ])
  assert.match(radiation.points[0].timeFormatted, / UTC$/)
  assert.equal(activity.unit, null)
  assert.equal(activity.points.length, 1)
  assert.equal(activity.points[0].quality, 'sensor_fault')
  assert.equal(activity.points[0].isStale, undefined)
  assert.equal(toMeasurementIndicator(readings[1]).value, 0)
  assert.deepEqual(toMeasurementTrends([]), [])
})

test('J04 adapta solo metadatos autorizados del estado del astronauta', () => {
  const status = adaptAstronautStatus(decodeAstronautStatus({
    astronaut_id: 'demo', nombre: 'Prueba', estado_general: 'normal', estado_conexion: 'offline',
    ultimo_contacto: 0, lecturas: [], linea_base: [], guia_actual: null,
    alertas_activas: [{ id: 1, variable: 'heart_rate', valor: 0, severidad: 'warning', mensaje: 'Texto privado sin aprobación', guia: '', ts: 1712345678 }],
  }))
  const alert = toActiveAlert(status.activeAlerts[0])
  assert.equal(alert.severity, 'warning')
  assert.equal(alert.acknowledged, false)
  assert.equal(alert.isSimulated, undefined)
  assert.match(alert.timeFormatted, / UTC$/)
  assert.match(alert.message, /pendiente de validación/)
  assert.doesNotMatch(alert.message, /Texto privado/)
  assert.equal('onAcknowledge' in alert, false)
})

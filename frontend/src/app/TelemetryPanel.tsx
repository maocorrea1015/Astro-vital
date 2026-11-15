import { useCallback, useState } from 'react'

import { MeasurementTrend } from '../features/crew/components'
import type { Astronaut, HistoricalReading } from '../services/api/adapters'
import type { Variable } from '../services/api/contracts'
import { QueryFeedback } from './CrewPage'
import { useCrewQuery, type CrewApi } from './crewQuery'
import { MissionFigure } from './MissionFigure'
import { AssistanceLink, AstronautSelector, MetricRing, MissionEmpty, MissionIdentity, MissionPanel, metricMarks, metricNumber, metricQuality, missionMetrics, summaryNumber, useMissionCrew, useMissionStatus, type MissionSelection } from './MissionModules'
import { toMeasurementTrends, variables } from './telemetryPresentation'

type HistoryResult = HistoricalReading[]

export function TelemetryPanel({ api, selectedId, onSelect, id }: MissionSelection & { id: string | null }) {
  const catalog = useMissionCrew(api, id ?? selectedId)
  const [metric, setMetric] = useState<Variable>('heart_rate')
  return (
    <div className="module-workspace">
      <MissionPanel title="Astronautas" icon="◎" className="module-selector-bar">
        {catalog.result.kind !== 'ready' ? <QueryFeedback result={catalog.result} subject="la tripulación" retry={catalog.retry} />
          : catalog.crew.length ? <AstronautSelector horizontal crew={catalog.crew} selectedId={catalog.selected?.id} onSelect={onSelect} />
          : <MissionEmpty title="No hay astronautas disponibles" />}
      </MissionPanel>
      {catalog.selected ? <TelemetryWorkspace key={catalog.selected.id} astronaut={catalog.selected} api={api} metric={metric} onMetric={setMetric} />
        : <MissionPanel title="Histórico de telemetría" icon="⌁"><MissionEmpty title="Selecciona un astronauta">La gráfica y los indicadores aparecerán aquí.</MissionEmpty></MissionPanel>}
    </div>
  )
}

function TelemetryWorkspace({ astronaut, api, metric, onMetric }: { astronaut: Astronaut; api: CrewApi; metric: Variable; onMetric: (value: Variable) => void }) {
  const load = useCallback((signal: AbortSignal) => api.getAstronautReadings(astronaut.id, signal), [api, astronaut.id])
  const history = useCrewQuery(load)
  const detail = useMissionStatus(api, astronaut.id)
  const status = detail.result.kind === 'ready' ? detail.result.data : undefined
  const rows = history.result.kind === 'ready' ? history.result.data : []
  const reading = status?.readings.find((item) => item.variable === metric)
  return (
    <div className="module-columns monitor-layout">
      <MissionPanel title="Astronauta seleccionado" icon="◉" className="module-monitor-profile">
        <MissionIdentity astronaut={astronaut} status={status} />
        {detail.result.kind !== 'ready' && <QueryFeedback result={detail.result} subject="el estado del astronauta" retry={detail.retry} />}
        <h3 className="module-subtitle">Última muestra</h3>
        <div className="module-current">
          <span className="module-icon" aria-hidden="true">{metricMarks[metric]}</span>
          <div><strong>{variables[metric]}</strong><small>{reading ? metricQuality[reading.quality] : 'Sin lectura'}</small></div>
          <b>{reading ? metricNumber.format(reading.value) : '—'} <small>{reading?.unit}</small></b>
        </div>
        <p className="module-note">Antigüedad sin clasificar. Procedencia no informada por la API.</p>
        <AssistanceLink id={astronaut.id}>Abrir asistencia</AssistanceLink>
      </MissionPanel>
      <MissionPanel title="Evolución temporal" icon="⌁" className="module-history">
        <div className="module-filters" aria-label="Indicadores de monitoreo">
          {missionMetrics.map((variable) => <button type="button" key={variable} aria-pressed={metric === variable} onClick={() => onMetric(variable)}>
            <span aria-hidden="true">{metricMarks[variable]}</span> {variables[variable]}
          </button>)}
        </div>
        <p className="module-note">Últimas 24 horas · hasta 100 lecturas de todas las variables.</p>
        {history.result.kind !== 'ready' ? <QueryFeedback result={history.result} subject="las lecturas del astronauta" retry={history.retry} />
          : rows.length === 0 ? <MissionEmpty title="No hay lecturas disponibles en este intervalo." />
          : <SelectedTrend key={metric} rows={rows} metric={metric} />}
      </MissionPanel>
      <MissionPanel title="Mapa de telemetría" icon="⌖" className="module-map monitor-map">
        <MissionFigure metric={metric} onSelect={onMetric} />
        <div className="module-small-rings"><MetricRing variable={metric} reading={reading} active /></div>
      </MissionPanel>
    </div>
  )
}

function SelectedTrend({ rows, metric }: { rows: HistoryResult; metric: Variable }) {
  const trend = toMeasurementTrends(rows.filter((row) => row.variable === metric))[0]
  const [index, setIndex] = useState<number | null>(null)
  if (!trend) return <MissionEmpty title="Sin histórico para este indicador">Selecciona otra variable para consultar sus lecturas.</MissionEmpty>

  const points = trend.points
  const position = index ?? points.length - 1
  const point = points[position]
  const usable = points.filter((sample) => sample.quality !== 'sensor_fault')
  const stats = usable.length > 1 ? [
    ['Promedio', usable.reduce((sum, sample) => sum + sample.value / usable.length, 0)],
    ['Mínimo', Math.min(...usable.map((sample) => sample.value))],
    ['Máximo', Math.max(...usable.map((sample) => sample.value))],
  ] as const : []
  const quality = [
    { label: 'Nominal', value: points.filter((sample) => sample.quality === 'ok').length, color: 'ok' },
    { label: 'Degradada', value: points.filter((sample) => sample.quality === 'degraded').length, color: 'degraded' },
    { label: 'Fallo de sensor', value: points.filter((sample) => sample.quality === 'sensor_fault').length, color: 'sensor_fault' },
  ]

  return (
    <>
      <div className="module-trend"><MeasurementTrend {...trend} /></div>
      <div className="module-sample">
        <button type="button" disabled={position === 0} onClick={() => setIndex(position - 1)} aria-label="Muestra anterior">←</button>
        <span aria-live="polite"><strong>{metricNumber.format(point.value)} {trend.unit}</strong> · Muestra {position + 1} de {points.length}<small>{point.timeFormatted} · {point.quality === 'unknown' ? 'No evaluada' : metricQuality[point.quality]}</small></span>
        <button type="button" disabled={position === points.length - 1} onClick={() => setIndex(position + 1)} aria-label="Muestra siguiente">→</button>
      </div>
      <div className="module-chart-summary">
        <dl className="module-facts">
          <div><dt>Muestras</dt><dd>{points.length}</dd></div>
          {stats.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{summaryNumber.format(value)} {trend.unit}</dd></div>)}
        </dl>
        {stats.length === 0 && <small>Se necesitan dos muestras utilizables para comparar valores.</small>}
        <div className="module-quality" aria-label="Distribución por calidad de esta variable">
          {quality.map(({ label, color, value }) => <div key={label}><span>{label}</span><meter className={color} min={0} max={points.length} value={value} aria-label={label} /><b>{value}</b></div>)}
        </div>
      </div>
    </>
  )
}

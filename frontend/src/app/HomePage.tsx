import Button from '@mui/material/Button'
import { useCallback, useState, type ReactNode } from 'react'

import { useBrowserOnline } from '../pwa/useBrowserOnline'
import type { Alert, Astronaut, AstronautStatus, HistoricalReading, Reading } from '../services/api/adapters'
import type { Variable } from '../services/api/contracts'
import { QueryFeedback } from './CrewPage'
import { useCrewQuery, type CrewApi } from './crewQuery'
import { alertsPath, assistancePathFor, detailPathFor, hrefFor, monitoringPathFor } from './navigation'
import { MissionFigure } from './MissionFigure'
import { displayTime, toMeasurementTrends, variables } from './telemetryPresentation'
import './mission-control.css'

const indicators: readonly { variable: Variable; mark: string; label: string }[] = [
  { variable: 'heart_rate', mark: '♥', label: 'Frecuencia cardíaca' },
  { variable: 'spo2', mark: 'O₂', label: 'Saturación de oxígeno' },
  { variable: 'temperature', mark: 'T', label: 'Temperatura' },
  { variable: 'activity', mark: 'A', label: 'Actividad' },
  { variable: 'radiation_cpm', mark: 'R', label: 'Radiación ambiental' },
]

const qualityLabels: Record<Reading['quality'] | 'unknown', string> = {
  ok: 'Nominal', degraded: 'Degradada', sensor_fault: 'Fallo de sensor', unknown: 'No evaluada',
}
const severityLabels: Record<Alert['severity'], string> = {
  info: 'Informativa', warning: 'Advertencia', critical: 'Crítica',
}
const statusLabels: Record<Astronaut['reportedStatus'], string> = {
  normal: 'Normal', warning: 'Advertencia', critical: 'Crítico',
}

const number = new Intl.NumberFormat('es-CO', { maximumSignificantDigits: 21 })
const sampleTime = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' })
const order: Record<Alert['severity'], number> = { critical: 0, warning: 1, info: 2 }

function Frame({ area, title, action, children }: { area: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={'mission-panel mission-' + area} aria-labelledby={'mission-' + area}>
      <div className="mission-panel-heading">
        <h2 id={'mission-' + area}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Connection({ astronaut }: { astronaut: Astronaut }) {
  return <span className={'mission-connection ' + astronaut.connection}><span aria-hidden="true">{astronaut.connection === 'online' ? '●' : '○'}</span> {astronaut.connection === 'online' ? 'Nodo en línea' : 'Nodo sin conexión'}</span>
}

function CompactTrend({ metric, rows }: { metric: Variable; rows: HistoricalReading[] }) {
  const trend = toMeasurementTrends(rows.filter((reading) => reading.variable === metric))[0]
  if (!trend) return <p role="status" className="mission-muted">Sin datos históricos para {variables[metric].toLowerCase()}.</p>

  const points = trend.points.slice(-16)
  const first = points[0]
  const last = points[points.length - 1]
  const min = Math.min(...points.map((point) => point.value))
  const max = Math.max(...points.map((point) => point.value))
  const x = (time: number) => first.timestamp === last.timestamp ? 180 : 12 + 336 * (time - first.timestamp) / (last.timestamp - first.timestamp)
  const y = (value: number) => min === max ? 34 : 57 - 46 * (value - min) / (max - min)

  return (
    <div className="mission-trend-data">
      <p className="mission-trend-name">{trend.variableLabel} {trend.unit && <span>· {trend.unit}</span>}</p>
      <svg viewBox="0 0 360 68" className="mission-spark" role="img" aria-label={'Serie de ' + trend.variableLabel + ', ' + points.length + ' muestras. La hora y calidad de la última muestra aparecen debajo.'}>
        <path d="M8 57h344M8 34h344M8 11h344" stroke="#263e4d" strokeDasharray="4 5" />
        {points.map((point, index) => {
          const cx = x(point.timestamp)
          const cy = y(point.value)
          return point.quality === 'sensor_fault' ? (
            <path key={index} d={'M' + (cx - 3) + ' ' + (cy - 3) + 'l6 6m0-6-6 6'} stroke="#ff989b" strokeWidth="2" />
          ) : (
            <circle key={index} cx={cx} cy={cy} r={point.quality === 'degraded' ? 4 : 3} fill={point.quality === 'degraded' ? '#ffd491' : '#78eedc'} />
          )
        })}
      </svg>
      <div className="mission-trend-meta">
        <span>{points.length} {points.length === 1 ? 'muestra' : 'muestras'}{points.length === 1 && ' · serie insuficiente'}</span>
        <span>{number.format(last.value)} {trend.unit} · {qualityLabels[last.quality]} · {last.timeFormatted}</span>
      </div>
    </div>
  )
}

interface WorkspaceProps {
  astronaut?: Astronaut
  status?: AstronautStatus
  metric: Variable
  onMetric: (value: Variable) => void
  detailFeedback?: ReactNode
  trend?: ReactNode
}

function Workspace({ astronaut, status, metric, onMetric, detailFeedback, trend }: WorkspaceProps) {
  const alerts = status?.activeAlerts ?? []
  const topAlert = [...alerts].sort((a, b) => order[a.severity] - order[b.severity] || b.measuredAtMs - a.measuredAtMs)[0]
  const selectedReading = status?.readings.find((reading) => reading.variable === metric)
  return (
    <>
      <Frame area="status" title="Estado y asistencia">
        {astronaut ? (
          <div className="mission-status-content">
            <div><strong className="mission-person">{astronaut.name || astronaut.id}</strong><Connection astronaut={status ?? astronaut} /></div>
            <p className="mission-contact">Último contacto · {displayTime((status ?? astronaut).lastContactAtMs)}</p>
            {detailFeedback ?? (topAlert ? (
              <div className={'mission-alert ' + topAlert.severity}>
                <span aria-hidden="true" className="mission-alert-icon">{topAlert.severity === 'info' ? 'i' : '!'}</span>
                <div>
                  <strong>{alerts.length} {alerts.length === 1 ? 'alerta activa' : 'alertas activas'}</strong>
                  <span>{severityLabels[topAlert.severity]} · {variables[topAlert.variable]}</span>
                  <small>{displayTime(topAlert.measuredAtMs)} · Procedencia no informada</small>
                </div>
              </div>
            ) : status ? <p className="mission-muted">Sin alertas activas.</p> : null)}
            <Button component="a" href={hrefFor(assistancePathFor(astronaut.id))} variant="contained" fullWidth className="mission-assist">
              <span aria-hidden="true">＋</span> Iniciar asistencia
            </Button>
            <div className="mission-secondary">
              <a href={hrefFor(detailPathFor(astronaut.id))}>Ver detalle</a>
              <a href={hrefFor(alertsPath)}>Ver alertas</a>
            </div>
          </div>
        ) : (
          <>
            <p className="mission-muted">Selecciona un astronauta para consultar su estado.</p>
            <Button variant="contained" fullWidth disabled>Iniciar asistencia</Button>
          </>
        )}
      </Frame>
      <Frame area="figure" title="Mapa de telemetría">
        <MissionFigure metric={metric} onSelect={onMetric} />
        <div className="mission-figure-caption" aria-live="polite">
          <span aria-hidden="true" className="mission-selection-mark">◇</span>
          <div>
            <strong>{variables[metric]}</strong>
            <span>{selectedReading ? number.format(selectedReading.value) + (selectedReading.unit ? ' ' + selectedReading.unit : '') + ' · ' + qualityLabels[selectedReading.quality] : 'Sin lectura disponible'}</span>
          </div>
        </div>
        <p className="mission-map-help">Selecciona una zona o su indicador para consultar el histórico.</p>
      </Frame>
      <Frame area="metrics" title="Indicadores" action={<span className="mission-context-label">Última muestra</span>}>
        <div className="mission-indicators" aria-label="Selección por indicador">
          {indicators.map(({ variable, mark, label }) => {
            const reading = status?.readings.find((entry) => entry.variable === variable)
            const alert = alerts.filter((entry) => entry.variable === variable).sort((a, b) => order[a.severity] - order[b.severity])[0]
            return (
              <button type="button" key={variable} aria-pressed={metric === variable} className="mission-metric" onClick={() => onMetric(variable)}>
                <span className="mission-metric-symbol" aria-hidden="true">{mark}</span>
                <span className="mission-metric-detail">
                  <strong>{label}</strong>
                  {reading ? <span><time dateTime={new Date(reading.measuredAtMs).toISOString()}>{sampleTime.format(reading.measuredAtMs)} UTC</time> · <span className={reading.quality}>{qualityLabels[reading.quality]}</span></span> : <span>{status ? 'Sin lectura' : 'Sin datos disponibles'}</span>}
                </span>
                <span className="mission-metric-result">
                  <strong>{reading ? number.format(reading.value) : '—'}</strong>
                  {reading?.unit && <small>{reading.unit}</small>}
                  {alert && <small className={'mission-severity ' + alert.severity}>{severityLabels[alert.severity]}</small>}
                </span>
              </button>
            )
          })}
        </div>
        <p className="mission-footnote">Antigüedad sin clasificar · Procedencia no informada por la API</p>
      </Frame>
      <Frame area="trend" title="Tendencia" action={astronaut && <a href={hrefFor(monitoringPathFor(astronaut.id))}>Ver histórico</a>}>
        {trend ?? <p className="mission-muted">Selecciona un astronauta para consultar el histórico.</p>}
      </Frame>
    </>
  )
}

type Selection = Pick<WorkspaceProps, 'metric' | 'onMetric'>

function SelectedWorkspace({ api, astronaut, selection }: { api: CrewApi; astronaut: Astronaut; selection: Selection }) {
  const statusLoad = useCallback((signal: AbortSignal) => api.getAstronautStatus(astronaut.id, signal), [api, astronaut.id])
  const historyLoad = useCallback((signal: AbortSignal) => api.getAstronautReadings(astronaut.id, signal), [api, astronaut.id])
  const status = useCrewQuery(statusLoad)
  const history = useCrewQuery(historyLoad)
  return (
    <Workspace
      {...selection}
      astronaut={astronaut}
      status={status.result.kind === 'ready' ? status.result.data : undefined}
      detailFeedback={status.result.kind !== 'ready' ? <QueryFeedback result={status.result} subject="el estado del astronauta" retry={status.retry} /> : undefined}
      trend={history.result.kind === 'ready' ? <CompactTrend metric={selection.metric} rows={history.result.data} /> : <QueryFeedback result={history.result} subject="el histórico" retry={history.retry} />}
    />
  )
}

function ConnectedWorkspace({ api, selectedId, onSelect, metric, onMetric }: {
  api: CrewApi; selectedId: string | null; onSelect: (id: string) => void; metric: Variable; onMetric: (value: Variable) => void
}) {
  const list = useCallback((signal: AbortSignal) => api.listAstronauts(signal), [api])
  const { result, retry } = useCrewQuery(list)
  const astronauts = result.kind === 'ready' ? result.data : []
  const selected = astronauts.find(({ id }) => id === selectedId) ?? astronauts[0]
  const crew = result.kind === 'ready' ? (
    astronauts.length ? (
      <ul className="mission-roster" aria-label="Astronautas disponibles">
        {astronauts.map((astronaut) => (
          <li key={astronaut.id}>
            <button type="button" aria-pressed={selected?.id === astronaut.id} onClick={() => onSelect(astronaut.id)}>
              <span className="mission-avatar" aria-hidden="true">{(astronaut.name || astronaut.id).slice(0, 2).toUpperCase()}</span>
              <span>
                <strong>{astronaut.name || astronaut.id}</strong>
                <small>{astronaut.id}</small>
                <Connection astronaut={astronaut} />
                <small className={'mission-severity ' + astronaut.reportedStatus}>
                  Estado reportado: {statusLabels[astronaut.reportedStatus]}
                  {astronaut.reportedStatus !== 'normal' && ' · alerta reportada'}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : <p role="status" className="mission-muted">No hay astronautas disponibles.</p>
  ) : (
    <QueryFeedback result={result} subject="la tripulación" retry={retry} />
  )
  const selection = { metric, onMetric }

  return (
    <div className="mission-grid">
      <Frame area="crew" title="Tripulación">{crew}</Frame>
      {selected
        ? <SelectedWorkspace key={selected.id} api={api} astronaut={selected} selection={selection} />
        : <Workspace {...selection} />}
    </div>
  )
}

export function HomePage({ api, selectedId, onSelect }: { api: CrewApi; selectedId: string | null; onSelect: (id: string) => void }) {
  const online = useBrowserOnline()
  const [metric, setMetric] = useState<Variable>('heart_rate')
  return online
    ? <ConnectedWorkspace api={api} selectedId={selectedId} onSelect={onSelect} metric={metric} onMetric={setMetric} />
    : (
      <div className="mission-grid">
        <Frame area="crew" title="Tripulación"><p className="mission-muted">La telemetría requiere conexión.</p></Frame>
        <Workspace metric={metric} onMetric={setMetric} />
      </div>
    )
}

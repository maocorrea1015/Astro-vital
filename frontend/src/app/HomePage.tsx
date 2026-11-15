import Button from '@mui/material/Button'
import { useCallback, useState, type ReactNode } from 'react'

import { useBrowserOnline } from '../pwa/useBrowserOnline'
import type { Alert, Astronaut, AstronautStatus, HistoricalReading, Reading } from '../services/api/adapters'
import type { Variable } from '../services/api/contracts'
import { QueryFeedback } from './CrewPage'
import { useCrewQuery, type CrewApi } from './crewQuery'
import { alertsPath, assistancePathFor, detailPathFor, hrefFor, monitoringPathFor } from './navigation'
import { MissionFigure } from './MissionFigure'
import { astronautLabel, displayTime, toMeasurementTrends, variables } from './telemetryPresentation'
import './mission-control.css'

const indicators: readonly { variable: Variable; mark: string; label: string }[] = [
  { variable: 'heart_rate', mark: '♥', label: 'Heart Rate' },
  { variable: 'spo2', mark: 'O₂', label: 'Oxygen Saturation (SpO₂)' },
  { variable: 'temperature', mark: 'T', label: 'Body Temperature' },
  { variable: 'activity', mark: 'A', label: 'Activity' },
  { variable: 'radiation_cpm', mark: 'R', label: 'Environmental Radiation' },
]

const qualityLabels: Record<Reading['quality'] | 'unknown', string> = {
  ok: 'Nominal', degraded: 'Degraded', sensor_fault: 'Sensor Fault', unknown: 'Not assessed',
}
const severityLabels: Record<Alert['severity'], string> = {
  info: 'Informational', warning: 'Warning', critical: 'Critical',
}
const statusLabels: Record<Astronaut['reportedStatus'], string> = {
  normal: 'Normal', warning: 'Warning', critical: 'Critical',
}

const number = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 21 })
const sampleTime = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' })
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
  return <span className={'mission-connection ' + astronaut.connection}><span aria-hidden="true">{astronaut.connection === 'online' ? '●' : '○'}</span> {astronaut.connection === 'online' ? 'Node Online' : 'Node Offline'}</span>
}

function CompactTrend({ metric, rows }: { metric: Variable; rows: HistoricalReading[] }) {
  const trend = toMeasurementTrends(rows.filter((reading) => reading.variable === metric))[0]
  if (!trend) return <p role="status" className="mission-muted">No historical data for {variables[metric].toLowerCase()}.</p>

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
      <svg viewBox="0 0 360 68" className="mission-spark" role="img" aria-label={'Series for ' + trend.variableLabel + ', ' + points.length + ' readings. The latest reading time and quality appear below.'}>
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
        <span>{points.length} {points.length === 1 ? 'reading' : 'readings'}{points.length === 1 && ' · insufficient readings'}</span>
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
      <Frame area="status" title="Status and Assistance">
        {astronaut ? (
          <div className="mission-status-content">
            <div><strong className="mission-person">{astronautLabel(astronaut)}</strong><Connection astronaut={status ?? astronaut} /></div>
            <p className="mission-contact">Last Contact · {displayTime((status ?? astronaut).lastContactAtMs)}</p>
            {detailFeedback ?? (topAlert ? (
              <div className={'mission-alert ' + topAlert.severity}>
                <span aria-hidden="true" className="mission-alert-icon">{topAlert.severity === 'info' ? 'i' : '!'}</span>
                <div>
                  <strong>{alerts.length} {alerts.length === 1 ? 'active alert' : 'active alerts'}</strong>
                  <span>{severityLabels[topAlert.severity]} · {variables[topAlert.variable]}</span>
                  <small>{displayTime(topAlert.measuredAtMs)} · Procedencia no informada</small>
                </div>
              </div>
            ) : status ? <p className="mission-muted">No active alerts.</p> : null)}
            <Button component="a" href={hrefFor(assistancePathFor(astronaut.id))} variant="contained" fullWidth className="mission-assist">
              <span aria-hidden="true">＋</span> Start Medical Assistance
            </Button>
            <div className="mission-secondary">
              <a href={hrefFor(detailPathFor(astronaut.id))}>View Details</a>
              <a href={hrefFor(alertsPath)}>View Alerts</a>
            </div>
          </div>
        ) : (
          <>
            <p className="mission-muted">Select an astronaut to view their status.</p>
            <Button variant="contained" fullWidth disabled>Start Medical Assistance</Button>
          </>
        )}
      </Frame>
      <Frame area="figure" title="Telemetry Map">
        <MissionFigure metric={metric} onSelect={onMetric} />
        <div className="mission-figure-caption" aria-live="polite">
          <span aria-hidden="true" className="mission-selection-mark">◇</span>
          <div>
            <strong>{variables[metric]}</strong>
            <span>{selectedReading ? number.format(selectedReading.value) + (selectedReading.unit ? ' ' + selectedReading.unit : '') + ' · ' + qualityLabels[selectedReading.quality] : 'No reading available'}</span>
          </div>
        </div>
        <p className="mission-map-help">Select a region or its indicator to view history.</p>
      </Frame>
      <Frame area="metrics" title="Indicators" action={<span className="mission-context-label">Latest Reading</span>}>
        <div className="mission-indicators" aria-label="Select by indicator">
          {indicators.map(({ variable, mark, label }) => {
            const reading = status?.readings.find((entry) => entry.variable === variable)
            const alert = alerts.filter((entry) => entry.variable === variable).sort((a, b) => order[a.severity] - order[b.severity])[0]
            return (
              <button type="button" key={variable} aria-pressed={metric === variable} className="mission-metric" onClick={() => onMetric(variable)}>
                <span className="mission-metric-symbol" aria-hidden="true">{mark}</span>
                <span className="mission-metric-detail">
                  <strong>{label}</strong>
                  {reading ? <span><time dateTime={new Date(reading.measuredAtMs).toISOString()}>{sampleTime.format(reading.measuredAtMs)} UTC</time> · <span className={reading.quality}>{qualityLabels[reading.quality]}</span></span> : <span>{status ? 'No reading' : 'No data available'}</span>}
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
        <p className="mission-footnote">Reading Age Unclassified · Source Unreported by the API</p>
      </Frame>
      <Frame area="trend" title="Trend" action={astronaut && <a href={hrefFor(monitoringPathFor(astronaut.id))}>View History</a>}>
        {trend ?? <p className="mission-muted">Select an astronaut to view history.</p>}
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
      detailFeedback={status.result.kind !== 'ready' ? <QueryFeedback result={status.result} subject="astronaut status" retry={status.retry} /> : undefined}
      trend={history.result.kind === 'ready' ? <CompactTrend metric={selection.metric} rows={history.result.data} /> : <QueryFeedback result={history.result} subject="history" retry={history.retry} />}
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
      <ul className="mission-roster" aria-label="Available Astronauts">
        {astronauts.map((astronaut) => (
          <li key={astronaut.id}>
            <button type="button" aria-pressed={selected?.id === astronaut.id} onClick={() => onSelect(astronaut.id)}>
              <span className="mission-avatar" aria-hidden="true">{(astronautLabel(astronaut)).slice(0, 2).toUpperCase()}</span>
              <span>
                <strong>{astronautLabel(astronaut)}</strong>
                <small>{astronaut.id}</small>
                <Connection astronaut={astronaut} />
                <small className={'mission-severity ' + astronaut.reportedStatus}>
                  Reported Status: {statusLabels[astronaut.reportedStatus]}
                  {astronaut.reportedStatus !== 'normal' && ' · alerta reportada'}
                </small>
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : <p role="status" className="mission-muted">No astronauts available.</p>
  ) : (
    <QueryFeedback result={result} subject="crew data" retry={retry} />
  )
  const selection = { metric, onMetric }

  return (
    <div className="mission-grid">
      <Frame area="crew" title="Crew">{crew}</Frame>
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
        <Frame area="crew" title="Crew"><p className="mission-muted">Telemetry requires a connection.</p></Frame>
        <Workspace metric={metric} onMetric={setMetric} />
      </div>
    )
}

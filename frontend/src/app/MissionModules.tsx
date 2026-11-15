import { useCallback, useId, type ReactNode } from 'react'

import type { Astronaut, AstronautStatus, Reading } from '../services/api/adapters'
import type { Variable } from '../services/api/contracts'
import { useCrewQuery, type CrewApi } from './crewQuery'
import { assistancePathFor, hrefFor } from './navigation'
import { astronautLabel, displayTime, variables } from './telemetryPresentation'
import './mission-modules.css'

export interface MissionSelection {
  api: CrewApi
  selectedId: string | null
  onSelect: (id: string) => void
}

export const missionMetrics = Object.keys(variables) as Variable[]
export const metricMarks: Record<Variable, string> = { heart_rate: '♥', spo2: 'O₂', temperature: 'T', radiation_cpm: 'R', activity: 'A' }
export const metricQuality = { ok: 'Nominal', degraded: 'Degraded', sensor_fault: 'Sensor Fault' } as const
export const missionSeverity = { critical: 'Critical', warning: 'Warning', info: 'Informational' } as const
export const severityOrder = { critical: 0, warning: 1, info: 2 } as const
const reported = { normal: 'Normal', warning: 'Warning', critical: 'Critical' } as const
export const metricNumber = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 21 })
export const summaryNumber = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 6 })

export function useMissionCrew(api: CrewApi, id: string | null) {
  const load = useCallback((signal: AbortSignal) => api.listAstronauts(signal), [api])
  const query = useCrewQuery(load)
  const crew = query.result.kind === 'ready' ? query.result.data : []
  return { ...query, crew, selected: id === null ? crew[0] : crew.find((item) => item.id === id) }
}

export function useMissionStatus(api: CrewApi, id: string) {
  const load = useCallback((signal: AbortSignal) => api.getAstronautStatus(id, signal), [api, id])
  return useCrewQuery(load)
}

export function MissionPanel({ title, icon, className = '', action, children }: {
  title: string; icon?: string; className?: string; action?: ReactNode; children: ReactNode
}) {
  const id = useId()
  return (
    <section className={'module-panel ' + className} aria-labelledby={id}>
      <div className="module-panel-header">
        <h2 id={id}>{icon && <span className="module-icon" aria-hidden="true">{icon}</span>}{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function MissionEmpty({ title, children, icon = '◇' }: { title: string; children?: ReactNode; icon?: string }) {
  return <div className="module-empty" role="status"><span className="module-empty-icon" aria-hidden="true">{icon}</span><strong>{title}</strong>{children}</div>
}

export function NodeStatus({ astronaut }: { astronaut: Astronaut }) {
  const online = astronaut.connection === 'online'
  return <span className={'module-node ' + (online ? 'online' : 'offline')}><span aria-hidden="true">{online ? '●' : '○'}</span> {online ? 'Online' : 'Offline'}</span>
}

export function AstronautSelector({ crew, selectedId, onSelect, horizontal = false, disabled = false }: {
  crew: Astronaut[]; selectedId?: string; onSelect: (id: string) => void; horizontal?: boolean; disabled?: boolean
}) {
  return (
    <ul className={'module-astronauts' + (horizontal ? ' horizontal' : '')} aria-label="Available Astronauts">
      {crew.map((item) => (
        <li key={item.id}>
          <button type="button" aria-pressed={selectedId === item.id} disabled={disabled} onClick={() => onSelect(item.id)}>
            <span className="module-avatar" aria-hidden="true">{(astronautLabel(item)).slice(0, 2).toUpperCase()}</span>
            <span className="module-astronaut-copy">
              <strong>{astronautLabel(item)}</strong>
              <small>{item.id}</small>
              <NodeStatus astronaut={item} />
              {!horizontal && <small>Reported Status: {reported[item.reportedStatus]}{item.reportedStatus !== 'normal' && ' · Reported alert'}</small>}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function MissionIdentity({ astronaut, status }: { astronaut: Astronaut; status?: AstronautStatus }) {
  const current = status ?? astronaut
  return (
    <>
      <div className="module-identity">
        <span className="module-avatar large" aria-hidden="true">◉</span>
        <div><strong>{astronautLabel(current)}</strong><small>ID: {current.id}</small></div>
        <NodeStatus astronaut={current} />
      </div>
      <dl className="module-facts">
        <div><dt>Reported Status</dt><dd>{reported[current.reportedStatus]}</dd></div>
        <div><dt>Last Contact</dt><dd>{displayTime(current.lastContactAtMs)}</dd></div>
        <div><dt>Active Alerts</dt><dd>{status ? status.activeAlerts.length : 'Not loaded'}</dd></div>
      </dl>
    </>
  )
}

export function MetricRing({ variable, reading, active = false, onSelect }: {
  variable: Variable; reading?: Reading; active?: boolean; onSelect?: () => void
}) {
  const content = (
    <>
      <span className={'module-ring ' + (reading?.quality ?? '')}>
        <span aria-hidden="true">{metricMarks[variable]}</span>
        <strong>{reading ? metricNumber.format(reading.value) : '—'}</strong>
        {reading?.unit && <small>{reading.unit}</small>}
      </span>
      <strong>{variables[variable]}</strong>
      <small>{reading ? metricQuality[reading.quality] : 'No reading'}</small>
      {active && reading && <small>{displayTime(reading.measuredAtMs)}</small>}
    </>
  )
  return onSelect ? <button type="button" className="module-ring-button" aria-pressed={active} onClick={onSelect}>{content}</button>
    : <div className="module-ring-button">{content}</div>
}

export function AssistanceLink({ id, children = 'Start Medical Assistance' }: { id?: string; children?: ReactNode }) {
  return id ? <a className="module-action primary" href={hrefFor(assistancePathFor(id))}>{children}</a>
    : <button className="module-action primary" type="button" disabled>{children}</button>
}

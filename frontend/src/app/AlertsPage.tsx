import { lazy, Suspense, useState } from 'react'

import { AlertCard } from '../features/alerts/components'
import type { Alert, Astronaut } from '../services/api/adapters'
import { QueryFeedback } from './CrewPage'
import type { CrewApi } from './crewQuery'
import { MissionFigure } from './MissionFigure'
import { AstronautSelector, MetricRing, metricNumber, MissionEmpty, MissionPanel, missionSeverity, severityOrder, useMissionCrew, useMissionStatus, type MissionSelection } from './MissionModules'
import { assistancePathFor, hrefFor } from './navigation'
import { observationDemoEnabled } from './observationEnvironment'
import { displayTime, toActiveAlert, variables } from './telemetryPresentation'

const MedicalLibrary = import.meta.env.DEV
  ? lazy(() => import('./ObservationDocument').then((module) => ({ default: module.MedicalLibrary })))
  : null

type Filter = 'all' | Alert['severity']
const severities = ['critical', 'warning', 'info'] as const
const filterLabels = { all: 'Todas', critical: 'Críticas', warning: 'Advertencias', info: 'Informativas' } as const

export function AlertsPage({ api, selectedId, onSelect, id }: MissionSelection & { id: string | null }) {
  const catalog = useMissionCrew(api, id ?? selectedId)
  return (
    <div className="module-workspace">
      <MissionPanel title="Astronautas" icon="◎" className="module-selector-bar">
        {catalog.result.kind !== 'ready' ? <QueryFeedback result={catalog.result} subject="la tripulación" retry={catalog.retry} />
          : catalog.crew.length ? <AstronautSelector horizontal crew={catalog.crew} selectedId={catalog.selected?.id} onSelect={onSelect} />
          : <MissionEmpty title="No hay astronautas disponibles" />}
      </MissionPanel>
      {catalog.selected ? <AstronautAlerts key={catalog.selected.id} api={api} astronaut={catalog.selected} />
        : <MissionPanel title="Alertas activas" icon="△"><MissionEmpty title="Selecciona un astronauta">Los avisos activos de esa selección aparecerán aquí.</MissionEmpty></MissionPanel>}
    </div>
  )
}

function AstronautAlerts({ api, astronaut }: { api: CrewApi; astronaut: Astronaut }) {
  const query = useMissionStatus(api, astronaut.id)
  const [filter, setFilter] = useState<Filter>('all')
  const [id, setId] = useState<number | null>(null)
  if (query.result.kind !== 'ready') return (
    <div className="module-columns alerts-layout">
      <MissionPanel title="Alertas activas" icon="△"><QueryFeedback result={query.result} subject="las alertas activas" retry={query.retry} /></MissionPanel>
      <MissionPanel title="Detalle del aviso" icon="⌖"><MissionEmpty title="Detalle no disponible">El estado solo aparece al obtener la colección de alertas.</MissionEmpty></MissionPanel>
    </div>
  )

  const status = query.result.data
  const alerts = [...status.activeAlerts].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.measuredAtMs - a.measuredAtMs)
  const filtered = alerts.filter((item) => filter === 'all' || item.severity === filter)
  const active = filtered.find((item) => item.id === id) ?? filtered[0]
  const counts = severities.map((severity) => ({ severity, count: alerts.filter((item) => item.severity === severity).length }))
  return (
    <>
      <div className="module-alert-summary" aria-label="Alertas activas del astronauta seleccionado">
        {counts.map(({ severity, count }) => <button key={severity} type="button" className={severity} aria-pressed={filter === severity} disabled={count === 0} onClick={() => setFilter(filter === severity ? 'all' : severity)}>
          <span aria-hidden="true">{severity === 'info' ? 'ⓘ' : '△'}</span><span>{filterLabels[severity]}<strong>{count}</strong></span>
        </button>)}
        <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}><span aria-hidden="true">◇</span><span>Total activas<strong>{alerts.length}</strong></span></button>
      </div>
      <div className="module-columns alerts-layout">
        <MissionPanel title="Alertas activas" icon="△" action={<small>{astronaut.name || astronaut.id} · {filtered.length} visibles</small>}>
          <p className="module-note">Avisos activos del astronauta seleccionado · Procedencia no informada por la API.</p>
          {alerts.length === 0 ? <MissionEmpty title="No hay alertas disponibles." icon="◇">El servidor no reporta avisos activos para esta selección.</MissionEmpty> :
            <>
              <div className="module-filters" aria-label="Filtrar por severidad">
                {(['all', ...severities] as const).filter((value) => value === 'all' || alerts.some((item) => item.severity === value)).map((value) =>
                  <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{filterLabels[value]}</button>)}
              </div>
              <ul className="module-alert-list" aria-label="Lista de alertas">
                {filtered.map((item) => <li key={item.id}>
                  <button type="button" className={item.severity} aria-pressed={active?.id === item.id} onClick={() => setId(item.id)}>
                    <span className="module-icon" aria-hidden="true">{item.severity === 'info' ? 'ⓘ' : '△'}</span>
                    <span><strong>Aviso para revisión · {variables[item.variable]}</strong><small>{astronaut.name || astronaut.id} · {displayTime(item.measuredAtMs)}</small></span>
                    <span className="module-severity">{missionSeverity[item.severity]}</span>
                  </button>
                </li>)}
              </ul>
            </>}
        </MissionPanel>
        <MissionPanel title="Detalle del aviso" icon="⌖">
          {active ? <AlertDetail key={active.id} alert={active} status={status} />
            : <MissionEmpty title="No hay un aviso seleccionado" />}
        </MissionPanel>
      </div>
    </>
  )
}

function AlertDetail({ alert, status }: { alert: Alert; status: Awaited<ReturnType<CrewApi['getAstronautStatus']>> }) {
  const [metric, setMetric] = useState(alert.variable)
  return (
    <>
      <AlertCard {...toActiveAlert(alert)} />
      <div className="module-alert-context">
        <div>
          <h3 className="module-subtitle">Última muestra disponible</h3>
          <MetricRing variable={metric} reading={status.readings.find((item) => item.variable === metric)} active />
          <p className="module-note">La lectura actual puede corresponder a un momento distinto al aviso.</p>
        </div>
        <div className="module-map alert-map"><MissionFigure metric={metric} onSelect={setMetric} /></div>
      </div>
      {observationDemoEnabled && MedicalLibrary && (
        <div className="observation-alert-actions">
          <p className="module-note">Valor del aviso #{alert.id}: {metricNumber.format(alert.value)} · <time dateTime={new Date(alert.measuredAtMs).toISOString()}>{displayTime(alert.measuredAtMs)}</time></p>
          <Suspense fallback={<span role="status">Cargando fichas…</span>}><MedicalLibrary variable={alert.variable} /></Suspense>
          <a className="module-action primary" href={hrefFor(assistancePathFor(status.id, alert.id))}>Iniciar asistencia</a>
        </div>
      )}
      <p className="module-notice">Guía clínica pendiente de validación médica.</p>
    </>
  )
}

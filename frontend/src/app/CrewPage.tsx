import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useState } from 'react'

import type { Astronaut } from '../services/api/adapters'
import type { Variable } from '../services/api/contracts'
import { variables } from './telemetryPresentation'
import { alertsPathFor, detailPathFor, hrefFor, monitoringPathFor } from './navigation'
import type { CrewApi, CrewQuery } from './crewQuery'
import { MissionFigure } from './MissionFigure'
import { AssistanceLink, AstronautSelector, MetricRing, MissionEmpty, MissionIdentity, MissionPanel, missionMetrics, useMissionCrew, useMissionStatus, type MissionSelection } from './MissionModules'

export function QueryFeedback({
  result,
  subject,
  retry,
}: {
  result: Exclude<CrewQuery<unknown>, { kind: 'ready' }>
  subject: string
  retry: () => void
}) {
  if (result.kind === 'loading') {
    return <Typography role="status">Consultando {subject}…</Typography>
  }

  if (result.kind === 'unconfigured') {
    return <Typography role="status">API no configurada. El acceso a {subject} está pendiente.</Typography>
  }

  return (
    <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
      <Typography role="alert">
        {result.notFound ? 'El recurso solicitado no está disponible.' : `No se pudo consultar ${subject}.`}
      </Typography>
      {!result.notFound && <Button variant="outlined" onClick={retry}>Reintentar</Button>}
    </Stack>
  )
}

export function CrewPage({ api, selectedId, onSelect }: MissionSelection) {
  const catalog = useMissionCrew(api, selectedId)
  const [metric, setMetric] = useState<Variable>('heart_rate')
  const selected = catalog.selected
  const online = catalog.crew.filter((item) => item.connection === 'online').length
  return (
    <div className="module-workspace">
      <div className="module-toolbar">
        <p>Consulta el estado reportado y las últimas mediciones.</p>
        {catalog.result.kind === 'ready' && <div className="module-counts">
          <span>Total: {catalog.crew.length}</span><span>En línea: {online}</span><span>Sin conexión: {catalog.crew.length - online}</span>
        </div>}
      </div>
      <div className="module-columns crew-layout">
        <MissionPanel title="Astronautas de la misión" icon="◎">
          {catalog.result.kind !== 'ready' ? <QueryFeedback result={catalog.result} subject="la tripulación" retry={catalog.retry} />
            : catalog.crew.length ? <AstronautSelector crew={catalog.crew} selectedId={selected?.id} onSelect={onSelect} />
            : <MissionEmpty title="No hay astronautas disponibles"><Button onClick={catalog.retry}>Reintentar</Button></MissionEmpty>}
        </MissionPanel>
        <MissionPanel title="Mapa de telemetría" icon="⌖" className="module-map">
          <MissionFigure metric={metric} onSelect={setMetric} />
          <p className="module-map-label" aria-live="polite">{variables[metric]}</p>
        </MissionPanel>
        <MissionPanel title="Perfil del astronauta" icon="◉">
          {selected ? <CrewProfile key={selected.id} api={api} astronaut={selected} metric={metric} onMetric={setMetric} />
            : <MissionEmpty title="Selecciona un astronauta">Su estado y sus lecturas aparecerán aquí.</MissionEmpty>}
        </MissionPanel>
      </div>
      <div className="module-actions"><strong>Acciones rápidas</strong>
        {selected && <>
          <a className="module-action" href={hrefFor(monitoringPathFor(selected.id))}>Ver monitoreo</a>
          <a className="module-action" href={hrefFor(alertsPathFor(selected.id))}>Ver alertas</a>
        </>}
        <AssistanceLink id={selected?.id} />
      </div>
    </div>
  )
}

function CrewProfile({ api, astronaut, metric, onMetric }: {
  api: CrewApi; astronaut: Astronaut; metric: Variable; onMetric: (value: Variable) => void
}) {
  const query = useMissionStatus(api, astronaut.id)
  const status = query.result.kind === 'ready' ? query.result.data : undefined
  return (
    <>
      <MissionIdentity astronaut={astronaut} status={status} />
      {query.result.kind !== 'ready' && <QueryFeedback result={query.result} subject="el estado del astronauta" retry={query.retry} />}
      <h3 className="module-subtitle">Indicadores clave · última muestra</h3>
      <div className="module-rings">
        {missionMetrics.map((variable) => <MetricRing key={variable} variable={variable}
          reading={status?.readings.find((reading) => reading.variable === variable)} active={metric === variable} onSelect={() => onMetric(variable)} />)}
      </div>
      <div className="module-footer-line"><small>Antigüedad sin clasificar · Procedencia no informada</small>
        <a href={hrefFor(detailPathFor(astronaut.id))}>Ver detalle</a>
      </div>
    </>
  )
}

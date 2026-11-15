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
    return <Typography role="status">Loading {subject}…</Typography>
  }

  if (result.kind === 'unconfigured') {
    return <Typography role="status">API not configured. Access to {subject} is pending.</Typography>
  }

  return (
    <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
      <Typography role="alert">
        {result.notFound ? 'The requested resource is unavailable.' : `Could not load ${subject}.`}
      </Typography>
      {!result.notFound && <Button variant="outlined" onClick={retry}>Retry</Button>}
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
        <p>View reported status and the latest readings.</p>
        {catalog.result.kind === 'ready' && <div className="module-counts">
          <span>Total: {catalog.crew.length}</span><span>Online: {online}</span><span>Offline: {catalog.crew.length - online}</span>
        </div>}
      </div>
      <div className="module-columns crew-layout">
        <MissionPanel title="Mission Astronauts" icon="◎">
          {catalog.result.kind !== 'ready' ? <QueryFeedback result={catalog.result} subject="crew data" retry={catalog.retry} />
            : catalog.crew.length ? <AstronautSelector crew={catalog.crew} selectedId={selected?.id} onSelect={onSelect} />
            : <MissionEmpty title="No astronauts available"><Button onClick={catalog.retry}>Retry</Button></MissionEmpty>}
        </MissionPanel>
        <MissionPanel title="Telemetry Map" icon="⌖" className="module-map">
          <MissionFigure metric={metric} onSelect={setMetric} />
          <p className="module-map-label" aria-live="polite">{variables[metric]}</p>
        </MissionPanel>
        <MissionPanel title="Astronaut Profile" icon="◉">
          {selected ? <CrewProfile key={selected.id} api={api} astronaut={selected} metric={metric} onMetric={setMetric} />
            : <MissionEmpty title="Select an Astronaut">Their status and readings will appear here.</MissionEmpty>}
        </MissionPanel>
      </div>
      <div className="module-actions"><strong>Quick Actions</strong>
        {selected && <>
          <a className="module-action" href={hrefFor(monitoringPathFor(selected.id))}>View Monitoring</a>
          <a className="module-action" href={hrefFor(alertsPathFor(selected.id))}>View Alerts</a>
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
      {query.result.kind !== 'ready' && <QueryFeedback result={query.result} subject="astronaut status" retry={query.retry} />}
      <h3 className="module-subtitle">Key Indicators · Latest Reading</h3>
      <div className="module-rings">
        {missionMetrics.map((variable) => <MetricRing key={variable} variable={variable}
          reading={status?.readings.find((reading) => reading.variable === variable)} active={metric === variable} onSelect={() => onMetric(variable)} />)}
      </div>
      <div className="module-footer-line"><small>Reading Age Unclassified · Source Unreported</small>
        <a href={hrefFor(detailPathFor(astronaut.id))}>View Details</a>
      </div>
    </>
  )
}

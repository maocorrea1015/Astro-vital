import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'

import { createAstronautApi } from '../services/api/astronauts'
import { AlertsPage } from './AlertsPage'
import { AssistancePage } from './AssistancePage'
import { AstronautPage } from './AstronautPage'
import { CrewPage } from './CrewPage'
import { HomePage } from './HomePage'
import type { AssistanceSession } from './assistanceSession'
import type { CrewApi } from './crewQuery'
import { AppShell } from './AppShell'
import { TelemetryPanel } from './TelemetryPanel'
import { alertsPath, alertsPathFor, assistancePath, assistancePathFor, astronautDetailPath, hrefFor, monitoringPath, monitoringPathFor, readAlertsId, readAssistanceId, readDetailId, readMonitoringId, useRoute } from './navigation'

const views: Record<string, { title: string; description: string } | undefined> = {
  [astronautDetailPath]: {
    title: 'Astronaut Details',
    description: 'Crew selection and data will be available once crew integration is complete.',
  },
}

const defaultCrewApi = createAstronautApi({
  protectedPathPrefix: import.meta.env.MODE === 'educational-demo' ? '/demo' : undefined,
  localAnonymousReads: import.meta.env.DEV && import.meta.env.VITE_LOCAL_ANONYMOUS_READ === 'true',
})

export function App({ crewApi = defaultCrewApi }: { crewApi?: CrewApi }) {
  const route = useRoute()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ReadonlyMap<string, AssistanceSession>>(() => new Map())
  const hasAnswers = [...sessions.values()].some((session) => session.answers.size > 0)
  const updateSession = (session: AssistanceSession | null, id: string) => setSessions((previous) => {
    const next = new Map(previous)
    if (session) next.set(id, session)
    else next.delete(id)
    return next
  })
  const routeId = readDetailId(route) ?? readMonitoringId(route) ?? readAlertsId(route) ?? readAssistanceId(route)
  useEffect(() => { if (routeId) setSelectedId(routeId) }, [routeId])

  useEffect(() => {
    if (!hasAnswers) return
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = true
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasAnswers])
  if (route === '/') {
    return (
      <AppShell route={route} title="Mission Control">
        <HomePage api={crewApi} selectedId={selectedId} onSelect={setSelectedId} />
      </AppShell>
    )
  }

  if (route === '/tripulacion') {
    return (
      <AppShell route={route} title="Crew">
        <CrewPage api={crewApi} selectedId={selectedId} onSelect={setSelectedId} />
      </AppShell>
    )
  }

  const id = readDetailId(route)
  if (id !== null) {
    return (
      <AppShell route={route} title="Astronaut Details">
        <AstronautPage key={id} api={crewApi} id={id} />
      </AppShell>
    )
  }

  const monitoringId = readMonitoringId(route)
  if (route === monitoringPath || monitoringId !== null) {
    return (
      <AppShell route={route} title="Monitoring">
        <TelemetryPanel api={crewApi} id={monitoringId} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); location.hash = hrefFor(monitoringPathFor(id)) }} />
      </AppShell>
    )
  }


  const alertsId = readAlertsId(route)
  if (route === alertsPath || alertsId !== null) {
    return (
      <AppShell route={route} title="Alerts">
        <AlertsPage api={crewApi} id={alertsId} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); location.hash = hrefFor(alertsPathFor(id)) }} />
      </AppShell>
    )
  }

  const assistanceId = readAssistanceId(route)
  if (route === assistancePath || assistanceId !== null) {
    return (
      <AppShell route={route} title="Medical Assistance">
        <AssistancePage key={assistanceId ?? assistancePath} api={crewApi} initialId={assistanceId} selectedId={selectedId} onSelect={(id) => { setSelectedId(id); location.hash = hrefFor(assistancePathFor(id)) }} sessions={sessions} onSessionChange={updateSession} />
      </AppShell>
    )
  }

  const view = Object.hasOwn(views, route) ? views[route] : undefined

  return (
    <AppShell route={route} title={view?.title ?? 'Page not found'}>
      {view ? (
        <Stack spacing={2} sx={{ maxWidth: '66ch' }}>
          <Typography color="text.secondary">{view.description}</Typography>
          <Paper
            component="section"
            aria-labelledby="integration-status"
            variant="outlined"
            sx={{ p: { xs: 2, sm: 3 }, borderInlineStart: '3px solid', borderInlineStartColor: 'info.main' }}
          >
            <Typography id="integration-status" component="h2" variant="h6" color="info.main">
              Integration pending
            </Typography>
            <Typography color="text.secondary">
              {route === astronautDetailPath ? 'No astronaut is selected.' : 'No data is available in this section yet.'}
            </Typography>
          </Paper>
          {route === astronautDetailPath && <Link href={hrefFor('/tripulacion')}>Back to Crew</Link>}
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Typography color="text.secondary">The requested page is unavailable.</Typography>
          <Link href={hrefFor('/')}>Back to Home</Link>
        </Stack>
      )}
    </AppShell>
  )
}

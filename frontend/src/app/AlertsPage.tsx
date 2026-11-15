import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback, useState } from 'react'

import { AlertsPanel, type AlertFilter } from '../features/alerts/components'
import { QueryFeedback } from './CrewPage'
import { useCrewQuery, type CrewApi } from './crewQuery'
import { toActiveAlert } from './telemetryPresentation'

function AstronautAlerts({ api, id }: { api: CrewApi; id: string }) {
  const load = useCallback((signal: AbortSignal) => api.getAstronautStatus(id, signal), [api, id])
  const { result, retry } = useCrewQuery(load)
  const [filter, setFilter] = useState<AlertFilter>('all')

  if (result.kind === 'unconfigured') {
    return <QueryFeedback result={result} subject="las alertas activas" retry={retry} />
  }

  const alerts = result.kind === 'ready' ? result.data.activeAlerts.map(toActiveAlert) : []
  const status = result.kind === 'ready' ? (alerts.length ? 'success' : 'empty') : result.kind
  const selectedFilter = alerts.some((alert) => alert.severity === filter) ? filter : 'all'

  return (
    <AlertsPanel
      alerts={alerts}
      status={status}
      selectedFilter={selectedFilter}
      onFilterChange={setFilter}
      onRetry={result.kind === 'error' && !result.notFound ? retry : undefined}
      errorMessage={result.kind === 'error' && result.notFound ? 'El astronauta solicitado no está disponible.' : undefined}
    />
  )
}

export function AlertsPage({ api }: { api: CrewApi }) {
  const load = useCallback((signal: AbortSignal) => api.listAstronauts(signal), [api])
  const { result, retry } = useCrewQuery(load)
  const [id, setId] = useState('')
  if (result.kind !== 'ready') {
    return <QueryFeedback result={result} subject="la tripulación" retry={retry} />
  }
  if (result.data.length === 0) {
    return <Typography role="status">No hay astronautas disponibles para consultar alertas.</Typography>
  }

  return (
    <Stack spacing={3} sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
      <Box>
        <Typography component="label" htmlFor="alerts-astronaut" sx={{ display: 'block', mb: 1 }}>
          Astronauta
        </Typography>
        <Box
          component="select"
          id="alerts-astronaut"
          value={id}
          onChange={(event) => setId(event.currentTarget.value)}
          sx={{
            width: '100%', maxWidth: '28rem', minHeight: 44, px: 1.5, font: 'inherit',
            color: 'text.primary', bgcolor: 'background.paper', colorScheme: 'dark',
            border: 1, borderColor: 'divider', borderRadius: 1,
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
          }}
        >
          <option value="">Seleccionar astronauta</option>
          {result.data.map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.name || entry.id}</option>
          ))}
        </Box>
      </Box>
      {id ? <AstronautAlerts key={id} api={api} id={id} /> : (
        <Typography role="status">Selecciona un astronauta para consultar sus alertas activas.</Typography>
      )}
    </Stack>
  )
}

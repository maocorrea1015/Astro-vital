import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback } from 'react'

import type { Astronaut } from '../services/api/adapters'
import { QueryFeedback } from './CrewPage'
import { useCrewQuery, type CrewApi } from './crewQuery'
import { hrefFor, monitoringPath, monitoringPathFor } from './navigation'
import { displayTime, qualities, variables } from './telemetryPresentation'

function AstronautReadings({ api, astronaut }: { api: CrewApi; astronaut: Astronaut }) {
  const load = useCallback(
    (signal: AbortSignal) => api.getAstronautReadings(astronaut.id, signal),
    [api, astronaut.id],
  )
  const { result, retry } = useCrewQuery(load)

  return (
    <Box component="section" aria-labelledby="telemetry-reading-title">
      <Typography component="h2" variant="h6" id="telemetry-reading-title">
        Lecturas de {astronaut.name || astronaut.id}
      </Typography>
      <Typography color="text.secondary">
        Conexión del nodo: {astronaut.connection === 'online' ? 'En línea' : 'Sin conexión'}
        {' · Último contacto: '}{displayTime(astronaut.lastContactAtMs)}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Últimas 24 horas · hasta 100 lecturas · frescura sin criterio configurado.
      </Typography>
      {result.kind === 'ready' ? (
        result.data.length === 0 ? (
          <Typography role="status">No hay lecturas disponibles en este intervalo.</Typography>
        ) : (
          <Box component="ul" sx={{ pl: 3 }}>
            {result.data.map(({ id, variable, value, unit, measuredAtMs, quality }) => (
              <Box component="li" key={id} sx={{ mb: 1 }}>
                <Typography component="span">
                  {variables[variable]}: {value}{unit ? ` ${unit}` : ' (unidad sin confirmar)'}
                </Typography>
                <Typography color="text.secondary">
                  {displayTime(measuredAtMs)} · Calidad: {qualities[quality]}
                </Typography>
              </Box>
            ))}
          </Box>
        )
      ) : (
        <QueryFeedback result={result} subject="las lecturas del astronauta" retry={retry} />
      )}
    </Box>
  )
}

export function TelemetryPanel({ api, id }: { api: CrewApi; id: string | null }) {
  const load = useCallback((signal: AbortSignal) => api.listAstronauts(signal), [api])
  const { result, retry } = useCrewQuery(load)

  if (result.kind !== 'ready') {
    return <QueryFeedback result={result} subject="la tripulación" retry={retry} />
  }

  if (result.data.length === 0) {
    return <Typography role="status">No hay astronautas disponibles para monitoreo.</Typography>
  }

  const astronaut = result.data.find((entry) => entry.id === id)

  return (
    <Stack spacing={3} sx={{ maxWidth: '66ch', overflowWrap: 'anywhere' }}>
      <Box>
        <Typography component="label" htmlFor="telemetry-astronaut" sx={{ display: 'block', mb: 1 }}>
          Astronauta
        </Typography>
        <Box
          component="select"
          id="telemetry-astronaut"
          value={astronaut?.id ?? ''}
          onChange={(event) => {
            const selected = event.currentTarget.value
            window.location.hash = hrefFor(selected ? monitoringPathFor(selected) : monitoringPath)
          }}
          sx={{
            width: '100%',
            maxWidth: '28rem',
            minHeight: 44,
            px: 1.5,
            font: 'inherit',
            color: 'text.primary',
            bgcolor: 'background.paper',
            colorScheme: 'dark',
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
          }}
        >
          <option value="">Seleccionar astronauta</option>
          {result.data.map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.name ? `${entry.name} · ${entry.id}` : entry.id}</option>
          ))}
        </Box>
      </Box>
      {astronaut ? (
        <AstronautReadings key={astronaut.id} astronaut={astronaut} api={api} />
      ) : (
        <Typography role="status">
          {id === null ? 'Selecciona un astronauta para consultar sus lecturas.' : 'El astronauta seleccionado no está disponible.'}
        </Typography>
      )}
    </Stack>
  )
}

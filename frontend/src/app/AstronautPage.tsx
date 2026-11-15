import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback } from 'react'

import { QueryFeedback } from './CrewPage'
import { useCrewQuery, type CrewApi } from './crewQuery'
import { hrefFor } from './navigation'

import { displayTime, qualities, variables } from './telemetryPresentation'

const reportedStatuses = { normal: 'Normal', warning: 'Advertencia', critical: 'Crítico' }

export function AstronautPage({ id, api }: { id: string; api: CrewApi }) {
  const load = useCallback((signal: AbortSignal) => api.getAstronautStatus(id, signal), [api, id])
  const { result, retry } = useCrewQuery(load)

  return (
    <Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
      {result.kind === 'ready' ? (
        <>
          <Box component="dl" sx={{ m: 0, '& dd': { ml: 0, mb: 1, color: 'text.secondary' } }}>
            <dt>Astronauta</dt><dd>{result.data.name ? `${result.data.name} · ${result.data.id}` : result.data.id}</dd>
            <dt>Estado general informado</dt><dd>{reportedStatuses[result.data.reportedStatus]}</dd>
            <dt>Conexión del nodo</dt><dd>{result.data.connection === 'online' ? 'En línea' : 'Sin conexión'}</dd>
            <dt>Último contacto</dt><dd>{displayTime(result.data.lastContactAtMs)}</dd>
          </Box>
          <Box component="section" aria-labelledby="latest-readings">
            <Typography component="h2" variant="h6" id="latest-readings">Últimas mediciones</Typography>
            {result.data.readings.length === 0 ? (
              <Typography color="text.secondary">No hay mediciones disponibles.</Typography>
            ) : (
              <Box component="ul" sx={{ pl: 3 }}>
                {result.data.readings.map((reading) => (
                  <Box component="li" key={reading.variable} sx={{ mb: 1 }}>
                    <Typography component="span">
                      {variables[reading.variable]}: {reading.value}
                      {reading.unit ? ` ${reading.unit}` : ' (unidad sin confirmar)'}
                    </Typography>
                    <Typography color="text.secondary">
                      {displayTime(reading.measuredAtMs)} · Calidad: {qualities[reading.quality]}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </>
      ) : (
        <>
          <QueryFeedback result={result} subject="el estado del astronauta" retry={retry} />
          <Typography color="text.secondary">Conexión del nodo desconocida.</Typography>
        </>
      )}
      <Link href={hrefFor('/tripulacion')}>Volver a tripulación</Link>
    </Stack>
  )
}

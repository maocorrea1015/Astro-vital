import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback } from 'react'

import { AstronautCard, MeasurementIndicator } from '../features/crew/components'
import { QueryFeedback } from './CrewPage'
import { useCrewQuery, type CrewApi } from './crewQuery'
import { hrefFor } from './navigation'

import { toCrewMember, toMeasurementIndicator } from './telemetryPresentation'

export function AstronautPage({ id, api }: { id: string; api: CrewApi }) {
  const load = useCallback((signal: AbortSignal) => api.getAstronautStatus(id, signal), [api, id])
  const { result, retry } = useCrewQuery(load)

  return (
    <Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
      {result.kind === 'ready' ? (
        <>
          <AstronautCard {...toCrewMember(result.data)} headingComponent="h2" />
          <Box component="section" aria-labelledby="latest-readings">
            <Typography component="h2" variant="h6" id="latest-readings">Últimas mediciones</Typography>
            {result.data.readings.length === 0 ? (
              <Typography color="text.secondary">No hay mediciones disponibles.</Typography>
            ) : (
              <Box component="ul" sx={{ listStyle: 'none', p: 0, display: 'grid', gap: 2 }}>
                {result.data.readings.map((reading) => (
                  <Box component="li" key={reading.variable}>
                    <MeasurementIndicator {...toMeasurementIndicator(reading)} />
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

import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback } from 'react'

import { AstronautCard, MeasurementsPanel } from '../features/crew/components'
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
          <MeasurementsPanel
            astronautName={result.data.name || result.data.id}
            measurements={result.data.readings.map(toMeasurementIndicator)}
          />
          {result.data.readings.length > 0 && (
            <Typography color="text.secondary">Reading age unclassified. The API did not report a source.</Typography>
          )}
        </>
      ) : (
        <>
          <QueryFeedback result={result} subject="astronaut status" retry={retry} />
          <Typography color="text.secondary">Node connection unknown.</Typography>
        </>
      )}
      <Link href={hrefFor('/tripulacion')}>Back to Crew</Link>
    </Stack>
  )
}

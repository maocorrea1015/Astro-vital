import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback } from 'react'

import { CrewView } from '../features/crew/components'
import { toCrewMember } from './telemetryPresentation'
import { detailPathFor, hrefFor } from './navigation'
import { useCrewQuery, type CrewApi, type CrewQuery } from './crewQuery'

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

export function CrewPage({ api }: { api: CrewApi }) {
  const load = useCallback((signal: AbortSignal) => api.listAstronauts(signal), [api])
  const { result, retry } = useCrewQuery(load)

  if (result.kind === 'unconfigured') {
    return <QueryFeedback result={result} subject="la tripulación" retry={retry} />
  }

  return (
    <CrewView
      crew={result.kind === 'ready' ? result.data.map(toCrewMember) : []}
      isLoading={result.kind === 'loading'}
      errorMessage={result.kind === 'error'
        ? (result.notFound ? 'El catálogo solicitado no está disponible.' : 'No se pudo consultar la tripulación.')
        : null}
      onRetry={result.kind === 'error' && !result.notFound ? retry : undefined}
      onSelect={(id) => { window.location.hash = hrefFor(detailPathFor(id)) }}
    />
  )
}

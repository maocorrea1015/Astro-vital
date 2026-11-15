import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback } from 'react'

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

  if (result.kind !== 'ready') {
    return <QueryFeedback result={result} subject="la tripulación" retry={retry} />
  }

  if (result.data.length === 0) {
    return <Typography role="status">No hay astronautas disponibles.</Typography>
  }

  return (
    <Box component="ul" sx={{ pl: 3, overflowWrap: 'anywhere' }}>
      {result.data.map(({ id, name }) => (
        <Box component="li" key={id} sx={{ mb: 1 }}>
          <Link href={hrefFor(detailPathFor(id))}>{name ? `${name} · ${id}` : id}</Link>
        </Box>
      ))}
    </Box>
  )
}

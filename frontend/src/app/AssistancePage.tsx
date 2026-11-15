import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useCallback, useEffect, useRef, useState } from 'react'

import { QueryFeedback } from './CrewPage'
import { approvedAssistanceQuestions } from './assistanceContent'
import { questionProgress, startAssistanceSession, type AssistanceSession } from './assistanceSession'
import { useCrewQuery, type CrewApi } from './crewQuery'
import { detailPathFor, hrefFor } from './navigation'

export function AssistancePage({ api, initialId }: { api: CrewApi; initialId: string | null }) {
  const load = useCallback((signal: AbortSignal) => api.listAstronauts(signal), [api])
  const { result, retry } = useCrewQuery(load)
  const [selectedId, setSelectedId] = useState(initialId ?? '')
  const [session, setSession] = useState<AssistanceSession | null>(null)
  const confirmation = useRef<HTMLHeadingElement>(null)
  const selected = result.kind === 'ready' ? result.data.find(({ id }) => id === selectedId) : undefined
  const confirmed = Boolean(selected && session?.astronautId === selected.id)
  const progress = session === null ? null : questionProgress(session, approvedAssistanceQuestions)
  const returnId = selected?.id ?? (result.kind !== 'ready' ? initialId : null)

  useEffect(() => {
    if (confirmed) confirmation.current?.focus()
  }, [confirmed])

  return (
    <Stack spacing={3} sx={{ maxWidth: '66ch', overflowWrap: 'anywhere' }}>
      {result.kind !== 'ready' ? (
        <QueryFeedback result={result} subject="la tripulación" retry={retry} />
      ) : result.data.length === 0 ? (
        <Typography role="status">No hay astronautas disponibles para asistencia.</Typography>
      ) : (
        <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ width: '100%', maxWidth: '28rem' }}>
            <Typography component="label" htmlFor="assistance-astronaut" sx={{ display: 'block', mb: 1 }}>
              Astronauta
            </Typography>
            <Box
              component="select"
              id="assistance-astronaut"
              value={selected?.id ?? ''}
              onChange={(event) => {
                setSelectedId(event.currentTarget.value)
                setSession(null)
              }}
              sx={{
                width: '100%', minHeight: 44, px: 1.5, font: 'inherit',
                color: 'text.primary', bgcolor: 'background.paper', colorScheme: 'dark',
                border: 1, borderColor: 'divider', borderRadius: 1,
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
              }}
            >
              <option value="">Seleccionar astronauta</option>
              {result.data.map(({ id, name }) => (
                <option key={id} value={id}>{name ? `${name} · ${id}` : id}</option>
              ))}
            </Box>
          </Box>
          {selectedId && !selected && <Typography role="status">El astronauta seleccionado no está en el catálogo.</Typography>}
          <Button
            variant="outlined"
            disabled={!selected || confirmed}
            onClick={() => { if (selected) setSession(startAssistanceSession(selected.id)) }}
          >
            Confirmar astronauta
          </Button>
        </Stack>
      )}

      <Paper component="section" variant="outlined" aria-labelledby="assistance-status" sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography
          ref={confirmation}
          id="assistance-status"
          component="h2"
          variant="h6"
          tabIndex={-1}
          sx={{ '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } }}
        >
          {confirmed ? `Astronauta confirmado: ${selected?.name || selected?.id}` : 'Disponibilidad de asistencia'}
        </Typography>
        {progress && <Typography>Paso {progress.current} de {progress.total}</Typography>}
        <Typography color="text.secondary">El cuestionario de asistencia está pendiente de validación médica</Typography>
      </Paper>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        {returnId && <Link href={hrefFor(detailPathFor(returnId))}>Volver al detalle</Link>}
        <Link href={hrefFor('/tripulacion')}>Volver a tripulación</Link>
      </Stack>
    </Stack>
  )
}

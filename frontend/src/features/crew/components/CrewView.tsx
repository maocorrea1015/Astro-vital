import type { ConnectionStatus, GeneralStatus } from './AstronautCard'
import { AstronautCard } from './AstronautCard'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export interface CrewMemberItem {
  id: string
  name?: string | null
  connectionStatus: ConnectionStatus
  generalStatus: GeneralStatus
  lastContactFormatted?: string | null
  summary?: string | null
}

export interface CrewViewProps {
  /** Colección de tripulantes de la misión */
  crew: CrewMemberItem[]
  /** Identificador del astronauta seleccionado actualmente */
  selectedId?: string | null
  /** Indica si la consulta o recarga está en progreso */
  isLoading?: boolean
  /** Mensaje de error en caso de fallo en la consulta */
  errorMessage?: string | null
  /** Callback invocado al seleccionar a un tripulante */
  onSelect?: (id: string) => void
  /** Callback para reintentar la consulta tras un error */
  onRetry?: () => void
}

export function CrewView({
  crew,
  selectedId,
  isLoading = false,
  errorMessage,
  onSelect,
  onRetry,
}: CrewViewProps) {
  const hasCrew = crew.length > 0
  const cleanError = errorMessage?.trim() || null

  // 1. Carga inicial: sin datos previos y con carga activa
  if (!hasCrew && isLoading) {
    return (
      <Paper
        variant="outlined"
        role="status"
        aria-live="polite"
        sx={{
          p: { xs: 4, sm: 6 },
          textAlign: 'center',
          backgroundColor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <CircularProgress color="primary" sx={{ mb: 2 }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 650 }}>
          Loading crew roster…
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading crew telemetry and connectivity status.
        </Typography>
      </Paper>
    )
  }

  // 2. Error inicial: sin datos previos y con mensaje de fallo
  if (!hasCrew && cleanError) {
    return (
      <Alert
        severity="error"
        variant="outlined"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry} sx={{ fontWeight: 600 }}>
              Retry
            </Button>
          ) : undefined
        }
        sx={{ borderRadius: 2 }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Could not load the crew
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {cleanError}
        </Typography>
      </Alert>
    )
  }

  // 3. Estado vacío: sin datos, sin carga y sin error
  if (!hasCrew) {
    return (
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 4, sm: 6 },
          textAlign: 'center',
          backgroundColor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" component="h2" sx={{ fontWeight: 650 }}>
          No crew members available
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, maxWidth: '42ch', mx: 'auto' }}
        >
          There are no astronauts on this mission roster.
        </Typography>
      </Paper>
    )
  }

  // Conteo operativo de conectividad
  const totalCount = crew.length
  const onlineCount = crew.filter((c) => c.connectionStatus === 'online').length
  const offlineCount = crew.filter((c) => c.connectionStatus === 'offline').length
  const unknownCount = crew.filter(
    (c) => c.connectionStatus !== 'online' && c.connectionStatus !== 'offline'
  ).length

  return (
    <Stack spacing={{ xs: 2.5, sm: 3 }}>
      {/* 4. Recarga con datos previos: mantener tarjetas y mostrar barra de progreso */}
      {isLoading && (
        <Box role="status" aria-live="polite">
          <LinearProgress color="primary" sx={{ borderRadius: 1, mb: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Refreshing crew data in the background…
          </Typography>
        </Box>
      )}

      {/* 5. Error con datos previos: mantener tarjetas y mostrar advertencia */}
      {!isLoading && cleanError && (
        <Alert
          severity="warning"
          variant="outlined"
          action={
            onRetry ? (
              <Button color="inherit" size="small" onClick={onRetry} sx={{ fontWeight: 600 }}>
                Retry
              </Button>
            ) : undefined
          }
          sx={{ borderRadius: 2 }}
        >
          <Typography variant="body2">
            Could not refresh the crew roster: {cleanError}. Showing previously loaded data.
          </Typography>
        </Alert>
      )}

      {/* Cabecera y Resumen Operativo de Conectividad */}
      <Box
        component="section"
        aria-label="Crew status summary"
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.5,
        }}
      >
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          Mission Crew
        </Typography>

        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            size="small"
            variant="outlined"
            label={`Total: ${totalCount}`}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            size="small"
            color="success"
            variant="outlined"
            label={`● Online: ${onlineCount}`}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            size="small"
            color="default"
            variant="outlined"
            label={`○ Offline: ${offlineCount}`}
            sx={{ fontWeight: 600 }}
          />
          <Chip
            size="small"
            color="default"
            variant="outlined"
            label={`? Unknown: ${unknownCount}`}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </Box>

      {/* Cuadrícula Adaptable de Tarjetas de Astronautas */}
      <Box
        component="ul"
        aria-label="Mission astronaut list"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(3, minmax(0, 1fr))',
          },
          gap: { xs: 2, sm: 2.5 },
        }}
      >
        {crew.map((member) => {
          const isSelected = Boolean(selectedId && member.id === selectedId)

          return (
            <Box
              component="li"
              key={member.id}
              aria-current={isSelected ? 'true' : undefined}
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                ...(isSelected && {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 3,
                }),
              }}
            >
              {isSelected && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: 12,
                    zIndex: 1,
                  }}
                >
                  <Chip
                    size="small"
                    color="primary"
                    label="Selected"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      height: 20,
                      color: '#0c1422',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                    }}
                  />
                </Box>
              )}
              <AstronautCard
                id={member.id}
                name={member.name}
                connectionStatus={member.connectionStatus}
                generalStatus={member.generalStatus}
                lastContactFormatted={member.lastContactFormatted}
                summary={member.summary}
                onSelect={onSelect}
              />
            </Box>
          )
        })}
      </Box>
    </Stack>
  )
}

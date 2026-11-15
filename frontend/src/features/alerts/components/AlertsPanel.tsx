import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useId } from 'react'
import { AlertCard } from './AlertCard'
import type { AlertCardProps, AlertSeverity } from './AlertCard'

export type AlertFilter = 'all' | AlertSeverity

export type AlertsPanelStatus = 'loading' | 'success' | 'empty' | 'error'

/** Datos ya adaptados para la tarjeta; el acuse se controla a nivel del panel. */
export type AlertsPanelItem = Omit<AlertCardProps, 'onAcknowledge'>

export interface AlertsPanelProps {
  /** Colección recibida del consumidor, en el orden que debe conservarse. */
  alerts: AlertsPanelItem[]
  /** Estado de la consulta comunicado por el consumidor. */
  status: AlertsPanelStatus
  /** Filtro controlado por el consumidor. */
  selectedFilter: AlertFilter
  /** Texto de error preparado para presentación, nunca un detalle técnico crudo. */
  errorMessage?: string | null
  onFilterChange?: (filter: AlertFilter) => void
  onRetry?: () => void
  onAcknowledge?: AlertCardProps['onAcknowledge']
}

const FILTER_OPTIONS: Array<{ value: AlertFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'info', label: 'Informativas' },
  { value: 'warning', label: 'Advertencias' },
  { value: 'critical', label: 'Críticas' },
  { value: 'unknown', label: 'Desconocidas' },
]

export function AlertsPanel({
  alerts,
  status,
  selectedFilter,
  errorMessage,
  onFilterChange,
  onRetry,
  onAcknowledge,
}: AlertsPanelProps) {
  const titleId = useId()
  const filteredAlerts = alerts.filter((alert) => selectedFilter === 'all' || alert.severity === selectedFilter)

  const cleanErrorMessage = errorMessage?.trim()

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-labelledby={titleId}
      sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography id={titleId} variant="h5" component="h2" sx={{ fontWeight: 700 }}>
            Alertas activas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Avisos activos del astronauta seleccionado · Procedencia no informada por la API.
          </Typography>
        </Box>

        {status === 'success' && alerts.length > 0 && <ToggleButtonGroup
          value={selectedFilter}
          exclusive
          fullWidth
          size="small"
          disabled={!onFilterChange}
          aria-label="Filtrar alertas por severidad"
          onChange={(_event, nextFilter: AlertFilter | null) => {
            if (nextFilter) onFilterChange?.(nextFilter)
          }}
          sx={{ flexWrap: 'wrap' }}
        >
          {FILTER_OPTIONS.filter(({ value }) => value === 'all' || alerts.some((alert) => alert.severity === value)).map((option) => (
            <ToggleButton key={option.value} value={option.value} sx={{ flex: '1 1 auto', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 } }}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>}

        {status === 'loading' && (
          <Stack role="status" aria-live="polite" direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <CircularProgress size={22} aria-label="Cargando alertas" />
            <Typography variant="body2">Cargando alertas…</Typography>
          </Stack>
        )}

        {status === 'error' && (
          <Alert
            severity="error"
            variant="outlined"
            action={
              onRetry ? (
                <Button color="inherit" size="small" onClick={onRetry}>
                  Reintentar
                </Button>
              ) : undefined
            }
          >
            <Typography variant="body2">
              {cleanErrorMessage || 'No se pudieron cargar las alertas.'}
            </Typography>
          </Alert>
        )}

        {(status === 'empty' || (status === 'success' && alerts.length === 0)) && (
          <Alert severity="info" variant="outlined">
            No hay alertas disponibles.
          </Alert>
        )}

        {status === 'success' && alerts.length > 0 && filteredAlerts.length === 0 && (
          <Alert severity="info" variant="outlined">
            No hay alertas para este filtro.
          </Alert>
        )}

        {status === 'success' && filteredAlerts.length > 0 && (
          <Stack component="ul" spacing={2} aria-label="Lista de alertas" sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {filteredAlerts.map((alert) => (
              <Box component="li" key={alert.id} sx={{ minWidth: 0 }}>
                <AlertCard {...alert} onAcknowledge={onAcknowledge} />
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}

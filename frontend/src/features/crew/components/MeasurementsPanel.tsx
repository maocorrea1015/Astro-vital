import type { TelemetryVariable, SensorQuality } from './MeasurementIndicator'
import { MeasurementIndicator } from './MeasurementIndicator'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export interface CurrentMeasurementItem {
  /** Variable fisiológica o ambiental monitoreada */
  variable: TelemetryVariable
  /** Etiqueta descriptiva para visualización (ej. 'Frecuencia cardíaca') */
  variableLabel?: string | null
  /** Valor numérico medido (0 es válido) */
  value?: number | null
  /** Unidad física confirmada (ej. 'bpm', '%', '°C', 'CPM') */
  unit?: string | null
  /** Marca de tiempo legible de la muestra */
  timeFormatted?: string | null
  /** Calidad reportada por el transductor/sensor */
  quality?: SensorQuality
  /** Bandera que indica si la lectura se considera obsoleta por antigüedad */
  isStale?: boolean
}

export interface MeasurementsPanelProps {
  /** Colección de mediciones actuales del tripulante */
  measurements: CurrentMeasurementItem[]
  /** Nombre o identificador del astronauta */
  astronautName?: string | null
  /** Fecha/hora formateada de la última sincronización general */
  lastUpdatedFormatted?: string | null
  /** Indica si la consulta o recarga está en progreso */
  isLoading?: boolean
  /** Mensaje de error en caso de fallo en la consulta */
  errorMessage?: string | null
  /** Callback para reintentar la consulta en caso de error */
  onRetry?: () => void
  /** Indica si los datos provienen de un escenario simulado de demo */
  isSimulated?: boolean
}

export function MeasurementsPanel({
  measurements,
  astronautName,
  lastUpdatedFormatted,
  isLoading = false,
  errorMessage,
  onRetry,
  isSimulated = false,
}: MeasurementsPanelProps) {
  const hasMeasurements = measurements.length > 0
  const cleanError = errorMessage?.trim() || null
  const cleanName = astronautName?.trim() || null
  const cleanLastUpdated = lastUpdatedFormatted?.trim() || null

  // 1. Carga inicial: sin datos previos y con carga activa
  if (!hasMeasurements && isLoading) {
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
        <Typography variant="h6" component="h3" sx={{ fontWeight: 650 }}>
          Cargando telemetría...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {cleanName
            ? `Consultando lecturas actuales de ${cleanName}.`
            : 'Consultando lecturas fisiológicas y ambientales.'}
        </Typography>
      </Paper>
    )
  }

  // 2. Error inicial: sin datos previos y con mensaje de fallo
  if (!hasMeasurements && cleanError) {
    return (
      <Alert
        severity="error"
        variant="outlined"
        action={
          onRetry ? (
            <Button color="inherit" size="small" onClick={onRetry} sx={{ fontWeight: 600 }}>
              Reintentar
            </Button>
          ) : undefined
        }
        sx={{ borderRadius: 2 }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Error al cargar mediciones
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {cleanError}
        </Typography>
      </Alert>
    )
  }

  // 3. Estado vacío: sin datos, sin carga y sin error
  if (!hasMeasurements) {
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
        <Typography variant="h6" component="h3" sx={{ fontWeight: 650 }}>
          No hay mediciones disponibles
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, maxWidth: '42ch', mx: 'auto' }}
        >
          {cleanName
            ? `Actualmente no se registran datos telemétricos para ${cleanName}.`
            : 'Actualmente no se registran datos telemétricos en esta selección.'}
        </Typography>
      </Paper>
    )
  }

  return (
    <Stack spacing={{ xs: 2.5, sm: 3 }}>
      {/* 4. Recarga con datos previos: mantener indicadores y mostrar barra de progreso */}
      {isLoading && (
        <Box role="status" aria-live="polite">
          <LinearProgress color="primary" sx={{ borderRadius: 1, mb: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Actualizando lecturas en segundo plano...
          </Typography>
        </Box>
      )}

      {/* 5. Error con datos previos: mantener indicadores y mostrar advertencia (visible incluso durante recarga) */}
      {cleanError && (
        <Alert
          severity="warning"
          variant="outlined"
          action={
            onRetry && !isLoading ? (
              <Button color="inherit" size="small" onClick={onRetry} sx={{ fontWeight: 600 }}>
                Reintentar
              </Button>
            ) : undefined
          }
          sx={{ borderRadius: 2 }}
        >
          <Typography variant="body2">
            No se pudieron actualizar las lecturas: {cleanError}. Mostrando datos previos.
          </Typography>
        </Alert>
      )}

      {/* Cabecera del Panel */}
      <Box
        component="section"
        aria-label="Encabezado de mediciones actuales"
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
            {cleanName ? `Mediciones · ${cleanName}` : 'Mediciones fisiológicas y ambientales'}
          </Typography>
          {cleanLastUpdated && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              Última actualización general: {cleanLastUpdated}
            </Typography>
          )}
        </Box>

        {isSimulated && (
          <Chip
            size="small"
            variant="outlined"
            color="info"
            label="Simulación / Demo"
            sx={{ fontWeight: 600 }}
          />
        )}
      </Box>

      {/* Cuadrícula Adaptable de Indicadores de Medición */}
      <Box
        component="ul"
        aria-label="Lista de indicadores de telemetría"
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: { xs: 2, sm: 2.5 },
        }}
      >
        {measurements.map((item, index) => (
          <Box
            component="li"
            key={`${item.variable}-${index}`}
            sx={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <MeasurementIndicator
              variable={item.variable}
              variableLabel={item.variableLabel}
              value={item.value}
              unit={item.unit}
              timeFormatted={item.timeFormatted}
              quality={item.quality}
              isStale={item.isStale}
            />
          </Box>
        ))}
      </Box>
    </Stack>
  )
}

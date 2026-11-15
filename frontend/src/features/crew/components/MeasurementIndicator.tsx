import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export type TelemetryVariable =
  | 'heart_rate'
  | 'spo2'
  | 'temperature'
  | 'radiation_cpm'
  | 'activity'
  | string

export type SensorQuality = 'ok' | 'degraded' | 'sensor_fault' | 'unknown'

export interface MeasurementIndicatorProps {
  /** Variable monitoreada (clave estándar del contrato o extensible) */
  variable: TelemetryVariable
  /** Etiqueta descriptiva para visualización (ej. 'Heart Rate') */
  variableLabel?: string | null
  /**
   * Valor numérico medido.
   * IMPORTANTE: El valor 0 es numéricamente válido y no representa ausencia.
   */
  value?: number | null
  /** Unidad física confirmada (ej. 'bpm', '%', '°C', 'CPM'). Omitir si no está confirmada */
  unit?: string | null
  /** Marca de tiempo legible de la muestra */
  timeFormatted?: string | null
  /** Estado de calidad del transductor/sensor */
  quality?: SensorQuality
  /** Bandera que indica si la muestra excede el límite de frescura operativa */
  isStale?: boolean
  /** Formato de precisión acordado para la variable, si existe. */
  formatValue?: (value: number, variable: TelemetryVariable) => string
}

const DEFAULT_VARIABLE_LABELS: Record<string, string> = {
  heart_rate: 'Heart Rate',
  spo2: 'Oxygen Saturation (SpO₂)',
  temperature: 'Body Temperature',
  radiation_cpm: 'Radiation Rate',
  activity: 'Activity Level',
}

const QUALITY_CONFIG: Record<
  SensorQuality,
  { label: string; color: 'success' | 'warning' | 'error' | 'default'; description: string }
> = {
  ok: {
    label: 'Nominal quality',
    color: 'success',
    description: 'Sensor operating within expected parameters',
  },
  degraded: {
    label: 'Degraded quality',
    color: 'warning',
    description: 'Noisy or less precise signal',
  },
  sensor_fault: {
    label: 'Sensor Fault',
    color: 'error',
    description: 'Transducer fault. Reading invalid for assessment.',
  },
  unknown: {
    label: 'Quality not assessed',
    color: 'default',
    description: 'The source did not report quality status',
  },
}

const standardNumber = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 17 })
const tinyNumber = new Intl.NumberFormat('en-US', {
  notation: 'scientific', maximumSignificantDigits: 17,
})

export function MeasurementIndicator({
  variable,
  variableLabel,
  value,
  unit,
  timeFormatted,
  quality = 'unknown',
  isStale = false,
  formatValue,
}: MeasurementIndicatorProps) {
  const displayLabel =
    variableLabel?.trim() || (Object.hasOwn(DEFAULT_VARIABLE_LABELS, variable) ? DEFAULT_VARIABLE_LABELS[variable] : variable)

  const hasValue = typeof value === 'number' && Number.isFinite(value)
  const isZero = hasValue && value === 0
  const isFault = quality === 'sensor_fault'
  const qualityCfg = QUALITY_CONFIG[quality] ?? QUALITY_CONFIG.unknown

  const formatter = hasValue && value !== 0 && Math.abs(value) < 0.000001 ? tinyNumber : standardNumber
  const formattedValue = hasValue ? (formatValue?.(value, variable) ?? formatter.format(value)) : ''

  return (
    <Card
      variant="outlined"
      sx={{
        backgroundColor: 'background.paper',
        overflowWrap: 'anywhere',
        borderRadius: 2,
        borderInlineStartWidth: 4,
        borderInlineStartColor: isFault
          ? 'error.main'
          : isStale
            ? 'warning.main'
            : 'primary.main',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.25 } }}>
        <Stack spacing={1.5}>
          {/* Cabecera del Indicador */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography
                variant="subtitle2"
                component="h3"
                sx={{
                  fontWeight: 600,
                  color: 'text.primary',
                  lineHeight: 1.25,
                  wordBreak: 'break-word',
                }}
              >
                {displayLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Clave: {variable}
              </Typography>
            </Box>

            {/* Badges de Calidad y Obsolescencia */}
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {isStale && (
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label="Stale Reading"
                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                />
              )}
              {quality !== 'ok' && (
                <Chip
                  size="small"
                  color={qualityCfg.color}
                  label={qualityCfg.label}
                  title={qualityCfg.description}
                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                />
              )}
            </Stack>
          </Box>

          {/* Valor Numérico y Unidad */}
          <Box sx={{ my: 0.5 }}>
            {hasValue ? (
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
                <Typography
                  variant="h3"
                  component="span"
                  sx={{
                    fontWeight: 750,
                    lineHeight: 1,
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    color: isFault ? 'text.secondary' : 'text.primary',
                    textDecoration: isFault ? 'line-through' : 'none',
                    opacity: isFault ? 0.6 : 1,
                  }}
                >
                  {formattedValue}
                </Typography>
                {unit && unit.trim().length > 0 && (
                  <Typography
                    variant="h6"
                    component="span"
                    color="text.secondary"
                    sx={{ fontWeight: 500, fontSize: { xs: '1rem', sm: '1.2rem' } }}
                  >
                    {unit}
                  </Typography>
                )}
                {unit === null && <Typography variant="caption">Unit unconfirmed</Typography>}
                {isZero && (
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    (valor exacto cero)
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography
                variant="h5"
                component="span"
                color="text.secondary"
                sx={{ fontStyle: 'italic', fontWeight: 500 }}
              >
                No data available
              </Typography>
            )}

            {/* Warning especial si el transductor está averiado */}
            {isFault && hasValue && (
              <Typography
                variant="caption"
                color="error.main"
                sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}
              >
                Warning: The reading is unreliable because a sensor fault was detected.
              </Typography>
            )}
          </Box>

          {/* Información Temporal y Trazabilidad */}
          <Box sx={{ pt: 0.5, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Reading time:{' '}
              <Box component="span" sx={{ color: 'text.primary' }}>
                {timeFormatted?.trim() || 'Time not recorded'}
              </Box>
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

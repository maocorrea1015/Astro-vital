import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export type AlertSeverity = 'warning' | 'critical' | 'unknown'

export interface AlertCardProps {
  /** Identificador único de la alerta en el backend */
  id: string | number
  /** Severidad clínica u operativa asignada */
  severity: AlertSeverity
  /** Código de la variable relacionada (ej. 'heart_rate') */
  variable?: string | null
  /** Etiqueta legible de la variable (ej. 'Frecuencia cardíaca') */
  variableLabel?: string | null
  /** Mensaje informativo o clínico autorizado para la interfaz */
  message: string
  /** Fecha/hora formateada de la generación de la alerta */
  timeFormatted?: string | null
  /**
   * Estado de acuse de recibo de la alerta.
   * true = confirmada/atendida, false = pendiente, null/undefined = estado no informado.
   */
  acknowledged?: boolean | null
  /** Fecha/hora formateada en que se registró el reconocimiento */
  acknowledgedAtFormatted?: string | null
  /** Bandera que identifica que la alerta proviene de un escenario simulado de demo */
  isSimulated?: boolean
  /** Orientación o guía de acción aprobada por personal médico */
  description?: string | null
  /** Callback para solicitar el acuse de la alerta */
  onAcknowledge?: (id: string | number) => void
  /** Bandera que indica que la solicitud de acuse está en proceso */
  isAcknowledging?: boolean
}

const SEVERITY_CONFIG: Record<
  AlertSeverity,
  { label: string; color: 'error' | 'warning' | 'default'; borderColor: string }
> = {
  critical: {
    label: 'Estado crítico',
    color: 'error',
    borderColor: 'error.main',
  },
  warning: {
    label: 'Advertencia',
    color: 'warning',
    borderColor: 'warning.main',
  },
  unknown: {
    label: 'Aviso general',
    color: 'default',
    borderColor: 'divider',
  },
}

export function AlertCard({
  id,
  severity,
  variable,
  variableLabel,
  message,
  timeFormatted,
  acknowledged,
  acknowledgedAtFormatted,
  isSimulated = false,
  description,
  onAcknowledge,
  isAcknowledging = false,
}: AlertCardProps) {
  const sevCfg = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.unknown
  const isPending = acknowledged === false
  const isConfirmed = acknowledged === true
  const canAcknowledge = isPending && typeof onAcknowledge === 'function'

  const displayMessage = message.trim() || 'Aviso de alerta sin descripción'

  const cleanVarLabel = variableLabel?.trim()
  const cleanVar = variable?.trim()
  const displayVariable = cleanVarLabel || cleanVar
  const showVariableKey = Boolean(cleanVar && cleanVarLabel && cleanVar !== cleanVarLabel)

  const cleanAcknowledgedAt = acknowledgedAtFormatted?.trim()
  const cleanDescription = description?.trim()
  const cleanTime = timeFormatted?.trim()

  return (
    <Card
      variant="outlined"
      sx={{
        backgroundColor: 'background.paper',
        borderRadius: 2,
        borderInlineStartWidth: 4,
        borderInlineStartColor: sevCfg.borderColor,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack spacing={1.75}>
          {/* Fila Superior: Severidad, Procedencia Simulada y Estado de Acuse */}
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
              <Chip
                size="small"
                color={sevCfg.color}
                label={sevCfg.label}
                sx={{ fontWeight: 700 }}
              />
              {isSimulated && (
                <Chip
                  size="small"
                  variant="outlined"
                  color="info"
                  label="Simulación / Demo"
                  sx={{ fontWeight: 600 }}
                />
              )}
            </Stack>

            <Box>
              {isConfirmed ? (
                <Chip
                  size="small"
                  color="success"
                  variant="outlined"
                  label={
                    cleanAcknowledgedAt
                      ? `Reconocida: ${cleanAcknowledgedAt}`
                      : 'Reconocida'
                  }
                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                />
              ) : isPending ? (
                <Chip
                  size="small"
                  color="warning"
                  variant="outlined"
                  label="Pendiente de acuse"
                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                />
              ) : (
                <Chip
                  size="small"
                  color="default"
                  variant="outlined"
                  label="Estado de acuse no disponible"
                  sx={{ fontSize: '0.75rem' }}
                />
              )}
            </Box>
          </Stack>

          {/* Mensaje de la Alerta y Variable Afectada */}
          <Box>
            <Typography
              variant="h6"
              component="h3"
              sx={{
                fontWeight: 650,
                fontSize: { xs: '1.05rem', sm: '1.15rem' },
                lineHeight: 1.35,
                wordBreak: 'break-word',
              }}
            >
              {displayMessage}
            </Typography>
            {displayVariable && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Variable vinculada: {displayVariable} {showVariableKey ? `(${cleanVar})` : ''} · Alerta #{id}
              </Typography>
            )}
          </Box>

          {/* Guía o Procedimiento Aprobado (si existe) */}
          {cleanDescription && (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                backgroundColor: 'rgba(147, 217, 244, 0.08)',
                border: '1px solid',
                borderColor: 'info.main',
              }}
            >
              <Typography variant="caption" color="info.main" sx={{ fontWeight: 700, display: 'block', mb: 0.25 }}>
                Guía operativa de referencia:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.85rem', wordBreak: 'break-word' }}>
                {cleanDescription}
              </Typography>
            </Box>
          )}

          {/* Pie de Tarjeta: Timestamp y Botón de Acción */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{
              pt: 1,
              borderTop: '1px solid',
              borderColor: 'divider',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Registrada:{' '}
              <Box component="span" sx={{ color: 'text.primary' }}>
                {cleanTime || 'Hora no disponible'}
              </Box>
            </Typography>

            {canAcknowledge && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                disabled={isAcknowledging}
                onClick={() => onAcknowledge(id)}
                aria-label={`Reconocer alerta ${id}: ${displayMessage}`}
                sx={{
                  fontWeight: 600,
                  alignSelf: { xs: 'stretch', sm: 'auto' },
                  color: '#0c1422', // Contraste oscuro contra primary.main (#93d9f4)
                }}
              >
                {isAcknowledging ? 'Reconociendo...' : 'Reconocer alerta'}
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}

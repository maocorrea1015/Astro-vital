import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export type ConnectionStatus = 'online' | 'offline' | 'unknown'
export type GeneralStatus = 'normal' | 'warning' | 'critical' | 'unknown'

export interface AstronautCardProps {
  /** Identificador único y estable del astronauta (ej. 'astro-01') */
  id: string
  /** Nombre completo o alias del tripulante. Si falta, se prioriza el ID */
  name?: string | null
  /** Estado de conectividad telemétrica del nodo/traje */
  connectionStatus: ConnectionStatus
  /** Estado general derivado de alertas vigentes (no es diagnóstico clínico) */
  generalStatus: GeneralStatus
  /** Fecha/hora legible del último contacto recibido del nodo */
  lastContactFormatted?: string | null
  /** Resumen textual opcional de indicadores o actividad */
  summary?: string | null
  /** Callback invocado al seleccionar la tarjeta */
  onSelect?: (id: string) => void
  headingComponent?: 'h2' | 'h3'
}

const GENERAL_STATUS_CONFIG: Record<
  GeneralStatus,
  { label: string; color: 'success' | 'warning' | 'error' | 'default' }
> = {
  normal: {
    label: 'Normal',
    color: 'default',
  },
  warning: {
    label: 'Advertencia',
    color: 'warning',
  },
  critical: {
    label: 'Crítico',
    color: 'error',
  },
  unknown: {
    label: 'No disponible',
    color: 'default',
  },
}

const CONNECTION_STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; color: 'success' | 'default'; symbol: string }
> = {
  online: {
    label: 'Nodo en línea',
    color: 'success',
    symbol: '●',
  },
  offline: {
    label: 'Nodo sin conexión',
    color: 'default',
    symbol: '○',
  },
  unknown: {
    label: 'Conexión desconocida',
    color: 'default',
    symbol: '?',
  },
}

const statusChipStyle = {
  fontWeight: 600,
  height: 'auto',
  minHeight: 24,
  '& .MuiChip-label': { whiteSpace: 'normal', overflowWrap: 'anywhere' },
}

export function AstronautCard({
  id,
  name,
  connectionStatus,
  generalStatus,
  lastContactFormatted,
  summary,
  onSelect,
  headingComponent = 'h3',
}: AstronautCardProps) {
  const displayName = name?.trim() || id
  const hasCustomName = Boolean(name?.trim())
  const generalCfg = GENERAL_STATUS_CONFIG[generalStatus] ?? GENERAL_STATUS_CONFIG.unknown
  const connectionCfg =
    CONNECTION_STATUS_CONFIG[connectionStatus] ?? CONNECTION_STATUS_CONFIG.unknown

  const cardContent = (
    <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Stack spacing={1.5}>
        {/* Cabecera con Nombre e Identificador */}
        <Box>
          <Typography
            variant="h6"
            component={headingComponent}
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              lineHeight: 1.3,
              wordBreak: 'break-word',
            }}
          >
            {displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            ID: {id} {hasCustomName ? '' : '· (Nombre no asignado)'}
          </Typography>
        </Box>

        {/* Insignias de Estado: Separación estricta de Conexión y Estado General */}
        <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            size="small"
            variant="outlined"
            color={connectionCfg.color}
            label={`${connectionCfg.symbol} ${connectionCfg.label}`}
            sx={statusChipStyle}
          />
          <Chip
            size="small"
            color={generalCfg.color}
            label={'Estado reportado: ' + generalCfg.label}
            sx={statusChipStyle}
          />
        </Stack>

        {/* Información de Último Contacto */}
        <Box sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            Último contacto:{' '}
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 500 }}>
              {lastContactFormatted && lastContactFormatted.trim().length > 0
                ? lastContactFormatted
                : 'Sin registro de contacto'}
            </Box>
          </Typography>
        </Box>

        {/* Resumen opcional */}
        {summary && summary.trim().length > 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              pt: 0.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              fontSize: '0.825rem',
              wordBreak: 'break-word',
            }}
          >
            {summary}
          </Typography>
        )}
      </Stack>
    </CardContent>
  )

  const isInteractive = typeof onSelect === 'function'

  return (
    <Card
      variant="outlined"
      sx={{
        backgroundColor: 'background.paper',
        overflowWrap: 'anywhere',
        borderRadius: 2,
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': isInteractive
          ? {
              borderColor: 'primary.main',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }
          : undefined,
      }}
    >
      {isInteractive ? (
        <CardActionArea
          onClick={() => onSelect(id)}
          aria-label={`Seleccionar a ${displayName}, identificador ${id}. ${connectionCfg.label}. Estado reportado: ${generalCfg.label}`}
          sx={{
            textAlign: 'left',
            '&.Mui-focusVisible': { outlineOffset: -3 },
            borderRadius: 2,
          }}
        >
          {cardContent}
        </CardActionArea>
      ) : (
        cardContent
      )}
    </Card>
  )
}

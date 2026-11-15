import { useState } from 'react'
import { useTheme } from '@mui/material/styles'
import type { TelemetryVariable, SensorQuality } from './MeasurementIndicator'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

export interface TelemetryTrendPoint {
  /** Marca de tiempo exclusivamente en segundos UNIX */
  timestamp: number
  /** Valor numérico de la muestra (0 es un dato válido) */
  value: number
  /** Representación textual formateada de la hora de la toma */
  timeFormatted: string
  /** Estado de calidad del sensor en el instante de la lectura */
  quality: SensorQuality
  /** Bandera opcional de lectura atrasada u obsoleta in the series */
  isStale?: boolean
}

export interface MeasurementTrendProps {
  /** Clave de la variable de telemetría */
  variable: TelemetryVariable
  /** Nombre amigable de la variable (ej. 'Heart Rate') */
  variableLabel?: string | null
  /** Unidad física confirmada (ej. 'bpm', '%', '°C'). Omitir si no está confirmada */
  unit?: string | null
  /** Puntos históricos de telemetría (se asume ya filtrados para el rango) */
  points: TelemetryTrendPoint[]
  /** Ventana temporal seleccionada (controlada por el consumidor) */
  selectedRange?: string
  /** Opciones de filtros temporales disponibles suministradas por el consumidor */
  availableRanges?: string[]
  /** Callback al solicitar un cambio de ventana temporal */
  onRangeChange?: (range: string) => void
  /** Indica si la consulta o recarga histórica está en progreso */
  isLoading?: boolean
  /** Mensaje de error al consultar history */
  errorMessage?: string | null
  /** Callback para reintentar la consulta en caso de error */
  onRetry?: () => void
  /** Indica si los datos provienen de un escenario simulado de demo */
  isSimulated?: boolean
}

const DEFAULT_LABELS: Record<string, string> = {
  heart_rate: 'Heart Rate',
  spo2: 'Oxygen Saturation (SpO₂)',
  temperature: 'Body Temperature',
  radiation_cpm: 'Radiation Rate',
  activity: 'Activity Level',
}

const QUALITY_LABELS: Record<SensorQuality, string> = {
  ok: 'Nominal',
  degraded: 'Degraded',
  sensor_fault: 'Sensor Fault',
  unknown: 'Not assessed',
}

const formatValue = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 21 }).format

export function MeasurementTrend({
  variable,
  variableLabel,
  unit,
  points,
  selectedRange,
  availableRanges,
  onRangeChange,
  isLoading = false,
  errorMessage,
  onRetry,
  isSimulated = false,
}: MeasurementTrendProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart')
  const theme = useTheme()

  const displayLabel =
    variableLabel?.trim() || DEFAULT_LABELS[variable] || variable
  const displayUnit = unit?.trim() || ''
  const cleanError = errorMessage?.trim() || null

  const validRanges =
    availableRanges && availableRanges.length > 0
      ? availableRanges.filter((r) => typeof r === 'string' && r.trim().length > 0)
      : []

  const hasPoints = points.length > 0

  // 1. Carga inicial: sin datos previos y con carga activa
  if (!hasPoints && isLoading) {
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
          Loading historical trend…
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Loading the time series for {displayLabel}.
        </Typography>
      </Paper>
    )
  }

  // 2. Error inicial: sin datos previos y con mensaje de fallo
  if (!hasPoints && cleanError) {
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
          Could not load history for {displayLabel}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {cleanError}
        </Typography>
      </Alert>
    )
  }

  // 3. Estado vacío: sin datos, sin carga y sin error
  if (!hasPoints) {
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
          No historical data
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mt: 1, maxWidth: '42ch', mx: 'auto' }}
        >
          No historical readings were recorded for {displayLabel} in this time range.
        </Typography>
      </Paper>
    )
  }

  // 4. Procesamiento cronológico inmutable (orden ascendente de tiempo)
  const sortedPoints = [...points].sort((a, b) => a.timestamp - b.timestamp)
  const stalePointCount = sortedPoints.filter((point) => point.isStale).length

  // 5. Cálculo determinista de intervalos y umbral de huecos temporales
  // Fórmula: T = min(900, max(600, 3 * M))
  const positiveIntervals: number[] = []
  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const diff = sortedPoints[i + 1].timestamp - sortedPoints[i].timestamp
    if (diff > 0) {
      positiveIntervals.push(diff)
    }
  }

  let medianInterval = 0
  if (positiveIntervals.length > 0) {
    const sortedIntervals = [...positiveIntervals].sort((a, b) => a - b)
    const mid = Math.floor(sortedIntervals.length / 2)
    medianInterval =
      sortedIntervals.length % 2 !== 0
        ? sortedIntervals[mid]
        : (sortedIntervals[mid - 1] + sortedIntervals[mid]) / 2
  }

  const gapThreshold =
    positiveIntervals.length > 0
      ? Math.min(900, Math.max(600, 3 * medianInterval))
      : 900 // Fallback determinista si no existen intervalos positivos suficientes

  // Comprobación de hueco posterior para cada punto
  const isGapAfter = (idx: number): boolean => {
    if (idx >= sortedPoints.length - 1) return false
    return sortedPoints[idx + 1].timestamp - sortedPoints[idx].timestamp > gapThreshold
  }

  // Dimensiones y escalas del SVG
  const svgWidth = 800
  const svgHeight = 320
  const padLeft = 60
  const padRight = 40
  const padTop = 30
  const padBottom = 45
  const plotWidth = svgWidth - padLeft - padRight
  const plotHeight = svgHeight - padTop - padBottom

  const minTs = sortedPoints[0].timestamp
  const maxTs = sortedPoints[sortedPoints.length - 1].timestamp
  const tsSpan = maxTs - minTs

  const getX = (ts: number): number => {
    if (tsSpan <= 0) return padLeft + plotWidth / 2
    return padLeft + ((ts - minTs) / tsSpan) * plotWidth
  }

  // Cálculo de rango vertical (conservando 0 como dato válido)
  const values = sortedPoints.map((p) => p.value)
  const minValRaw = Math.min(...values)
  const maxValRaw = Math.max(...values)
  const valSpanRaw = maxValRaw - minValRaw

  let yFloor: number
  let yCeil: number
  if (valSpanRaw <= 0) {
    yFloor = minValRaw === 0 ? -1 : minValRaw - 1
    yCeil = maxValRaw === 0 ? 1 : maxValRaw + 1
  } else {
    // Margen vertical del 10% para no recortar marcadores en los límites
    const padVal = valSpanRaw * 0.1
    yFloor = minValRaw - padVal
    yCeil = maxValRaw + padVal
  }
  const valSpan = yCeil - yFloor

  const getY = (val: number): number => {
    return padTop + plotHeight - ((val - yFloor) / valSpan) * plotHeight
  }

  // 6. Segmentación del trazado SVG:
  // - Iniciar con 'M x y'
  // - Conectar con 'L x y' solo en el mismo segmento continuo
  // - Interrumpir ante hueco temporal (diff > gapThreshold)
  // - Interrumpir ante punto con fallo de sensor (quality === 'sensor_fault')
  // - El siguiente punto válido inicia un nuevo segmento con 'M x y'
  // - Solo se emiten rutas con 2 o más puntos para evitar comandos 'M' huérfanos sin trazo
  interface Segment {
    d: string
  }
  const lineSegments: Segment[] = []
  let currentSegmentPoints: { x: number; y: number }[] = []

  for (let i = 0; i < sortedPoints.length; i++) {
    const pt = sortedPoints[i]
    const isFault = pt.quality === 'sensor_fault'
    const x = getX(pt.timestamp)
    const y = getY(pt.value)

    if (isFault) {
      if (currentSegmentPoints.length > 1) {
        lineSegments.push({
          d: currentSegmentPoints
            .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
            .join(' '),
        })
      }
      currentSegmentPoints = []
      continue
    }

    if (currentSegmentPoints.length === 0) {
      currentSegmentPoints.push({ x, y })
    } else {
      // Comprobar si el punto anterior provocó un hueco temporal
      const prevPt = sortedPoints[i - 1]
      const diff = pt.timestamp - prevPt.timestamp
      if (diff > gapThreshold) {
        if (currentSegmentPoints.length > 1) {
          lineSegments.push({
            d: currentSegmentPoints
              .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
              .join(' '),
          })
        }
        currentSegmentPoints = [{ x, y }]
      } else {
        currentSegmentPoints.push({ x, y })
      }
    }
  }
  if (currentSegmentPoints.length > 1) {
    lineSegments.push({
      d: currentSegmentPoints
        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(' '),
    })
  }

  // Generación de marcas para eje Y (evita solapamiento de líneas y etiquetas en series constantes)
  const yTicks =
    valSpanRaw > 0
      ? [
          { val: minValRaw, y: getY(minValRaw) },
          { val: (minValRaw + maxValRaw) / 2, y: getY((minValRaw + maxValRaw) / 2) },
          { val: maxValRaw, y: getY(maxValRaw) },
        ]
      : [{ val: minValRaw, y: getY(minValRaw) }]

  // Formateo para marcas temporales de eje asegurando coherencia con la tabla de datos
  const formatAxisTime = (ts: number): string => {
    const date = new Date(ts * 1000)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' })
  }

  const getPointTimeLabel = (pt: TelemetryTrendPoint): string => {
    const trimmed = pt.timeFormatted?.trim()
    if (trimmed) return trimmed
    return formatAxisTime(pt.timestamp) + ' UTC'
  }

  const isSingleTimestamp = tsSpan <= 0
  const xTicks =
    !isSingleTimestamp
      ? [
          { label: formatAxisTime(sortedPoints[0].timestamp), x: getX(sortedPoints[0].timestamp) },
          {
            label: formatAxisTime(sortedPoints[sortedPoints.length - 1].timestamp),
            x: getX(sortedPoints[sortedPoints.length - 1].timestamp),
          },
        ]
      : [{ label: getPointTimeLabel(sortedPoints[0]), x: getX(sortedPoints[0].timestamp) }]

  const validPointCount = sortedPoints.filter((point) => point.quality !== 'sensor_fault').length

  return (
    <Stack spacing={{ xs: 2.5, sm: 3 }}>
      {/* Recarga en segundo plano con datos anteriores */}
      {isLoading && (
        <Box role="status" aria-live="polite">
          <LinearProgress color="primary" sx={{ borderRadius: 1, mb: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Refreshing historical readings in the background…
          </Typography>
        </Box>
      )}

      {/* Error de actualización con datos anteriores (visible incluso durante recarga) */}
      {cleanError && (
        <Alert
          severity="warning"
          variant="outlined"
          action={
            onRetry && !isLoading ? (
              <Button color="inherit" size="small" onClick={onRetry} sx={{ fontWeight: 600 }}>
                Retry
              </Button>
            ) : undefined
          }
          sx={{ borderRadius: 2 }}
        >
          <Typography variant="body2">
            Could not refresh history: {cleanError}. Showing previously loaded data.
          </Typography>
        </Alert>
      )}

      {/* Cabecera, Filtros de Rango y Control Conmutable Gráfica / Table */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2, sm: 2.5 },
          backgroundColor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <Stack spacing={2}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 1.5,
            }}
          >
            <Box>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>
                Trend Over Time · {displayLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {displayUnit ? `Unit: ${displayUnit} · ` : ''}
                {sortedPoints.length} {sortedPoints.length === 1 ? 'reading' : 'readings'} in the series · Time axis: UTC
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }} useFlexGap>
              {isSimulated && (
                <Chip
                  size="small"
                  variant="outlined"
                  color="info"
                  label="Simulation / Demo"
                  sx={{ fontWeight: 600 }}
                />
              )}

              {/* Selector de Rango Temporal Controlado (únicamente si fue provisto por el consumidor con callback) */}
              {validRanges.length > 0 && onRangeChange && (
                <Stack direction="row" spacing={0.5} role="group" aria-label="Time range filter">
                  {validRanges.map((range) => {
                    const isSelected = range.trim() === selectedRange?.trim()
                    return (
                      <Button
                        key={range}
                        size="small"
                        variant={isSelected ? 'contained' : 'outlined'}
                        onClick={() => onRangeChange?.(range)}
                        aria-pressed={isSelected}
                        sx={{
                          minWidth: 'auto',
                          px: 1.5,
                          fontWeight: isSelected ? 700 : 500,
                        }}
                      >
                        {range}
                      </Button>
                    )
                  })}
                </Stack>
              )}

              {/* Conmutador Accesible entre Chart y Table */}
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, next) => next && setViewMode(next)}
                size="small"
                aria-label="Trend display mode"
              >
                <ToggleButton value="chart" aria-label="Show as a time series chart">
                  Chart
                </ToggleButton>
                <ToggleButton value="table" aria-label="Show as an accessible data table">
                  Table
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Box>

          {/* Aviso especial cuando solo existe un único punto */}
          {validPointCount < 2 && (
            <Alert severity="info" variant="outlined" sx={{ py: 0.5 }}>
              {validPointCount === 0
                ? 'No usable readings to plot a trend line.'
                : 'Only one usable reading is available. At least two are needed to plot a trend line.'}
            </Alert>
          )}

          {/* Modo Chart SVG Nativo */}
          {viewMode === 'chart' && (
            <Box sx={{ width: '100%', overflowX: 'auto', pt: 1 }}>
              <Box
                component="svg"
                role="img"
                aria-label={`Trend chart for ${displayLabel}. Total: ${sortedPoints.length} readings. ${stalePointCount ? `Readings marked as stale: ${stalePointCount}.` : ''} Minimum value ${minValRaw}${displayUnit ? ` ${displayUnit}` : ''}, maximum value ${maxValRaw}${displayUnit ? ` ${displayUnit}` : ''}. Timestamps from ${getPointTimeLabel(sortedPoints[0])} to ${getPointTimeLabel(sortedPoints[sortedPoints.length - 1])}.`}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                sx={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',

                }}
              >
                {/* Cuadrícula de fondo y marcas de eje Y */}
                {yTicks.map((t, idx) => (
                  <g key={`ytick-${idx}`}>
                    <line
                      x1={padLeft}
                      y1={t.y}
                      x2={svgWidth - padRight}
                      y2={t.y}
                      stroke={theme.palette.divider}
                      strokeDasharray="4 4"
                      strokeWidth={1}
                    />
                    <text
                      x={padLeft - 8}
                      y={t.y + 4}
                      fill={theme.palette.text.secondary}
                      fontSize={11}
                      textAnchor="end"
                      fontFamily="system-ui, sans-serif"
                    >
                      {formatValue(t.val)}
                    </text>
                  </g>
                ))}

                {/* Ejes principales */}
                <line
                  x1={padLeft}
                  y1={padTop}
                  x2={padLeft}
                  y2={svgHeight - padBottom}
                  stroke={theme.palette.divider}
                  strokeWidth={1.5}
                />
                <line
                  x1={padLeft}
                  y1={svgHeight - padBottom}
                  x2={svgWidth - padRight}
                  y2={svgHeight - padBottom}
                  stroke={theme.palette.divider}
                  strokeWidth={1.5}
                />

                {/* Marcas de tiempo de eje X (UTC) */}
                {xTicks.map((tick, idx) => (
                  <g key={`xtick-${idx}`}>
                    <line
                      x1={tick.x}
                      y1={svgHeight - padBottom}
                      x2={tick.x}
                      y2={svgHeight - padBottom + 6}
                      stroke={theme.palette.divider}
                      strokeWidth={1.5}
                    />
                    <text
                      x={tick.x}
                      y={svgHeight - padBottom + 20}
                      fill={theme.palette.text.secondary}
                      fontSize={11}
                      textAnchor="middle"
                      fontFamily="system-ui, sans-serif"
                    >
                      {tick.label}
                    </text>
                  </g>
                ))}

                {/* Trazado segmentado: conecta puntos no averiados y se corta ante fallos o huecos temporales */}
                {lineSegments.map((seg, idx) => (
                  <path
                    key={`segment-${idx}`}
                    d={seg.d}
                    fill="none"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                ))}

                {/* Halo discontinuo neutral para indicar frescura obsoleta sin alterar la calidad */}
                {sortedPoints.map((pt, idx) =>
                  pt.isStale ? (
                    <circle
                      key={`stale-halo-${idx}`}
                      cx={getX(pt.timestamp)}
                      cy={getY(pt.value)}
                      r={9}
                      fill="none"
                      stroke={theme.palette.text.secondary}
                      strokeDasharray="2 2"
                      strokeWidth={1.5}
                    />
                  ) : null
                )}

                {/* Marcadores geométricos de calidad para cada punto */}
                {sortedPoints.map((pt, idx) => {
                  const cx = getX(pt.timestamp)
                  const cy = getY(pt.value)

                  if (pt.quality === 'sensor_fault') {
                    // Marcador de fallo de sensor: Cruz roja diferenciada (sin conectar a líneas)
                    return (
                      <g key={`point-${idx}`} stroke={theme.palette.error.main} strokeWidth={2.5} strokeLinecap="round">
                        <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} />
                        <line x1={cx - 5} y1={cy + 5} x2={cx + 5} y2={cy - 5} />
                      </g>
                    )
                  }

                  if (pt.quality === 'degraded') {
                    // Degraded quality: Rombo ámbar de advertencia
                    return (
                      <polygon
                        key={`point-${idx}`}
                        points={`${cx},${cy - 5.5} ${cx + 5.5},${cy} ${cx},${cy + 5.5} ${cx - 5.5},${cy}`}
                        fill={theme.palette.warning.main}
                        stroke={theme.palette.background.paper}
                        strokeWidth={1.5}
                      />
                    )
                  }

                  if (pt.quality === 'unknown') {
                    // Quality not assessed: Triángulo gris diferenciado
                    return (
                      <polygon
                        key={`point-${idx}`}
                        points={`${cx},${cy - 6} ${cx + 5.5},${cy + 4} ${cx - 5.5},${cy + 4}`}
                        fill={theme.palette.text.secondary}
                        stroke={theme.palette.background.paper}
                        strokeWidth={1.5}
                      />
                    )
                  }

                  // Nominal quality (ok): Círculo celeste del tema
                  return (
                    <circle
                      key={`point-${idx}`}
                      cx={cx}
                      cy={cy}
                      r={4.5}
                      fill={theme.palette.primary.main}
                      stroke={theme.palette.background.paper}
                      strokeWidth={1.5}
                    />
                  )
                })}
              </Box>

              {/* Leyenda visual no dependiente únicamente del color */}
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  mt: 1.5,
                  pt: 1,
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: 'primary.main' }} />
                  <span>● Nominal (circle)</span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box sx={{ width: 9, height: 9, transform: 'rotate(45deg)', bgcolor: 'warning.main' }} />
                  <span>◆ Degraded (diamond)</span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box
                    sx={{
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderBottom: '9px solid',
                      borderBottomColor: 'text.secondary',
                    }}
                  />
                  <span>▲ Not assessed (triangle)</span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Typography component="span" sx={{ color: 'error.main', fontWeight: 900, lineHeight: 1 }}>
                    ✕
                  </Typography>
                  <span>✕ Sensor fault (cross, not connected)</span>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      border: '1px dashed',
                      borderColor: 'text.secondary',
                      borderRadius: '50%',
                    }}
                  />
                  <span>Stale reading (dashed outline)</span>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Modo Table de Datos Accesible */}
          {viewMode === 'table' && (
            <TableContainer component={Paper} variant="outlined" tabIndex={0} role="region" aria-label="Historical readings table" sx={{ borderRadius: 1.5, maxWidth: '100%', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } }}>
              <Table size="small" aria-label={`Historical readings table for ${displayLabel}`}>
                <caption style={{ captionSide: 'top', textAlign: 'left', padding: '8px 16px', fontWeight: 600 }}>
                  Historical data for {displayLabel}
                  {displayUnit ? ` (${displayUnit})` : ''}
                  {' · '}
                  {sortedPoints.length} {sortedPoints.length === 1 ? 'reading' : 'readings'}
                </caption>
                <TableHead>
                  <TableRow>
                    <TableCell component="th" scope="col">Timestamp</TableCell>
                    <TableCell component="th" scope="col" align="right">Value</TableCell>
                    <TableCell component="th" scope="col">Quality</TableCell>
                    <TableCell component="th" scope="col">Series Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedPoints.map((pt, idx) => {
                    const hasGap = isGapAfter(idx)
                    const isFault = pt.quality === 'sensor_fault'

                    // Detectar si el punto anterior fue un fallo de sensor
                    // para señalizar inicio de segmento post-fallo
                    const previousPoint = idx > 0 ? sortedPoints[idx - 1] : undefined
                    const prevIsFault = previousPoint?.quality === 'sensor_fault'
                    const prevHasGap =
                      previousPoint !== undefined &&
                      pt.timestamp - previousPoint.timestamp > gapThreshold

                    // Determinar las etiquetas de estado de serie
                    const seriesStatusParts: Array<{ text: string; color: string }> = []

                    if (isFault) {
                      seriesStatusParts.push({
                        text: 'Reported sensor fault · excluded from the chart',
                        color: 'error.main',
                      })
                      if (hasGap) {
                        seriesStatusParts.push({
                          text: 'Estimated chart gap after this reading',
                          color: 'warning.main',
                        })
                      }
                    } else {
                      if (prevIsFault) {
                        seriesStatusParts.push({
                          text: 'Segment starts after a sensor fault',
                          color: 'info.main',
                        })
                      }
                      if (prevHasGap) {
                        seriesStatusParts.push({
                          text: 'Segment starts after an estimated chart gap',
                          color: 'warning.main',
                        })
                      }
                      if (hasGap) {
                        seriesStatusParts.push({
                          text: 'Estimated chart gap after this reading',
                          color: 'warning.main',
                        })
                      }
                      if (seriesStatusParts.length === 0) {
                        seriesStatusParts.push({
                          text: 'No chart gap',
                          color: 'text.secondary',
                        })
                      }
                    }

                    if (pt.isStale) {
                      seriesStatusParts.push({
                        text: 'Stale reading',
                        color: 'text.secondary',
                      })
                    }

                    return (
                      <TableRow key={`row-${pt.timestamp}-${idx}`}>
                        <TableCell sx={{ fontFamily: 'monospace' }}>
                          {getPointTimeLabel(pt)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          <Box
                            component="span"
                            sx={{
                              textDecoration: isFault ? 'line-through' : 'none',
                              color: isFault ? 'text.secondary' : 'text.primary',
                            }}
                          >
                            {formatValue(pt.value)}
                            {displayUnit ? ` ${displayUnit}` : ''}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={
                              pt.quality === 'ok'
                                ? 'default'
                                : pt.quality === 'degraded'
                                  ? 'warning'
                                  : pt.quality === 'sensor_fault'
                                    ? 'error'
                                    : 'default'
                            }
                            label={QUALITY_LABELS[pt.quality] ?? pt.quality}
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack spacing={0.25}>
                            {seriesStatusParts.map((part, partIdx) => (
                              <Typography
                                key={partIdx}
                                variant="caption"
                                sx={{
                                  color: part.color,
                                  fontWeight: part.color === 'text.secondary' ? 400 : 600,
                                }}
                              >
                                {part.text}
                              </Typography>
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Paper>
    </Stack>
  )
}

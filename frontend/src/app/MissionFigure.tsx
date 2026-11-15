import type { KeyboardEvent } from 'react'

import type { Variable } from '../services/api/contracts'

const regions: readonly { metric: Variable; label: string; x: number; y: number; mark: string }[] = [
  { metric: 'temperature', label: 'Temperatura corporal', x: 160, y: 83, mark: 'T' },
  { metric: 'heart_rate', label: 'Frecuencia cardíaca en el tórax', x: 147, y: 160, mark: '♥' },
  { metric: 'spo2', label: 'Saturación de oxígeno en el tórax', x: 180, y: 188, mark: 'O₂' },
  { metric: 'activity', label: 'Actividad y movimiento', x: 184, y: 308, mark: 'A' },
  { metric: 'radiation_cpm', label: 'Radiación ambiental, fuera de la figura', x: 257, y: 132, mark: 'R' },
]

export function MissionFigure({ metric, onSelect }: { metric: Variable; onSelect?: (metric: Variable) => void }) {
  function activate(event: KeyboardEvent<SVGGElement>, variable: Variable) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect?.(variable)
    }
  }

  return (
    <svg className="mission-figure" viewBox="0 0 320 420" aria-labelledby="mission-figure-title mission-figure-description">
      <title id="mission-figure-title">{onSelect ? 'Figura interactiva de un astronauta' : 'Ilustración de un astronauta'}</title>
      <desc id="mission-figure-description">{onSelect ? 'Elige una región para consultar su indicador. Los indicadores de la lista ofrecen la misma selección.' : 'Figura de cuerpo completo con traje espacial.'}</desc>
      <defs>
        <pattern id="mission-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#193345" strokeWidth="1" />
        </pattern>
        <linearGradient id="mission-suit" x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#264f61" /><stop offset="1" stopColor="#10212f" />
        </linearGradient>
        <linearGradient id="mission-visor" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#386777" /><stop offset="1" stopColor="#142b3b" />
        </linearGradient>
      </defs>
      <g aria-hidden="true">
        <rect x="17" y="16" width="286" height="382" rx="9" fill="url(#mission-grid)" opacity=".56" />
        <path d="M26 65V29h38M254 29h39v36M26 349v38h38M254 387h39v-38" fill="none" stroke="#3a6b79" />
        <path d="M160 22V396M34 210H286" stroke="#284450" strokeDasharray="3 5" />
        <ellipse cx="160" cy="190" rx="116" ry="132" stroke="#31505e" strokeDasharray="4 8" fill="none" />
        <ellipse cx="160" cy="389" rx="79" ry="8" fill="#122b35" />
        <g fill="url(#mission-suit)" stroke="#78b2be" strokeWidth="1.7" strokeLinejoin="round">
          <path d="M112 124l-15 8-10 27-13 63 4 23 15 4 12-15 10-53 8-23z" />
          <path d="M208 124l15 8 10 27 13 63-4 23-15 4-12-15-10-53-8-23z" />
          <path d="M118 216h84l-3 54-6 83 5 23-12 10h-24l-3-20 1-78-7-5-3 77-5 23h-29l-7-10 7-22 1-81z" />
          <path d="M132 113l-17 12-8 30 9 38 2 31 13 17h58l13-17 2-31 9-38-8-30-17-12z" />
          <path d="M123 103h74l-7 23h-60z" />
          <path d="M127 79l5-24 13-12 15-4 16 4 12 12 5 24-4 19-12 12h-34l-12-12z" />
          <path d="M135 74l8-11h35l8 11-3 18-7 7h-32l-7-7z" fill="url(#mission-visor)" />
          <path d="M118 213h84v13h-84z" fill="#172936" />
        </g>
        <g fill="none" stroke="#739ca7" opacity=".72">
          <path d="M142 68l11-2h17M137 118h46M120 134l10 11h59l11-11M127 149l-4 42 12 13h50l12-13-4-42M136 206h48M122 233h76" />
          <path d="M91 161l18 5m-24 24 16 7m-21 17 16 6m133-59-18 5m24 24-16 7m21 17-16 6M118 265l28 3m26 0 26-3M118 325l29 1m21 0 27-1M117 355h30m18 0h27M113 375h32m20 0h31" />
          <path d="M150 233v18h20v-18M119 306l9-14 15 2m29 0 15-2 9 14" />
        </g>
        <g fill="#8bf4de" opacity=".8">
          <circle cx="120" cy="135" r="2" /><circle cx="200" cy="135" r="2" />
          <circle cx="151" cy="218" r="2" /><circle cx="160" cy="218" r="2" /><circle cx="169" cy="218" r="2" />
          <path d="M257 107v-12h18v2h-16v10M184 329v13h27v-2h-25v-11M112 160H82v-2h30z" />
        </g>
      </g>
      {onSelect && regions.map(({ metric: variable, label, x, y, mark }) => (
        <g
          key={variable}
          role="button"
          tabIndex={0}
          aria-label={label}
          aria-pressed={metric === variable}
          className="mission-hotspot"
          transform={'translate(' + x + ' ' + y + ')'}
          onClick={() => onSelect?.(variable)}
          onKeyDown={(event) => activate(event, variable)}
        >
          <circle className="mission-target" r="19" />
          <circle className="mission-marker" r="12" />
          <text aria-hidden="true" y="4" textAnchor="middle">{mark}</text>
        </g>
      ))}
    </svg>
  )
}

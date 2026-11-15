import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useId, useState } from 'react'

import type { Reading } from '../services/api/adapters'
import type { Variable } from '../services/api/contracts'
import { metricNumber, metricQuality } from './MissionModules'
import { indicatorContext, medicalCards, observationDemo, observationSources } from './observationContent'
import { variables } from './telemetryPresentation'

export const observationDate = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' })
export const observationTime = (ms: number) => observationDate.format(ms) + ' UTC'

export function readingText(reading: Reading) {
  return [metricNumber.format(reading.value) + (reading.unit ? ' ' + reading.unit : ''), metricQuality[reading.quality], observationTime(reading.measuredAtMs)].join(' · ')
}

export function ObservationReadings({ readings }: { readings: readonly Reading[] }) {
  return (
    <div className="observation-readings">
      {readings.length ? <dl>{readings.map((reading) => <div key={reading.variable}>
        <dt>{variables[reading.variable]}</dt><dd>{readingText(reading)}</dd>
      </div>)}</dl> : <p>Sin mediciones disponibles</p>}
      <p className="module-note">Antigüedad sin clasificar. Las mediciones aportan contexto y no sustituyen la evaluación directa.</p>
    </div>
  )
}

export function ObservationReferences({ ids }: { ids?: readonly string[] }) {
  return (
    <ul className="observation-sources">
      {observationSources.filter(({ id }) => !ids || ids.includes(id)).map((source) => (
        <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.id} · {source.organization} · {source.title}</a>
          <small>{source.section} · {source.version}</small></li>
      ))}
    </ul>
  )
}

export function MedicalLibrary({ variable }: { variable?: Variable }) {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const context = variable ? indicatorContext[variable] : null
  const cardIds: readonly string[] | undefined = context?.cards
  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>{variable ? 'Ver información relacionada' : 'Consultar fichas y fuentes'}</Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" aria-labelledby={titleId}>
        <DialogTitle id={titleId}>{variable ? variables[variable] : 'Fichas documentales · A-01'}</DialogTitle>
        <DialogContent dividers className="observation-library">
          <p>Ficha investigativa {observationDemo.version} · pendiente de revisión médica</p>
          {context && <><p>{context.text}</p><ObservationReferences ids={context.sources} /></>}
          {medicalCards.filter(({ id }) => !cardIds || cardIds.includes(id)).map((card) => (
            <article key={card.id}>
              <h3>{card.id} · {card.title}</h3><strong>{card.scope}</strong>
              <p>{card.text}</p><p>{card.limit}</p><ObservationReferences ids={card.sources} />
            </article>
          ))}
          {!context && <details><summary>Las 11 referencias de la ficha</summary><ObservationReferences /></details>}
          <p>Referencias registradas en la ficha v0.1, consultadas por sus autores el 15/11/2026. Su inclusión no acredita validación médica.</p>
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>Cerrar</Button></DialogActions>
      </Dialog>
    </>
  )
}

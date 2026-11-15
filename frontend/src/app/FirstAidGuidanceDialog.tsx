import { useEffect, useRef } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'

import type { selectFirstAid } from './firstAidGuidance'
import { readingText } from './ObservationDocument'
import { variables } from './telemetryPresentation'

export function FirstAidGuidanceDialog({ open, onClose, onExited, guide, step, onStep }: {
  open: boolean; onClose: () => void; onExited: () => void
  guide: ReturnType<typeof selectFirstAid>; step: number; onStep: (n: number) => void
}) {
  const stepHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (open && step > 0) stepHeading.current?.focus() }, [open, step])
  const changeStep = (next: number) => {
    stepHeading.current?.focus()
    onStep(next)
  }
  const [label, title, text] = guide.steps[step]
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={false}
      aria-labelledby="first-aid-title"
      slotProps={{ paper: { className: 'first-aid-dialog' }, transition: { onExited } }}>
      <DialogTitle id="first-aid-title">Guía {guide.id} · {guide.title}</DialogTitle>
      <DialogContent className="first-aid-content">
        <div className="first-aid-context">
          <strong>{guide.astronaut.name || guide.astronaut.id} · {guide.astronaut.id}</strong>
          <p>{guide.evidence}</p>
          {guide.critical && <p>Flask reportó una alerta crítica. La selección se basa en observaciones.</p>}
          {guide.latest ? <p>Última muestra disponible · {variables[guide.latest.variable]} · {readingText(guide.latest)}</p> : <p>Sin mediciones disponibles.</p>}
          {guide.uncertain && <p>Hay datos indeterminados, ausentes o con calidad limitada.</p>}
          {guide.additional.length > 0 && <p>Hallazgos adicionales: {guide.additional.map((item) => item.title).join(' · ')}.</p>}
          <p>{guide.scenario} · {guide.version} · {guide.status}</p>
        </div>
        <section className="first-aid-step" aria-live="polite">
          <span className="first-aid-icon" aria-hidden="true">{label.includes('terrestre') ? '▤' : '✚'}</span>
          <div>
            <p>{label}</p><h3 ref={stepHeading} tabIndex={-1}>{title}</h3><p>{text}</p>
          </div>
        </section>
        <div className="first-aid-progress">
          <progress aria-label="Progreso de la guía" value={step + 1} max={guide.steps.length} />
          <span>Paso {step + 1} de {guide.steps.length}</span>
        </div>
        <details><summary>Fuentes documentales</summary>
          <ul>{guide.sources.map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.organization} · {source.title}</a></li>)}</ul>
        </details>
      </DialogContent>
      <div className="first-aid-actions">
        <Button autoFocus variant="outlined" onClick={onClose}>Cerrar guía</Button>
        <Button variant="outlined" disabled={step === 0} onClick={() => changeStep(step - 1)}>Paso anterior</Button>
        <Button variant="contained" disabled={step === guide.steps.length - 1} onClick={() => changeStep(step + 1)}>Paso siguiente</Button>
      </div>
    </Dialog>
  )
}

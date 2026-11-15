import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import type { Astronaut } from '../services/api/adapters'
import { FirstAidGuidanceDialog } from './FirstAidGuidanceDialog'
import { selectFirstAid } from './firstAidGuidance'
import { QueryFeedback } from './CrewPage'
import type { CrewApi } from './crewQuery'
import { answerQuestion, startAssistanceSession, type AssistanceSession } from './assistanceSession'
import { metricNumber, missionSeverity, MissionPanel, NodeStatus, useMissionStatus } from './MissionModules'
import { observationDemo, observationQuestions } from './observationContent'
import { MissionFigure } from './MissionFigure'
import { MedicalLibrary, ObservationReadings, observationTime, readingText } from './ObservationDocument'
import { interpretObservation, observationQuestionAt, observationStepFor, resultStep } from './observationInterpretation'
import { observationWarning } from './observationMode'
import { hrefFor } from './navigation'
import { variables } from './telemetryPresentation'

export function ObservationWorkspace({ api, astronaut, session, onChange, selector, alertId, replacing }: {
  api: CrewApi; astronaut: Astronaut; session: AssistanceSession | null
  onChange: (session: AssistanceSession | null) => void; selector: (onPicked: () => void) => ReactNode; alertId: number | null; replacing: boolean
}) {
  const query = useMissionStatus(api, astronaut.id)
  const detail = query.result.kind === 'ready' ? query.result.data : undefined
  const readings = detail?.readings ?? []
  const alerts = detail?.activeAlerts ?? []
  const contextId = alertId ?? session?.observationAlertId
  const alert = contextId ? alerts.find(({ id }) => id === contextId) : alerts[0]
  const interpretation = interpretObservation(session?.answers ?? new Map(), readings, alerts)
  const step = session?.step
  const question = step === undefined ? undefined : observationQuestionAt(step)
  const result = step === resultStep
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideStep, setGuideStep] = useState(0)
  const guideButton = useRef<HTMLButtonElement>(null)
  const guide = selectFirstAid(astronaut, session?.answers ?? new Map(), readings, alerts)
  const openGuide = () => { setGuideStep(0); setGuideOpen(true) }
  const [review, setReview] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [correcting, setCorrecting] = useState(false)
  const [copyStatus, setCopyStatus] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const shortReadings = ['heart_rate', 'spo2', 'temperature'].map((key) => ({ key, reading: readings.find(({ variable }) => variable === key) }))

  useEffect(() => { heading.current?.focus() }, [step])

  const go = (next: number) => { if (session) onChange({ ...session, step: next }) }
  const start = () => {
    setCopyStatus('')
    setCorrecting(false)
    onChange({ ...startAssistanceSession(astronaut.id, Date.now()), observationAlertId: contextId })
  }
  const answer = (id: string) => {
    if (!session || !question) return
    const index = observationQuestions.indexOf(question)
    onChange({ ...answerQuestion({ ...session, step: index }, observationQuestions, [id]), step: session.step })
  }
  const recorded = (id: string) => {
    const item = observationQuestions.find((entry) => entry.id === id)
    return item?.options.find((option) => session?.answers.get(id)?.includes(option.id))?.label ?? 'Sin registrar'
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText([
        'Registro demostrativo · evaluación médica no validada',
        (astronaut.name || astronaut.id) + ' · A-01 · ' + observationDemo.version,
        ...(session?.startedAtMs ? [observationTime(session.startedAtMs)] : []),
        interpretation.priority + ' · ' + interpretation.reason,
        ...observationQuestions.map((item) => item.id + ' · ' + recorded(item.id)),
        ...readings.map((item) => variables[item.variable] + ': ' + readingText(item)),
        observationWarning,
      ].join('\n'))
      setCopyStatus('Resumen copiado.')
    } catch { setCopyStatus('No se pudo copiar. El registro está disponible en esta pantalla.') }
  }

  return (
    <div className="module-workspace observation-rapid">
      <p className="module-notice">{observationWarning}</p>
      <div className="observation-rapid-grid">
        <MissionPanel title="Astronauta" icon="◉">
          <strong>{astronaut.name || astronaut.id}</strong> <small>· {astronaut.id}</small>
          <div><NodeStatus astronaut={detail ?? astronaut} /></div>
          {!session && <Button onClick={() => setSelecting(true)}>Cambiar astronauta</Button>}
          <h3 className="module-subtitle">Últimas muestras</h3>
          {query.result.kind !== 'ready' && <QueryFeedback result={query.result} subject="las mediciones" retry={query.retry} />}
          {shortReadings.map(({ key, reading }) => (
            <div key={key} className="rapid-reading">
              <strong>{key === 'heart_rate' ? 'Frecuencia cardíaca' : key === 'spo2' ? 'SpO₂' : 'Temperatura'}</strong>
              <span>{reading ? readingText(reading) : 'Sin medición disponible'}</span>
            </div>
          ))}
          <p className="module-note">Antigüedad sin clasificar. Las mediciones aportan contexto y no sustituyen la evaluación directa.</p>
        </MissionPanel>
        <MissionPanel title={result ? 'Evaluación observacional' : 'Evaluación rápida'} icon="⌖" className="rapid-center">
          <p className="module-note">A-01 · {observationDemo.version} · {result ? 'Interpretación preliminar del prototipo' : 'Demostración sintética'}</p>
          <h3 ref={heading} tabIndex={-1}>{result ? interpretation.priority : question ? question.prompt : 'Tripulante que no responde'}</h3>
          {!session && <>
            <div className="rapid-illustration"><MissionFigure metric="heart_rate" /></div>
            <p>Inicia A-01 solo tras una observación humana. Una alerta o una medición por sí sola no indica falta de respuesta.</p>
            {replacing && <p>Iniciar otra evaluación reemplazará las respuestas anteriores.</p>}
            <Button className="module-action primary" onClick={start}>{replacing ? 'Reemplazar sesión' : 'Iniciar evaluación A-01'}</Button>
          </>}
          {question && session && <>
            <p className="module-note">{question.id} · {session.step < resultStep ? 'Paso ' + (session.step + 1) + ' de ' + resultStep : 'Observación complementaria'}</p>
            {session.step < resultStep && <progress aria-label="Progreso de evaluación rápida" max={resultStep} value={session.step + 1} />}
            <fieldset className="rapid-options" aria-label={question.prompt}>
              {question.options.map((option) => <label key={option.id}>
                <input type="radio" name={question.id} checked={session.answers.get(question.id)?.includes(option.id) ?? false} onChange={() => answer(option.id)} />
                {option.label}
              </label>)}
            </fieldset>
            {question.id === 'Q02' && <p className="module-note">Si no puedes distinguir respiración normal de boqueos, registra la incertidumbre.</p>}
            <div className="observation-buttons">
              {session.step > 0 && <Button className="module-action" onClick={() => go(session.step > resultStep ? resultStep : session.step - 1)}>
                {session.step > resultStep ? 'Volver al resultado' : 'Anterior'}
              </Button>}
              <Button className="module-action primary" disabled={!session.answers.has(question.id)} onClick={() => {
              go(correcting || session.step >= resultStep - 1 ? resultStep : session.step + 1)
              if (!correcting && session.step === resultStep - 1) openGuide()
              setCorrecting(false)
            }}>
                {correcting || session.step >= resultStep - 1 ? 'Ver resultado' : 'Siguiente'}
              </Button>
            </div>
          </>}
          {result && session && <>
            <p>{interpretation.reason}</p>
            {session.startedAtMs !== undefined && <p className="module-note">Inicio · {observationTime(session.startedAtMs)}</p>}
            {interpretation.situations.length > 0 && <div className="rapid-situations" aria-label="Situaciones para revisión">
              {interpretation.situations.map((item) => <article key={item.title}><strong>{item.title}</strong><p>{item.evidence}</p><small>{item.related}</small></article>)}
            </div>}
            <div className="observation-buttons">
              <Button className="module-action" ref={guideButton} onClick={openGuide}>Abrir guía</Button>
              <Button className="module-action" onClick={() => setReview(true)}>Revisar y corregir</Button>
              <Button className="module-action primary" onClick={() => onChange(null)}>Finalizar sesión</Button>
            </div>
          </>}
        </MissionPanel>
        <MissionPanel title="Estado y apoyo" icon="◇">
          <div className={'rapid-priority' + (interpretation.flagged ? ' flagged' : '')} aria-live="polite">
            <strong>{interpretation.priority}</strong><p>{interpretation.action}</p>
          </div>
          {alert ? <div className="rapid-reading">
            <strong>Aviso #{alert.id} · {missionSeverity[alert.severity]}</strong>
            <span>{variables[alert.variable]} · {metricNumber.format(alert.value)} · {observationTime(alert.measuredAtMs)}</span>
            <small>Valor del aviso, distinto de la última muestra. Procedencia no informada.</small>
          </div> : contextId ? <p className="module-note">El aviso de origen no está disponible en la colección activa.</p> : null}
          <p className="module-note">{interpretation.pending} por responder · {interpretation.unknown} no determinadas</p>
          <p className="module-note">{readings.length ? 'Calidad: ' + interpretation.failed + ' fallidas, ' + interpretation.degraded + ' degradadas.' : 'Sin mediciones disponibles.'}</p>
          {session && (session.answers.has('Q08a') || session.answers.has('Q08b')) && <p className="module-note">Apoyo reportado · CMO: {recorded('Q08a')} · Tierra: {recorded('Q08b')}.</p>}
          {interpretation.different && <p className="module-notice">Respiración normal reportada y aviso de SpO₂. Son señales distintas y requieren contraste.</p>}
          <div className="observation-buttons">
            <MedicalLibrary />
            {session && <Button className="module-action" onClick={() => onChange(null)}>Cancelar sesión</Button>}
          </div>
        </MissionPanel>
      </div>
      <a href={hrefFor('/')}>Volver al centro de control</a>
      {result && <FirstAidGuidanceDialog open={guideOpen} guide={guide} step={guideStep} onStep={setGuideStep}
        onClose={() => setGuideOpen(false)} onExited={() => guideButton.current?.focus()} />}
      <Dialog open={selecting} onClose={() => setSelecting(false)} fullWidth maxWidth="xs" aria-labelledby="rapid-select-title">
        <DialogTitle id="rapid-select-title">Seleccionar astronauta</DialogTitle>
        <DialogContent>{selector(() => setSelecting(false))}</DialogContent>
        <DialogActions><Button onClick={() => setSelecting(false)}>Cerrar</Button></DialogActions>
      </Dialog>
      <Dialog open={review && result} onClose={() => setReview(false)} fullWidth maxWidth="sm" aria-labelledby="rapid-review-title">
        <DialogTitle id="rapid-review-title">Observaciones registradas</DialogTitle>
        <DialogContent dividers>
          <p>Las preguntas complementarias se pueden registrar cuando aporten información y sin retrasar el contacto con el canal médico.</p>
          <ul className="rapid-review">
            {observationQuestions.map((item) => <li key={item.id}>
              <strong>{item.id} · {item.prompt}</strong><span>{recorded(item.id)}</span>
              <Button onClick={() => { setReview(false); setCorrecting(true); go(observationStepFor(item.id)) }} aria-label={'Editar ' + item.id}>Editar</Button>
            </li>)}
          </ul>
          <ObservationReadings readings={readings} />
          {navigator.clipboard && <Button onClick={() => { void copySummary() }}>Copiar resumen demostrativo</Button>}
          {copyStatus && <p role="status">{copyStatus}</p>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setReview(false); start() }}>Reiniciar</Button>
          <Button onClick={() => setReview(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

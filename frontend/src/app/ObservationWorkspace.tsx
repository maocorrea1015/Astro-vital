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
import { astronautLabel, variables } from './telemetryPresentation'

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
    return item?.options.find((option) => session?.answers.get(id)?.includes(option.id))?.label ?? 'Not recorded'
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText([
        'Demo Record · Medical Assessment Not Validated',
        (astronautLabel(astronaut)) + ' · A-01 · ' + observationDemo.version,
        ...(session?.startedAtMs ? [observationTime(session.startedAtMs)] : []),
        interpretation.priority + ' · ' + interpretation.reason,
        ...observationQuestions.map((item) => item.id + ' · ' + recorded(item.id)),
        ...readings.map((item) => variables[item.variable] + ': ' + readingText(item)),
        observationWarning,
      ].join('\n'))
      setCopyStatus('Summary copied.')
    } catch { setCopyStatus('Could not copy. The record is available on this screen.') }
  }

  return (
    <div className="module-workspace observation-rapid">
      <p className="module-notice">{observationWarning}</p>
      <div className="observation-rapid-grid">
        <MissionPanel title="Astronaut" icon="◉">
          <strong>{astronautLabel(astronaut)}</strong> <small>· {astronaut.id}</small>
          <div><NodeStatus astronaut={detail ?? astronaut} /></div>
          {!session && <Button onClick={() => setSelecting(true)}>Change Astronaut</Button>}
          <h3 className="module-subtitle">Latest Readings</h3>
          {query.result.kind !== 'ready' && <QueryFeedback result={query.result} subject="readings" retry={query.retry} />}
          {shortReadings.map(({ key, reading }) => (
            <div key={key} className="rapid-reading">
              <strong>{key === 'heart_rate' ? 'Heart Rate' : key === 'spo2' ? 'SpO₂' : 'Body Temperature'}</strong>
              <span>{reading ? readingText(reading) : 'No reading available'}</span>
            </div>
          ))}
          <p className="module-note">Reading age unclassified. Readings provide context and do not replace direct assessment.</p>
        </MissionPanel>
        <MissionPanel title={result ? 'Observational Assessment' : 'Rapid Assessment'} icon="⌖" className="rapid-center">
          <p className="module-note">A-01 · {observationDemo.version} · {result ? 'Preliminary Prototype Interpretation' : 'Synthetic Data Demonstration'}</p>
          <h3 ref={heading} tabIndex={-1}>{result ? interpretation.priority : question ? question.prompt : 'Unresponsive Crew Member'}</h3>
          {!session && <>
            <div className="rapid-illustration"><MissionFigure metric="heart_rate" /></div>
            <p>Start A-01 only after direct human observation. An alert or reading alone does not indicate unresponsiveness.</p>
            {replacing && <p>Starting another assessment will replace your previous answers.</p>}
            <Button className="module-action primary" onClick={start}>{replacing ? 'Replace Session' : 'Start A-01 Assessment'}</Button>
          </>}
          {question && session && <>
            <p className="module-note">{question.id} · {session.step < resultStep ? 'Step ' + (session.step + 1) + ' of ' + resultStep : 'Supplementary Observation'}</p>
            {session.step < resultStep && <progress aria-label="Rapid assessment progress" max={resultStep} value={session.step + 1} />}
            <fieldset className="rapid-options" aria-label={question.prompt}>
              {question.options.map((option) => <label key={option.id}>
                <input type="radio" name={question.id} checked={session.answers.get(question.id)?.includes(option.id) ?? false} onChange={() => answer(option.id)} />
                {option.label}
              </label>)}
            </fieldset>
            {question.id === 'Q02' && <p className="module-note">If you cannot distinguish normal breathing from gasping, record the uncertainty.</p>}
            <div className="observation-buttons">
              {session.step > 0 && <Button className="module-action" onClick={() => go(session.step > resultStep ? resultStep : session.step - 1)}>
                {session.step > resultStep ? 'Back to Result' : 'Previous'}
              </Button>}
              <Button className="module-action primary" disabled={!session.answers.has(question.id)} onClick={() => {
              go(correcting || session.step >= resultStep - 1 ? resultStep : session.step + 1)
              if (!correcting && session.step === resultStep - 1) openGuide()
              setCorrecting(false)
            }}>
                {correcting || session.step >= resultStep - 1 ? 'View Result' : 'Next'}
              </Button>
            </div>
          </>}
          {result && session && <>
            <p>{interpretation.reason}</p>
            {session.startedAtMs !== undefined && <p className="module-note">Started · {observationTime(session.startedAtMs)}</p>}
            {interpretation.situations.length > 0 && <div className="rapid-situations" aria-label="Findings for review">
              {interpretation.situations.map((item) => <article key={item.title}><strong>{item.title}</strong><p>{item.evidence}</p><small>{item.related}</small></article>)}
            </div>}
            <div className="observation-buttons">
              <Button className="module-action" ref={guideButton} onClick={openGuide}>Open Guidance</Button>
              <Button className="module-action" onClick={() => setReview(true)}>Review and Correct</Button>
              <Button className="module-action primary" onClick={() => onChange(null)}>End Session</Button>
            </div>
          </>}
        </MissionPanel>
        <MissionPanel title="Status and Support" icon="◇">
          <div className={'rapid-priority' + (interpretation.flagged ? ' flagged' : '')} aria-live="polite">
            <strong>{interpretation.priority}</strong><p>{interpretation.action}</p>
          </div>
          {alert ? <div className="rapid-reading">
            <strong>Alert #{alert.id} · {missionSeverity[alert.severity]}</strong>
            <span>{variables[alert.variable]} · {metricNumber.format(alert.value)} · {observationTime(alert.measuredAtMs)}</span>
            <small>The alert value may differ from the latest reading. Source unreported.</small>
          </div> : contextId ? <p className="module-note">The originating alert is unavailable in the active alert list.</p> : null}
          <p className="module-note">{interpretation.pending} unanswered · {interpretation.unknown} undetermined</p>
          <p className="module-note">{readings.length ? 'Quality: ' + interpretation.failed + ' failed, ' + interpretation.degraded + ' degraded.' : 'No readings available.'}</p>
          {session && (session.answers.has('Q08a') || session.answers.has('Q08b')) && <p className="module-note">Reported support · CMO: {recorded('Q08a')} · Ground: {recorded('Q08b')}.</p>}
          {interpretation.different && <p className="module-notice">Normal breathing was reported alongside an SpO₂ alert. Review these signals separately and compare them.</p>}
          <div className="observation-buttons">
            <MedicalLibrary />
            {session && <Button className="module-action" onClick={() => onChange(null)}>Cancel Session</Button>}
          </div>
        </MissionPanel>
      </div>
      <a href={hrefFor('/')}>Back to Mission Control</a>
      {result && <FirstAidGuidanceDialog open={guideOpen} guide={guide} step={guideStep} onStep={setGuideStep}
        onClose={() => setGuideOpen(false)} onExited={() => guideButton.current?.focus()} />}
      <Dialog open={selecting} onClose={() => setSelecting(false)} fullWidth maxWidth="xs" aria-labelledby="rapid-select-title">
        <DialogTitle id="rapid-select-title">Select Astronaut</DialogTitle>
        <DialogContent>{selector(() => setSelecting(false))}</DialogContent>
        <DialogActions><Button onClick={() => setSelecting(false)}>Close</Button></DialogActions>
      </Dialog>
      <Dialog open={review && result} onClose={() => setReview(false)} fullWidth maxWidth="sm" aria-labelledby="rapid-review-title">
        <DialogTitle id="rapid-review-title">Recorded Observations</DialogTitle>
        <DialogContent dividers>
          <p>Record supplementary observations when useful, without delaying contact with the medical channel.</p>
          <ul className="rapid-review">
            {observationQuestions.map((item) => <li key={item.id}>
              <strong>{item.id} · {item.prompt}</strong><span>{recorded(item.id)}</span>
              <Button onClick={() => { setReview(false); setCorrecting(true); go(observationStepFor(item.id)) }} aria-label={'Edit ' + item.id}>Edit</Button>
            </li>)}
          </ul>
          <ObservationReadings readings={readings} />
          {navigator.clipboard && <Button onClick={() => { void copySummary() }}>Copy Demo Summary</Button>}
          {copyStatus && <p role="status">{copyStatus}</p>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setReview(false); start() }}>Restart</Button>
          <Button onClick={() => setReview(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

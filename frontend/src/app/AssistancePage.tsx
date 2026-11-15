import { astronautLabel } from './telemetryPresentation'
import Button from '@mui/material/Button'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'

import { AssistanceQuestionnaire } from './AssistanceQuestionnaire'
import { QueryFeedback } from './CrewPage'
import { approvedAssistanceQuestions } from './assistanceContent'
import { startAssistanceSession, type AssistanceSession } from './assistanceSession'
import { AstronautSelector, MissionEmpty, MissionIdentity, MissionPanel, useMissionCrew, type MissionSelection } from './MissionModules'
import { MissionFigure } from './MissionFigure'
import { detailPathFor, hrefFor, readAssistanceAlertId } from './navigation'
import { observationDemoEnabled } from './observationEnvironment'

const ObservationWorkspace = import.meta.env.DEV || import.meta.env.MODE === 'educational-demo'
  ? lazy(() => import('./ObservationWorkspace').then((module) => ({ default: module.ObservationWorkspace })))
  : null

export function AssistancePage({ api, initialId, selectedId, onSelect, sessions, onSessionChange }: MissionSelection & {
  initialId: string | null; sessions: ReadonlyMap<string, AssistanceSession>; onSessionChange: (session: AssistanceSession | null, id: string) => void
}) {
  const catalog = useMissionCrew(api, initialId ?? selectedId)
  const selected = catalog.selected
  const session = selected ? sessions.get(selected.id) ?? null : null
  const changeSession = (next: AssistanceSession | null) => { if (selected) onSessionChange(next, selected.id) }
  const confirmed = !!selected && session?.astronautId === selected.id
  const hasQuestions = approvedAssistanceQuestions.length > 0
  const [promptTarget, setPromptTarget] = useState<HTMLDivElement | null>(null)
  const [actionTarget, setActionTarget] = useState<HTMLDivElement | null>(null)
  const confirmation = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (confirmed && !hasQuestions && !observationDemoEnabled) confirmation.current?.focus()
  }, [confirmed, hasQuestions])

  if (observationDemoEnabled && ObservationWorkspace && selected) return (
    <Suspense fallback={<p role="status">Loading scenario A-01…</p>}>
      <ObservationWorkspace key={selected.id} api={api} astronaut={selected} session={confirmed ? session : null}
        onChange={changeSession} replacing={!!session?.answers.size && !confirmed} alertId={readAssistanceAlertId(location.hash.slice(1))}
        selector={(close) => <AstronautSelector crew={catalog.crew} selectedId={selected.id} onSelect={(id) => { close(); onSelect(id) }} />} />
    </Suspense>
  )

  return (
    <div className="module-workspace">
      <div className="module-toolbar">
        <p>Select an astronaut to prepare a medical assistance session.</p>
        {!hasQuestions && <p className="module-notice">The assistance questionnaire is pending medical review</p>}
      </div>
      <div className="module-columns assist-layout">
        <MissionPanel title="Select an Astronaut" icon="◎">
          {catalog.result.kind !== 'ready' ? <QueryFeedback result={catalog.result} subject="crew data" retry={catalog.retry} />
            : catalog.crew.length ? <AstronautSelector crew={catalog.crew} selectedId={selected?.id} disabled={confirmed} onSelect={onSelect} />
            : <MissionEmpty title="No astronauts are available for medical assistance." />}
          {selected && <MissionIdentity astronaut={selected} />}
          {initialId && !selected && catalog.result.kind === 'ready' && <p role="status">The selected astronaut is not on the roster.</p>}
        </MissionPanel>
        <MissionPanel title="Guided Assistance" icon="⌖" className="module-map assist-map">
          {hasQuestions && <div ref={setPromptTarget} className="module-question-prompt" />}
          <MissionFigure metric="heart_rate" />
        </MissionPanel>
        <MissionPanel title={hasQuestions ? 'Questionnaire' : 'Assistance Availability'} icon="◇">
          <h3 ref={confirmation} id="assistance-status" className="module-subtitle" tabIndex={-1}>
            {confirmed ? 'Astronaut confirmed: ' + (astronautLabel(selected)) : 'Session setup'}
          </h3>
          {hasQuestions && confirmed && session && promptTarget && actionTarget
            ? <AssistanceQuestionnaire session={session} questions={approvedAssistanceQuestions} onChange={changeSession} promptTarget={promptTarget} actionTarget={actionTarget} />
            : <MissionEmpty title={hasQuestions ? 'Start a session to view the questions' : 'Content pending approval'}>
                {hasQuestions ? 'Confirm the astronaut in the action bar.' : 'You can confirm the astronaut and return to their details. Questions will be available after medical approval.'}
              </MissionEmpty>}
        </MissionPanel>
      </div>
      <div className="module-actions">
        <strong>Medical Assistance Session</strong>
        {!!session?.answers.size && !confirmed && <small>Replacing the session will discard previous answers.</small>}
        {selected && <a className="module-action" href={hrefFor(detailPathFor(selected.id))}>Back to Details</a>}
        <a className="module-action" href={hrefFor('/tripulacion')}>Back to Crew</a>
        {hasQuestions && <div ref={setActionTarget} className="module-question-actions" />}
        {confirmed ? <Button className="module-action" onClick={() => { changeSession(null); confirmation.current?.focus() }}>Cancel Session</Button>
          : <Button className="module-action primary" disabled={!selected} onClick={() => { if (selected) changeSession(startAssistanceSession(selected.id)) }}>
            {session?.answers.size ? 'Replace Session' : hasQuestions ? 'Start Session' : 'Confirm Astronaut'}
          </Button>}
      </div>
    </div>
  )
}

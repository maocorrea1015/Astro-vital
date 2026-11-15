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

const ObservationWorkspace = import.meta.env.DEV
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
    <Suspense fallback={<p role="status">Cargando escenario A-01…</p>}>
      <ObservationWorkspace key={selected.id} api={api} astronaut={selected} session={confirmed ? session : null}
        onChange={changeSession} replacing={!!session?.answers.size && !confirmed} alertId={readAssistanceAlertId(location.hash.slice(1))}
        selector={(close) => <AstronautSelector crew={catalog.crew} selectedId={selected.id} onSelect={(id) => { close(); onSelect(id) }} />} />
    </Suspense>
  )

  return (
    <div className="module-workspace">
      <div className="module-toolbar">
        <p>Selecciona el astronauta para preparar una sesión de asistencia.</p>
        {!hasQuestions && <p className="module-notice">El cuestionario de asistencia está pendiente de validación médica</p>}
      </div>
      <div className="module-columns assist-layout">
        <MissionPanel title="Selecciona al astronauta" icon="◎">
          {catalog.result.kind !== 'ready' ? <QueryFeedback result={catalog.result} subject="la tripulación" retry={catalog.retry} />
            : catalog.crew.length ? <AstronautSelector crew={catalog.crew} selectedId={selected?.id} disabled={confirmed} onSelect={onSelect} />
            : <MissionEmpty title="No hay astronautas disponibles para asistencia." />}
          {selected && <MissionIdentity astronaut={selected} />}
          {initialId && !selected && catalog.result.kind === 'ready' && <p role="status">El astronauta seleccionado no está en el catálogo.</p>}
        </MissionPanel>
        <MissionPanel title="Asistencia guiada" icon="⌖" className="module-map assist-map">
          {hasQuestions && <div ref={setPromptTarget} className="module-question-prompt" />}
          <MissionFigure metric="heart_rate" />
        </MissionPanel>
        <MissionPanel title={hasQuestions ? 'Cuestionario' : 'Disponibilidad de asistencia'} icon="◇">
          <h3 ref={confirmation} id="assistance-status" className="module-subtitle" tabIndex={-1}>
            {confirmed ? 'Astronauta confirmado: ' + (selected.name || selected.id) : 'Preparación de la sesión'}
          </h3>
          {hasQuestions && confirmed && session && promptTarget && actionTarget
            ? <AssistanceQuestionnaire session={session} questions={approvedAssistanceQuestions} onChange={changeSession} promptTarget={promptTarget} actionTarget={actionTarget} />
            : <MissionEmpty title={hasQuestions ? 'Inicia la sesión para ver las preguntas' : 'Contenido pendiente de aprobación'}>
                {hasQuestions ? 'Confirma el astronauta en la barra de acciones.' : 'Puedes confirmar al astronauta y regresar a su detalle. Las preguntas estarán disponibles tras la aprobación médica.'}
              </MissionEmpty>}
        </MissionPanel>
      </div>
      <div className="module-actions">
        <strong>Sesión de asistencia</strong>
        {!!session?.answers.size && !confirmed && <small>Reemplazar la sesión descartará las respuestas anteriores.</small>}
        {selected && <a className="module-action" href={hrefFor(detailPathFor(selected.id))}>Volver al detalle</a>}
        <a className="module-action" href={hrefFor('/tripulacion')}>Volver a tripulación</a>
        {hasQuestions && <div ref={setActionTarget} className="module-question-actions" />}
        {confirmed ? <Button className="module-action" onClick={() => { changeSession(null); confirmation.current?.focus() }}>Cancelar sesión</Button>
          : <Button className="module-action primary" disabled={!selected} onClick={() => { if (selected) changeSession(startAssistanceSession(selected.id)) }}>
            {session?.answers.size ? 'Reemplazar sesión' : hasQuestions ? 'Iniciar sesión' : 'Confirmar astronauta'}
          </Button>}
      </div>
    </div>
  )
}

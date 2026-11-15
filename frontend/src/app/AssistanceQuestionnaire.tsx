import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useRef } from 'react'

import { answerQuestion, moveQuestion, questionProgress, type AssistanceQuestion, type AssistanceSession } from './assistanceSession'

interface AssistanceQuestionnaireProps {
  session: AssistanceSession
  questions: readonly AssistanceQuestion[]
  onChange: (session: AssistanceSession) => void
}

export function AssistanceQuestionnaire({ session, questions, onChange }: AssistanceQuestionnaireProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  const question = questions[session.step]
  const progress = questionProgress(session, questions)

  useEffect(() => {
    heading.current?.focus()
  }, [session.step])

  const move = (direction: -1 | 1) => onChange(moveQuestion(session, questions, direction))
  const focusOutline = { '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } } as const

  if (!question || !progress) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
        <Typography component="h3" variant="h6" ref={heading} tabIndex={-1} sx={focusOutline}>
          Cuestionario completado
        </Typography>
        <Typography>Las respuestas permanecen en esta sesión.</Typography>
        <Button onClick={() => move(-1)}>Volver a las preguntas</Button>
      </Stack>
    )
  }

  const answer = session.answers.get(question.id) ?? []
  const changeAnswer = (optionIds: readonly string[]) => onChange(answerQuestion(session, questions, optionIds))
  const optionStyle = { ml: 0, mr: 0, minHeight: 44, '& .MuiFormControlLabel-label': { minWidth: 0, overflowWrap: 'anywhere' } }

  return (
    <Stack spacing={2}>
      <Typography color="text.secondary">Paso {progress.current} de {progress.total}</Typography>
      <Typography id="assistance-question" component="h3" variant="h6" ref={heading} tabIndex={-1} sx={focusOutline}>
        {question.prompt}
      </Typography>
      <Typography color="text.secondary" id="assistance-selection-help">
        {question.kind === 'single' ? 'Selecciona una opción.' : 'Selecciona una o más opciones.'}
      </Typography>
      {question.kind === 'single' ? (
        <RadioGroup
          aria-labelledby="assistance-question"
          aria-describedby="assistance-selection-help"
          name="assistance-answer"
          value={answer[0] ?? ''}
          onChange={(_event, value) => changeAnswer([value])}
        >
          {question.options.map(({ id, label }) => (
            <FormControlLabel key={id} value={id} control={<Radio />} label={label} sx={optionStyle} />
          ))}
        </RadioGroup>
      ) : (
        <Box role="group" aria-labelledby="assistance-question" aria-describedby="assistance-selection-help">
          <Stack>
            {question.options.map(({ id, label }) => (
              <FormControlLabel
                key={id}
                label={label}
                sx={optionStyle}
                control={
                  <Checkbox
                    checked={answer.includes(id)}
                    onChange={(_event, checked) => changeAnswer(checked ? [...answer, id] : answer.filter((value) => value !== id))}
                  />
                }
              />
            ))}
          </Stack>
        </Box>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        {session.step > 0 && <Button onClick={() => move(-1)}>Anterior</Button>}
        <Button variant="contained" disabled={answer.length === 0} onClick={() => move(1)}>
          {progress.current === progress.total ? 'Finalizar cuestionario' : 'Siguiente'}
        </Button>
      </Stack>
    </Stack>
  )
}

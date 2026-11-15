import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

import { answerQuestion, moveQuestion, questionProgress, type AssistanceQuestion, type AssistanceSession } from './assistanceSession'

interface AssistanceQuestionnaireProps {
  session: AssistanceSession
  questions: readonly AssistanceQuestion[]
  onChange: (session: AssistanceSession) => void
  promptTarget: HTMLElement
  actionTarget: HTMLElement
}

export function AssistanceQuestionnaire({ session, questions, onChange, promptTarget, actionTarget }: AssistanceQuestionnaireProps) {
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
        {createPortal(<Typography component="h3" variant="h6" ref={heading} tabIndex={-1} sx={focusOutline}>Questionnaire Complete</Typography>, promptTarget)}
        <Typography>Your answers remain in this session.</Typography>
        {createPortal(<Button className="module-action" onClick={() => move(-1)}>Back to Questions</Button>, actionTarget)}
      </Stack>
    )
  }

  const answer = session.answers.get(question.id) ?? []
  const changeAnswer = (optionIds: readonly string[]) => onChange(answerQuestion(session, questions, optionIds))
  const optionStyle = { m: 0, p: 1, minHeight: 58, borderRadius: 2, border: '1px solid #2b4c5c', bgcolor: '#172c3b', '&:has(input:checked)': { borderColor: '#8bf4df', bgcolor: '#1b4148' }, '& .MuiFormControlLabel-label': { minWidth: 0, overflowWrap: 'anywhere' } }

  return (
    <Stack spacing={2}>
      {createPortal(
        <>
          <Typography color="text.secondary" >Step {progress.current} of {progress.total}</Typography>
          <progress aria-label="Questionnaire progress" value={progress.current} max={progress.total} />
          <Typography id="assistance-question" component="h3" variant="h6" ref={heading} tabIndex={-1} sx={focusOutline}>
            {question.prompt}
          </Typography>
        </>, promptTarget,
      )}
      <Typography color="text.secondary" id="assistance-selection-help">
        {question.kind === 'single' ? 'Select one option.' : 'Select one or more options.'}
      </Typography>
      {question.kind === 'single' ? (
        <RadioGroup
          aria-labelledby="assistance-question"
          aria-describedby="assistance-selection-help"
          sx={{ gap: 1 }}
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
          <Stack spacing={1}>
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
      {createPortal(<Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        {session.step > 0 && <Button className="module-action" onClick={() => move(-1)}>Previous</Button>}
        <Button className="module-action primary" disabled={answer.length === 0} onClick={() => move(1)}>
          {progress.current === progress.total ? 'Finish Questionnaire' : 'Next'}
        </Button>
      </Stack>, actionTarget)}
    </Stack>
  )
}

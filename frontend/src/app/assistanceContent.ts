import type { AssistanceQuestion } from './assistanceSession.ts'

export interface AssistanceSource {
  id: string
  organization: string
  title: string
  url: string
  version: string
  accessedOn: string
  section: string
}

export type AssistanceCatalog =
  | { status: 'pending' }
  | {
      status: 'approved'
      version: string
      review: { reviewer: string; reviewedOn: string; reference: string; audience: string; scope: string }
      sources: readonly AssistanceSource[]
      questions: readonly (AssistanceQuestion & { sourceIds: readonly string[] })[]
    }

// Only a reviewed, authorized release belongs here. Keep research outside the app.
const assistanceCatalog: AssistanceCatalog = { status: 'pending' }

export function getApprovedAssistanceQuestions(catalog: AssistanceCatalog): readonly AssistanceQuestion[] {
  if (catalog.status !== 'approved' || !catalog.version.trim()) return []
  const { review, sources, questions } = catalog
  if (Object.values(review).some((value) => !value.trim()) || sources.length === 0) return []

  const sourceIds = new Set(sources.map(({ id }) => id))
  if (sourceIds.size !== sources.length || sources.some((source) => Object.values(source).some((value) => !value.trim()))) return []
  const questionIds = new Set(questions.map(({ id }) => id))
  if (questionIds.size !== questions.length || questions.some((question) =>
    !question.id.trim() || !question.prompt.trim() || question.sourceIds.length === 0
    || question.sourceIds.some((id) => !sourceIds.has(id))
    || question.options.length === 0
    || new Set(question.options.map((option) => option.id)).size !== question.options.length
    || question.options.some((option) => !option.id.trim() || !option.label.trim())
  )) return []

  return questions
}

export const approvedAssistanceQuestions = getApprovedAssistanceQuestions(assistanceCatalog)

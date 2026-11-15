import { useEffect, useState } from 'react'

import type { createAstronautApi } from '../services/api/astronauts'
import { ApiError } from '../services/api/client'

export type CrewApi = Pick<ReturnType<typeof createAstronautApi>, 'listAstronauts' | 'getAstronautStatus'>

export type CrewQuery<T> =
  | { kind: 'loading' }
  | { kind: 'unconfigured' }
  | { kind: 'ready'; data: T }
  | { kind: 'error'; notFound: boolean }

export function useCrewQuery<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [result, setResult] = useState<CrewQuery<T>>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ kind: 'ready', data })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        if (error instanceof ApiError && error.kind === 'access-unconfigured') {
          setResult({ kind: 'unconfigured' })
        } else {
          setResult({ kind: 'error', notFound: error instanceof ApiError && error.kind === 'not-found' })
        }
      },
    )
    return () => controller.abort()
  }, [load, attempt])

  function retry() {
    setResult({ kind: 'loading' })
    setAttempt((previous) => previous + 1)
  }

  return { result, retry }
}

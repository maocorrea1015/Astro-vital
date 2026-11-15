import { allowsObservationDemo } from './observationMode'

export let observationDemoEnabled = import.meta.env.DEV && allowsObservationDemo(true, import.meta.env.VITE_ASSISTANCE_DEMO, window.location.hostname)

export async function authorizeDeployedDemo() {
  if (import.meta.env.MODE !== 'educational-demo' || import.meta.env.DEV) return true
  try {
    const response = await fetch('/demo/session', {
      credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000),
    })
    const payload: unknown = response.ok ? await response.json() : null
    observationDemoEnabled = typeof payload === 'object' && payload !== null
      && 'educationalDemo' in payload && payload.educationalDemo === true
  } catch {
    observationDemoEnabled = false
  }
  return observationDemoEnabled
}

export const observationWarning = 'Observational assessment prototype. Educational content pending medical review and not approved for operational use.'

export function allowsObservationDemo(development: boolean, enabled: string | undefined, hostname: string) {
  return development && enabled === 'true' && ['127.0.0.1', 'localhost', '[::1]'].includes(hostname)
}

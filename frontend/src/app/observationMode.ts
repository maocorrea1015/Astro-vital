export const observationWarning = 'Prototipo de evaluación observacional. Contenido documental pendiente de validación médica para uso operativo'

export function allowsObservationDemo(development: boolean, enabled: string | undefined, hostname: string) {
  return development && enabled === 'true' && ['127.0.0.1', 'localhost', '[::1]'].includes(hostname)
}

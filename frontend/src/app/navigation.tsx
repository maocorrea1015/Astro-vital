import { useSyncExternalStore } from 'react'

export const sections = [
  { path: '/', label: 'Inicio' },
  { path: '/tripulacion', label: 'Tripulación' },
  { path: '/monitoreo', label: 'Monitoreo' },
  { path: '/alertas', label: 'Alertas' },
] as const

export const astronautDetailPath = '/tripulacion/detalle'

export function hrefFor(path: string) {
  return `#${path}`
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getRoute() {
  return window.location.hash.slice(1) || '/'
}

export function useRoute() {
  return useSyncExternalStore(subscribe, getRoute)
}

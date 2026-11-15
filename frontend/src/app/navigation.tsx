import { useSyncExternalStore } from 'react'

import { isAstronautId } from '../services/api/validators'

export const sections = [
  { path: '/', label: 'Inicio' },
  { path: '/tripulacion', label: 'Tripulación' },
  { path: '/monitoreo', label: 'Monitoreo' },
  { path: '/alertas', label: 'Alertas' },
] as const

export const astronautDetailPath = '/tripulacion/detalle'

const detailPrefix = `${astronautDetailPath}/`

export function detailPathFor(id: string) {
  return `${detailPrefix}${encodeURIComponent(id)}`
}

export function readDetailId(route: string): string | null {
  if (!route.startsWith(detailPrefix)) return null
  const id = route.slice(detailPrefix.length)
  return isAstronautId(id) ? id : null
}

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

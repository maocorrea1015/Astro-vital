import { useSyncExternalStore } from 'react'

import { isAstronautId } from '../services/api/validators'

export const pageHeadingId = 'page-heading'

export const alertsPath = '/alertas'

export function alertsPathFor(id: string) {
  return alertsPath + '/' + encodeURIComponent(id)
}

export function readAlertsId(route: string): string | null {
  const prefix = alertsPath + '/'
  const id = route.startsWith(prefix) ? route.slice(prefix.length) : ''
  return isAstronautId(id) ? id : null
}

export const assistancePath = '/asistencia'

export const monitoringPath = '/monitoreo'

export const sections = [
  { path: '/', label: 'Inicio' },
  { path: '/tripulacion', label: 'Tripulación' },
  { path: monitoringPath, label: 'Monitoreo' },
  { path: alertsPath, label: 'Alertas' },
  { path: assistancePath, label: 'Asistencia' },
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

export function monitoringPathFor(id: string) {
  return `${monitoringPath}/${encodeURIComponent(id)}`
}

export function readMonitoringId(route: string): string | null {
  if (!route.startsWith(`${monitoringPath}/`)) return null
  const id = route.slice(monitoringPath.length + 1)
  return isAstronautId(id) ? id : null
}

export function assistancePathFor(id: string, alertId?: number) {
  return `${assistancePath}/${encodeURIComponent(id)}${alertId === undefined ? '' : '?aviso=' + alertId}`
}

export function readAssistanceId(route: string): string | null {
  if (!route.startsWith(`${assistancePath}/`)) return null
  const id = route.slice(assistancePath.length + 1).split('?')[0]
  return isAstronautId(id) ? id : null
}

export function readAssistanceAlertId(route: string) {
  if (!readAssistanceId(route)) return null
  const value = new URLSearchParams(route.split('?')[1]).get('aviso')
  const id = Number(value)
  return value && /^\d+$/.test(value) && Number.isSafeInteger(id) && id > 0 ? id : null
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

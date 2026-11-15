import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useState, useSyncExternalStore } from 'react'

interface InstallPrompt extends Event {
  prompt(): Promise<unknown>
}

let installPrompt: InstallPrompt | null = null
const promptListeners = new Set<() => void>()
const standalone = window.matchMedia('(display-mode: standalone)')

function setPrompt(prompt: InstallPrompt | null) {
  installPrompt = prompt
  for (const notify of promptListeners) notify()
}

function isStandalone() {
  return standalone.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true
}

window.addEventListener('beforeinstallprompt', (event) => {
  if (!isStandalone() && 'prompt' in event && typeof event.prompt === 'function') {
    event.preventDefault()
    setPrompt(event as InstallPrompt)
  }
})
window.addEventListener('appinstalled', () => setPrompt(null))
standalone.addEventListener('change', () => {
  if (isStandalone()) setPrompt(null)
})

function subscribePrompt(notify: () => void) {
  promptListeners.add(notify)
  return () => { promptListeners.delete(notify) }
}

function useWaitingUpdate() {
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    if (!import.meta.env.PROD || !window.isSecureContext || !('serviceWorker' in navigator)) return

    const serviceWorker = navigator.serviceWorker
    const base = new URL(import.meta.env.BASE_URL, document.baseURI)
    let disposed = false
    let remove = () => {}

    serviceWorker.register(new URL('sw.js', base), { scope: base.href, updateViaCache: 'none' }).then((registration) => {
      if (disposed) return
      let installing: ServiceWorker | null = null
      const sync = () => setWaiting(Boolean(serviceWorker.controller && registration.waiting))

      const observe = () => {
        installing?.removeEventListener('statechange', sync)
        installing = registration.installing
        installing?.addEventListener('statechange', sync)
        sync()
      }

      registration.addEventListener('updatefound', observe)
      serviceWorker.addEventListener('controllerchange', sync)
      observe()
      remove = () => {
        installing?.removeEventListener('statechange', sync)
        registration.removeEventListener('updatefound', observe)
        serviceWorker.removeEventListener('controllerchange', sync)
      }
    }).catch((error: unknown) => {
      if (!disposed) console.warn('Could not register the Astro-vital service worker.', error)
    })

    return () => {
      disposed = true
      remove()
    }
  }, [])

  return waiting
}

export function PwaControls() {
  const prompt = useSyncExternalStore(subscribePrompt, () => installPrompt)
  const waiting = useWaitingUpdate()

  async function install() {
    if (!prompt) return
    setPrompt(null)
    try {
      await prompt.prompt()
    } catch {
      // The native prompt can expire. Another browser event can make installation available again.
    }
  }

  if (!prompt && !waiting) return null

  return (
    <Stack spacing={1} sx={{ alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
      {prompt && <Button variant="outlined" onClick={install}>Install Astro-vital</Button>}
      {waiting && (
        <Typography role="status" variant="body2" color="text.secondary">
          Update available. Close all Astro-vital windows and reopen the app to apply it.
        </Typography>
      )}
    </Stack>
  )
}

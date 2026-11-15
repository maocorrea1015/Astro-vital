import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { observationDemoEnabled } from './observationEnvironment'
import { PwaControls } from '../pwa/PwaControls'
import { useBrowserOnline } from '../pwa/useBrowserOnline'
import { alertsPath, assistancePath, assistancePathFor, astronautDetailPath, hrefFor, monitoringPath, pageHeadingId, readAlertsId, readAssistanceId, readDetailId, readMonitoringId, sections } from './navigation'

interface AppShellProps {
  route: string
  title: string
  children: ReactNode
}

export function AppShell({ route, title, children }: AppShellProps) {
  const browserOnline = useBrowserOnline()
  const heading = useRef<HTMLHeadingElement>(null)
  const home = route === '/'
  const focusRoute = readMonitoringId(route) !== null ? monitoringPath : readAlertsId(route) !== null ? alertsPath : route
  const previousRoute = useRef(focusRoute)
  const previousOnline = useRef(browserOnline)

  useEffect(() => {
    if (previousRoute.current !== focusRoute) {
      previousRoute.current = focusRoute
      heading.current?.focus()
    }
  }, [focusRoute])

  const detailId = readDetailId(route)
  const assistanceId = readAssistanceId(route)
  const activeSection = route === astronautDetailPath || detailId !== null
    ? '/tripulacion'
    : assistanceId !== null ? assistancePath : focusRoute
  const contextualId = detailId ?? readMonitoringId(route) ?? readAlertsId(route) ?? assistanceId
  const contextualAssistancePath = contextualId ? assistancePathFor(contextualId) : assistancePath

  const needsData = activeSection === '/tripulacion' || activeSection === monitoringPath || activeSection === assistancePath || activeSection === alertsPath

  useEffect(() => {
    if (previousOnline.current && !browserOnline && (needsData || home) && document.activeElement === document.body) {
      // Unmounting a data view can remove the focused control.
      heading.current?.focus()
    }
    previousOnline.current = browserOnline
  }, [browserOnline, home, needsData])

  const pageTitle = (
    <Typography
      component="h1"
      variant="h1"
      id={pageHeadingId}
      ref={heading}
      tabIndex={-1}
      sx={{
        fontSize: home ? { xs: '1.65rem', sm: '2rem', md: '2.4rem' } : { xs: '1.8rem', sm: '2.4rem' },
        letterSpacing: home ? '-0.04em' : undefined,
        overflowWrap: 'anywhere',
        mb: 2,
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      {title}
    </Typography>
  )

  return (
    <Box sx={{ minHeight: '100svh' }}>
      <Link
        href="#contenido"
        onClick={(event) => {
          event.preventDefault()
          heading.current?.focus()
        }}
        sx={{
          position: 'absolute',
          insetInlineStart: 12,
          top: 12,
          zIndex: 1,
          bgcolor: 'background.paper',
          p: 1,
          '&:not(:focus)': { clipPath: 'inset(50%)' },
        }}
      >
        Skip to content
      </Link>
      <Box component="header" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Container
          maxWidth={false}
          sx={{ maxWidth: 1440, py: 1.25, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
        >
          <Typography component="span" sx={{ fontSize: '1.25rem', fontWeight: 750 }}>
            Astro-vital
          </Typography>
          {observationDemoEnabled && <Typography variant="caption" color="primary.main">{import.meta.env.DEV ? 'Local Lab' : 'Educational Demo'} · Synthetic Data Only</Typography>}
          <PwaControls />
        </Container>
      </Box>
      <Container
        maxWidth={false}
        sx={{
          maxWidth: 1440,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 1,
          py: 1,
        }}
      >
        <Box component="nav" aria-label="Main navigation">
          <Box
            component="ul"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(3, minmax(0, 1fr))', sm: 'repeat(5, max-content)' },
              gap: 1,
              m: 0,
              p: 0,
              listStyle: 'none',
            }}
          >
            {sections.map(({ path, label }) => {
              const active = path === activeSection
              return (
                <Box component="li" key={path}>
                  <Link
                    href={hrefFor(path === assistancePath ? contextualAssistancePath : path)}
                    aria-current={active ? (route === path ? 'page' : 'location') : undefined}
                    underline={active ? 'always' : 'none'}
                    color={active ? 'primary' : 'text.primary'}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: 44,
                      px: { xs: 0.75, sm: 2 },
                      py: 1,
                      borderRadius: 1,
                      bgcolor: active ? 'background.paper' : 'transparent',
                      fontWeight: active ? 750 : 500,
                      overflowWrap: 'anywhere',
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      '&:hover': { textDecoration: 'underline' },
                      '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                    }}
                  >
                    {label}
                  </Link>
                </Box>
              )
            })}
          </Box>
        </Box>
        <Box component="main" id="contenido" aria-labelledby={pageHeadingId}>
          {pageTitle}
          {!browserOnline && (
            <Typography role="status" sx={{ mb: 2 }} color="warning.main">
              Your browser is offline.
            </Typography>
          )}
          {!browserOnline && needsData ? (
            <div className="module-workspace"><section className="module-panel"><div className="module-empty"><strong>Mission data unavailable</strong><p>You can still navigate. Reconnect to view mission data.</p><Link href={hrefFor('/')}>Back to Mission Control</Link></div></section></div>
          ) : children}
        </Box>
      </Container>
    </Box>
  )
}

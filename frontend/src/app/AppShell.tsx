import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { PwaControls } from '../pwa/PwaControls'
import { useBrowserOnline } from '../pwa/useBrowserOnline'
import { assistancePath, assistancePathFor, astronautDetailPath, hrefFor, monitoringPath, pageHeadingId, readAssistanceId, readDetailId, readMonitoringId, sections } from './navigation'

interface AppShellProps {
  route: string
  title: string
  children: ReactNode
}

export function AppShell({ route, title, children }: AppShellProps) {
  const browserOnline = useBrowserOnline()
  const heading = useRef<HTMLHeadingElement>(null)
  const focusRoute = readMonitoringId(route) === null ? route : monitoringPath
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
  const contextualId = detailId ?? readMonitoringId(route) ?? assistanceId
  const contextualAssistancePath = contextualId ? assistancePathFor(contextualId) : assistancePath

  const needsData = activeSection === '/tripulacion' || activeSection === monitoringPath || activeSection === assistancePath

  useEffect(() => {
    if (previousOnline.current && !browserOnline && needsData && document.activeElement === document.body) {
      // Unmounting a data view can remove the focused control.
      heading.current?.focus()
    }
    previousOnline.current = browserOnline
  }, [browserOnline, needsData])

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
        Saltar al contenido
      </Link>
      <Box component="header" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Container
          maxWidth="lg"
          sx={{ py: { xs: 2, sm: 3 }, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
        >
          <Typography component="span" sx={{ fontSize: '1.25rem', fontWeight: 750 }}>
            Astro-vital
          </Typography>
          <PwaControls />
        </Container>
      </Box>
      <Container
        maxWidth="lg"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '13rem minmax(0, 1fr)' },
          gap: { xs: 3, md: 5 },
          py: { xs: 2, md: 5 },
        }}
      >
        <Box component="nav" aria-label="Navegación principal">
          <Box
            component="ul"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(5, minmax(0, 1fr))', md: '1fr' },
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
                      px: { xs: 1.5, sm: 2 },
                      py: 1,
                      borderRadius: 1,
                      bgcolor: active ? 'background.paper' : 'transparent',
                      fontWeight: active ? 750 : 500,
                      overflowWrap: 'anywhere',
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
          <Typography
            component="h1"
            variant="h1"
            id={pageHeadingId}
            ref={heading}
            tabIndex={-1}
            sx={{
              fontSize: { xs: '2rem', sm: '3rem' },
              overflowWrap: 'anywhere',
              mb: 2,
              '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
            }}
          >
            {title}
          </Typography>
          {!browserOnline && (
            <Typography role="status" sx={{ mb: 2 }} color="warning.main">
              El navegador reporta que está sin conexión.
            </Typography>
          )}
          {!browserOnline && needsData ? (
            <Typography>La navegación sigue disponible. Vuelve a conectarte para consultar los datos.</Typography>
          ) : children}
        </Box>
      </Container>
    </Box>
  )
}

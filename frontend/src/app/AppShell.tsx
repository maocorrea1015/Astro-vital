import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { astronautDetailPath, hrefFor, readDetailId, sections } from './navigation'

interface AppShellProps {
  route: string
  title: string
  children: ReactNode
}

export function AppShell({ route, title, children }: AppShellProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  const previousRoute = useRef(route)

  useEffect(() => {
    if (previousRoute.current !== route) {
      previousRoute.current = route
      heading.current?.focus()
    }
  }, [route])

  const activeSection = route === astronautDetailPath || readDetailId(route) !== null ? '/tripulacion' : route

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
        <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
          <Typography component="span" sx={{ fontSize: '1.25rem', fontWeight: 750 }}>
            Astro-vital
          </Typography>
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
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))', md: '1fr' },
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
                    href={hrefFor(path)}
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
        <Box component="main" id="contenido" aria-labelledby="page-heading">
          <Typography
            component="h1"
            variant="h1"
            id="page-heading"
            ref={heading}
            tabIndex={-1}
            sx={{
              fontSize: { xs: '2rem', sm: '3rem' },
              mb: 2,
              '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
            }}
          >
            {title}
          </Typography>
          {children}
        </Box>
      </Container>
    </Box>
  )
}

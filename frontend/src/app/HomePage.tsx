import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

import orbitImage from '../assets/home-orbit.webp'
import { alertsPath, assistancePath, hrefFor, monitoringPath, sections } from './navigation'

const descriptions = {
  '/tripulacion': 'Consulta el catálogo y abre el detalle de cada astronauta.',
  [monitoringPath]: 'Explora las mediciones y su histórico por astronauta.',
  [alertsPath]: 'Revisa las alertas activas y filtra por severidad.',
  [assistancePath]: 'Abre la asistencia manual y selecciona a un astronauta.',
}

export function HomeIntro({ heading }: { heading: ReactNode }) {
  return (
    <Box
      sx={{
        mb: { xs: 3, md: 4 },
        px: { xs: 2.5, sm: 4, md: 6 },
        py: { xs: 4, md: 6 },
        minHeight: { md: 350 },
        display: 'flex',
        alignItems: 'center',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: '#111e30',
        backgroundImage: {
          xs: 'linear-gradient(90deg, rgba(11, 20, 33, 0.96), rgba(11, 20, 33, 0.75)), url("' + orbitImage + '")',
          md: 'linear-gradient(90deg, #101b2c 8%, rgba(16, 27, 44, 0.96) 32%, rgba(16, 27, 44, 0.36) 68%, rgba(16, 27, 44, 0.06)), url("' + orbitImage + '")',
        },
        backgroundPosition: 'center, center 42%',
        backgroundSize: 'cover',
      }}
    >
      <Box sx={{ maxWidth: { sm: '34rem' }, minWidth: 0 }}>
        <Typography
          component="p"
          variant="overline"
          sx={{ color: 'primary.main', fontWeight: 750, letterSpacing: '0.13em', mb: 1, lineHeight: 1.5 }}
        >
          NASA Space Apps Challenge 2026
        </Typography>
        {heading}
        <Typography sx={{ maxWidth: '39ch', color: 'text.secondary', fontSize: { xs: '1rem', md: '1.125rem' } }}>
          Astro-vital reúne mediciones, tendencias y alertas para el seguimiento de astronautas en misiones espaciales prolongadas.
        </Typography>
        <Typography
          variant="body2"
          sx={{ mt: 3, pl: 1.5, borderInlineStart: '2px solid', borderColor: 'primary.main' }}
        >
          La demostración utiliza telemetría simulada.
        </Typography>
      </Box>
    </Box>
  )
}

export function HomePage() {
  return (
    <Box component="section" aria-labelledby="home-modules">
      <Typography id="home-modules" component="h2" variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Módulos
      </Typography>
      <Box
        component="ul"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
          listStyle: 'none',
          m: 0,
          p: 0,
        }}
      >
        {sections.map(({ path, label }) => path === '/' ? null : (
          <Box component="li" key={path} sx={{ display: 'flex', minWidth: 0 }}>
            <Link
              href={hrefFor(path)}
              aria-label={label}
              aria-describedby={`home-module-${path.slice(1)}`}
              underline="none"
              color="text.primary"
              sx={{
                display: 'block',
                width: '100%',
                minHeight: 44,
                p: 2.5,
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 2,
                '&:hover': { borderColor: 'primary.main', bgcolor: '#192d44' },
                '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 3 },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                <Typography component="span" variant="h6" sx={{ fontSize: '1.125rem', fontWeight: 750 }}>
                  {label}
                </Typography>
                <Typography component="span" color="primary.main" aria-hidden="true">→</Typography>
              </Box>
              <Typography id={`home-module-${path.slice(1)}`} component="span" variant="body2" color="text.secondary">
                {descriptions[path]}
              </Typography>
            </Link>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

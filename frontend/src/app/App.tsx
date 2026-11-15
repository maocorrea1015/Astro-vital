import Link from '@mui/material/Link'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

import { AppShell } from './AppShell'
import { astronautDetailPath, hrefFor, useRoute } from './navigation'

const views: Record<string, { title: string; description: string } | undefined> = {
  '/': {
    title: 'Inicio',
    description: 'Prototipo de monitoreo para la tripulación durante misiones espaciales prolongadas.',
  },
  '/tripulacion': {
    title: 'Tripulación',
    description: 'Aquí podrás consultar a los integrantes y acceder al detalle de cada astronauta.',
  },
  [astronautDetailPath]: {
    title: 'Detalle de astronauta',
    description: 'La selección de integrantes y sus datos se incorporarán con la integración de tripulación.',
  },
  '/monitoreo': {
    title: 'Monitoreo',
    description: 'Aquí podrás consultar las mediciones y su evolución.',
  },
  '/alertas': {
    title: 'Alertas',
    description: 'Aquí podrás consultar los avisos recibidos y su estado.',
  },
}

export function App() {
  const route = useRoute()
  const view = Object.hasOwn(views, route) ? views[route] : undefined

  return (
    <AppShell route={route} title={view?.title ?? 'Sección no encontrada'}>
      {view ? (
        <Stack spacing={2} sx={{ maxWidth: '66ch' }}>
          <Typography color="text.secondary">{view.description}</Typography>
          <Paper
            component="section"
            aria-labelledby="integration-status"
            variant="outlined"
            sx={{ p: { xs: 2, sm: 3 }, borderInlineStart: '3px solid', borderInlineStartColor: 'info.main' }}
          >
            <Typography id="integration-status" component="h2" variant="h6" color="info.main">
              Integración pendiente
            </Typography>
            <Typography color="text.secondary">
              {route === astronautDetailPath ? 'Aún no hay un astronauta seleccionado.' : 'Aún no hay datos disponibles en esta sección.'}
            </Typography>
          </Paper>
          {route === '/tripulacion' && <Link href={hrefFor(astronautDetailPath)}>Detalle de astronauta</Link>}
          {route === astronautDetailPath && <Link href={hrefFor('/tripulacion')}>Volver a tripulación</Link>}
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Typography color="text.secondary">La ruta solicitada no está disponible.</Typography>
          <Link href={hrefFor('/')}>Volver al inicio</Link>
        </Stack>
      )}
    </AppShell>
  )
}

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

export function App() {
  return (
    <Container
      component="main"
      maxWidth="md"
      sx={{
        minHeight: '100svh',
        display: 'grid',
        alignItems: 'center',
        py: { xs: 4, sm: 8 },
      }}
    >
      <Stack spacing={{ xs: 3, sm: 4 }}>
        <Box component="header">
          <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
            Ada Lovelace · NASA Space Apps Challenge 2026
          </Typography>
          <Typography variant="h1" sx={{ fontSize: { xs: '2.75rem', sm: '4.5rem' } }}>
            Astro-vital
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2, maxWidth: '42ch' }}>
            Prototipo para consultar mediciones y alertas de la tripulación durante misiones
            espaciales prolongadas.
          </Typography>
        </Box>
        <Paper
          component="section"
          aria-labelledby="monitoring-status"
          variant="outlined"
          sx={{ p: { xs: 2, sm: 3 }, borderInlineStart: '3px solid', borderInlineStartColor: 'info.main' }}
        >
          <Typography id="monitoring-status" component="h2" variant="h6" color="info.main">
            Integración de monitoreo pendiente
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Las lecturas de la tripulación estarán disponibles cuando se conecte la fuente de datos.
          </Typography>
        </Paper>
      </Stack>
    </Container>
  )
}

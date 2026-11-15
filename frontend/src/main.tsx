import CssBaseline from '@mui/material/CssBaseline'
import { ThemeProvider } from '@mui/material/styles'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app/App'
import { authorizeDeployedDemo } from './app/observationEnvironment'
import { theme } from './app/theme'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Astro-vital root container is missing.')
}

void authorizeDeployedDemo().then((authorized) => createRoot(root).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {authorized ? <App /> : <main><h1>Demo unavailable</h1><p>Could not verify session access.</p></main>}
    </ThemeProvider>
  </StrictMode>,
))

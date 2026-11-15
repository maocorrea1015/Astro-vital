import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#93d9f4' },
    info: { main: '#93d9f4' },
    background: { default: '#0c1422', paper: '#142337' },
    text: { primary: '#f4f8fc', secondary: '#bac9db' },
    divider: '#354d65',
  },
  typography: {
    fontFamily: 'system-ui, "Segoe UI", sans-serif',
    h1: { fontWeight: 750, lineHeight: 1.1 },
  },
  spacing: 8,
  shape: { borderRadius: 12 },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            outline: '2px solid #93d9f4',
            outlineOffset: 3,
          },
        },
      },
    },
  },
})

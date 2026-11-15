import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { pwaPlugin } from './src/pwa/pwaPlugin'

export default defineConfig({
  plugins: [react(), pwaPlugin()],
  server: {
    port: 5173,
    proxy: {
      // Intermediario seguro para consultar Flask bajo el mismo origen
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

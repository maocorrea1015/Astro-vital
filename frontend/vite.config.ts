import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { pwaPlugin } from './src/pwa/pwaPlugin'

export default defineConfig({
  plugins: [react(), pwaPlugin()],
})

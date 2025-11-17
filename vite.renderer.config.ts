import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react({})],
  root: './src/renderer',
  build: {
    outDir: '../../.vite/renderer/main_window',
  },
  server: {
    port: 5173,
  },
})

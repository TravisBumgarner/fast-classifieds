import { defineConfig } from 'vite'

// https://vitejs.dev/config
export default defineConfig({
  build: {
    sourcemap: true,
    rollupOptions: {
      // Marking 'electron' and native modules as external to prevent bundling issues
      external: ['electron', 'better-sqlite3', 'jsdom', 'puppeteer'],
    },
  },
})

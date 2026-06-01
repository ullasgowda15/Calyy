import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import prerenderSeo from './vite-plugin-prerender-seo.js'

export default defineConfig({
  plugins: [react(), tailwindcss(), prerenderSeo()],
  build: { chunkSizeWarningLimit: 1000 },
  server: {
    proxy: { '/api': 'http://localhost:8000' },
  },
})

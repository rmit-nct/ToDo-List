import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Username authentication is served by the root Next.js app, not the standalone Express server.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': process.env.VITE_API_TARGET || 'http://localhost:3000',
    },
  },
})

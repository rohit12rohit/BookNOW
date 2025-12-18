// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /api requests to backend
      '/api': {
        target: 'http://localhost:5001', // Correct backend target
        changeOrigin: true,             // Usually necessary
      }
    }
  }
})
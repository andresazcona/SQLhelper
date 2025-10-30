import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    plugins: [react()],
    server: isDev
      ? {
          host: '0.0.0.0', // Allow external connections (needed for Docker)
          port: 5173,
          strictPort: true,
          watch: {
            usePolling: true, // Needed for Docker on Windows/Mac
          },
          proxy: {
            // Proxy all /api requests to the backend to avoid CORS during development
            // NO eliminamos /api porque el backend espera rutas como /api/parse, /api/detect
            '/api': {
              target: process.env.DOCKER_ENV === 'true' ? 'http://backend:3000' : 'http://localhost:3000',
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  }
})

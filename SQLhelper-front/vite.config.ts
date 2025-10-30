import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  return {
    plugins: [react()],
    server: isDev
      ? {
          proxy: {
            // Proxy all /api requests to the backend to avoid CORS during development
            // NO eliminamos /api porque el backend espera rutas como /api/parse, /api/detect
            '/api': {
              target: 'http://localhost:3000',
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  }
})

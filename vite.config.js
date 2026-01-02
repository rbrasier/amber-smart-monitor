import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api/amber': {
        target: 'https://api.amber.com.au',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/amber/, ''),
        headers: {
          'Accept': 'application/json',
        }
      }
    }
  }
})

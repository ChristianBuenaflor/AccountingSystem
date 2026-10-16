import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api is proxied to alphalist-api (../../alphalist-api, php artisan serve --port=8791), so there is no CORS to set up.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:8791' } },
})

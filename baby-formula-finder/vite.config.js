import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/flipp': {
        target: 'https://backflipp.wishabi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/flipp/, '/flipp/items/search')
      }
    }
  }
})

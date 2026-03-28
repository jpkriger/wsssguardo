import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080/'
const usePolling = process.env.VITE_USE_POLLING === 'true'
const pollInterval = Number(process.env.VITE_POLL_INTERVAL ?? 200)

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    watch: {
      usePolling,
      interval: pollInterval,
    },
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
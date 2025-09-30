import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: { 
    port: 5100,
    proxy: {
      '/api': {
        target: 'https://ai-assistant-worker.demo-cdn-v1.workers.dev', // Replace with your actual worker URL
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})

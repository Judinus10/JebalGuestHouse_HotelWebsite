import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const proxyTarget = env.VITE_LOCAL_PROXY_TARGET
  const localApiPath = env.VITE_LOCAL_API_PATH

  if (!proxyTarget || !localApiPath) {
    throw new Error('VITE_LOCAL_PROXY_TARGET and VITE_LOCAL_API_PATH must be set in .env')
  }

  return {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
        rewrite: (requestPath) => requestPath.replace(/^\/api/, localApiPath),
      },
    },
  },
  }
})

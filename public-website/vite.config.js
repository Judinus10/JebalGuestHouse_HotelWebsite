import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_LOCAL_PROXY_TARGET
  const localApiPath = env.VITE_LOCAL_API_PATH

  if (!proxyTarget || !localApiPath) {
    throw new Error('VITE_LOCAL_PROXY_TARGET and VITE_LOCAL_API_PATH must be set in .env')
  }

  return {
  plugins: [react(), tailwindcss()],
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          icons: ['lucide-react', 'react-icons'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
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

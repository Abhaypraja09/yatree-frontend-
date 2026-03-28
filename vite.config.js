import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      stream: 'stream-browserify',
      util: 'util',
      events: 'events',
      buffer: 'buffer',
    },
  },
  define: {
    global: 'window',
    'process.env': {},
    process: {
      env: {}
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5005',
        changeOrigin: true,
      },
    }
  },
  build: {
    chunkSizeWarningLimit: 1500,
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — always needed, load first
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'react-core';
          }
          // Animation — heavy, lazy-load separately
          if (id.includes('node_modules/framer-motion')) {
            return 'framer-motion';
          }
          // Icons — medium, lazy-load separately
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide';
          }
          // Excel export — only needed on demand
          if (id.includes('node_modules/xlsx') || id.includes('node_modules/xlsx-js-style')) {
            return 'excel';
          }
          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})

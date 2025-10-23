import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    extensions: ['.js', '.jsx', '.json']
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    allowedHosts: [
      'localhost',
      '3d838acc679e.ngrok-free.app',
      '*.ngrok-free.app',
      '*.ngrok.io'
    ],
    cors: true
    ,
    proxy: {
      // Proxy API calls to the backend server during development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: false
      }
    }
  },
  define: {
    'process.env': JSON.stringify(process.env)
  }
  ,
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) return 'react-vendors';
            return 'vendor';
          }
        }
      }
    },
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1600
  }
})
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
      'sknbridgetrade-frontend.onrender.com',
      'sknbridgetrade-server.onrender.com',
      'eb894a61cc32.ngrok-free.app',
      'xxmhi-192-214-113-86.a.free.pinggy.link'
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
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    'process.env.VITE_PAYPAL_CLIENT_ID': JSON.stringify(process.env.VITE_PAYPAL_CLIENT_ID),
    'process.env.VITE_PAYPAL_SECRET': JSON.stringify(process.env.VITE_PAYPAL_SECRET),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.FRONTEND_URL': JSON.stringify(process.env.FRONTEND_URL)
  },
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
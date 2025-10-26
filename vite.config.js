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
      'xxmhi-192-214-113-86.a.free.pinggy.link',
      'skn.onrender.com',
      'skn-2.onrender.com'
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
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    'import.meta.env.VITE_PAYPAL_CLIENT_ID': JSON.stringify(process.env.VITE_PAYPAL_CLIENT_ID),
    'import.meta.env.VITE_PAYPAL_SECRET': JSON.stringify(process.env.VITE_PAYPAL_SECRET),
    'import.meta.env.MODE': JSON.stringify(process.env.NODE_ENV || 'production'),
    'import.meta.env.DEV': process.env.NODE_ENV !== 'production',
    'import.meta.env.PROD': process.env.NODE_ENV === 'production',
  },
  build: {
    // Use default chunking to avoid ordering issues between vendor chunks
    // (some libraries like framer-motion can error at runtime if React isn't
    //  initialized before their code runs). Removing manualChunks prevents
    //  forcing a specific chunking order during the build.
    rollupOptions: {},
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    chunkSizeWarningLimit: 1600
  }
})

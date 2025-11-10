import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
       // Resolve from current working directory so CI/build agents that
      // change the working dir (e.g. Render uses /opt/render/project/src)
      // don't end up with duplicated paths like /opt/render/project/src/src
      '@': path.resolve(process.cwd(), 'src')
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

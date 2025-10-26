import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
// Load environment variables from root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
config({ path: join(rootDir, '.env') });

// Debug - Print loaded environment variables
console.log('Loaded Environment Variables:', {
  VITE_PAYPAL_CLIENT_ID: process.env.VITE_PAYPAL_CLIENT_ID ? '✓ Present' : '✗ Missing',
  VITE_PAYPAL_SECRET: process.env.VITE_PAYPAL_SECRET ? '✓ Present' : '✗ Missing',
  NODE_ENV: process.env.NODE_ENV || 'not set',
  PORT: process.env.PORT || '3001'
});

// Dynamically import routes after env is loaded
let webhookRoutes;
let paypalRoutes;
let paypalCaptureRoutes;
let paypalMiddleware;
(async () => {
  const [
    { default: webhook },
    { default: paypal },
    { default: capture },
    { configurePayPalMiddleware }
  ] = await Promise.all([
    import('./webhooks.js'),
    import('./paypal-orders.js'),
    import('./paypal-capture.js'),
    import('./paypal-middleware.js')
  ]);
  
  webhookRoutes = webhook;
  paypalRoutes = paypal;
  paypalCaptureRoutes = capture;
  paypalMiddleware = configurePayPalMiddleware;

  // Now start the server (moved inside async init)
  startServer();
})();

let app;

function startServer() {
  app = express();

  // Middleware
  // Import and apply PayPal middleware
  const { configurePayPalMiddleware } = await import('./paypal-middleware.js');
  configurePayPalMiddleware(app);

  // Fallback CORS for non-PayPal routes
  app.use(cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://skn.onrender.com',
        'https://skn-2.onrender.com',
        process.env.FRONTEND_URL
      ].filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

  app.use(express.json());

  // Routes
  app.use('/api/paypal', paypalRoutes);
  app.use('/api/paypal', paypalCaptureRoutes);
  app.use('/api/webhooks', webhookRoutes);

  // Serve frontend static files if the build output exists (for deployments that use a single web service)
  try {
    const staticPath = join(rootDir, 'dist');
    if (fs.existsSync(staticPath)) {
      console.log('Serving static frontend from', staticPath);

      // Serve static assets with caching for performance. Do not rely on
      // default "index" behavior — we'll handle SPA fallback explicitly.
      app.use(express.static(staticPath, { maxAge: '1d', index: false }));

      // SPA fallback: for any GET request that isn't an API route and doesn't
      // look like a static file, return the app's index.html so the client
      // router can handle the route.
      app.get('*', (req, res, next) => {
        if (req.method !== 'GET') return next();
        // Skip API routes
        if (req.path.startsWith('/api') || req.path.startsWith('/server') || req.path.startsWith('/_next')) return next();

        // If the request appears to be for a file (has an extension), let static middleware handle it
        if (req.path.match(/\.[a-zA-Z0-9]+$/)) return next();

        res.sendFile(join(staticPath, 'index.html'), (err) => {
          if (err) next(err);
        });
      });
    }
  } catch (err) {
    console.warn('Error checking/serving static files:', err && err.message);
  }

  // Error handling
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
  });

  const PORT = process.env.PORT || 3001;

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

import './cron.js';
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { SERVER_CONFIG, PAYPAL_CONFIG, validateServerConfig } from './config.js';

// Load environment variables from root .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
config({ path: join(rootDir, '.env') });

// Validate configuration
validateServerConfig();

// Debug - Print loaded environment variables
console.log('Loaded Environment Variables:', {
  VITE_PAYPAL_CLIENT_ID: PAYPAL_CONFIG.clientId ? '✓ Present' : '✗ Missing',
  VITE_PAYPAL_SECRET: PAYPAL_CONFIG.secret ? '✓ Present' : '✗ Missing',
  NODE_ENV: SERVER_CONFIG.environment,
  PORT: SERVER_CONFIG.port
});

// Dynamically import routes after env is loaded
let webhookRoutes;
let paypalRoutes;
let paypalCaptureRoutes;
let paypalMiddleware;
let onboardingRoutes;
let paypalPayoutsRoutes;
let dashboardRoutes;
let healthRoutes;
let reviewRoutes;
let vendorRoutes;
(async () => {
  const [
    { default: webhook },
    { default: paypal },
    { default: capture },
    { default: payouts },
    { configurePayPalMiddleware },
    { default: onboarding },
    { default: dashboard },
    { default: health },
    { default: review },
    { default: vendor },
  ] = await Promise.all([
    import('./webhooks.js'),
    import('./paypal-orders.js'),
    import('./paypal-capture.js'),
    import('./paypal-payouts.js'),
    import('./paypal-middleware.js'),
    import('./onboarding.js'),
    import('./dashboard.js'),
    import('./health.js'),
    import('./reviews.js'),
    import('./vendor.js'),
  ]);
  
  webhookRoutes = webhook;
  paypalRoutes = paypal;
  paypalCaptureRoutes = capture;
  paypalPayoutsRoutes = payouts;
  paypalMiddleware = configurePayPalMiddleware;
  onboardingRoutes = onboarding;
  dashboardRoutes = dashboard;
  healthRoutes = health;
  reviewRoutes = review;
  vendorRoutes = vendor;

  // Now start the server (moved inside async init)
  startServer();
})();

let app;

function startServer() {
  app = express();

  // Middleware
  // Apply PayPal middleware if it was loaded during init. Avoid using `await` inside
  // this function so the file can run cleanly in environments that don't allow
  // top-level/embedded await during module compilation.
  if (typeof paypalMiddleware === 'function') {
    try {
      paypalMiddleware(app);
    } catch (err) {
      console.error('Failed to apply PayPal middleware:', err);
    }
  } else {
    // Fallback: dynamically import and apply without using await
    import('./paypal-middleware.js')
      .then(mod => mod.configurePayPalMiddleware(app))
      .catch(err => console.error('Failed to load PayPal middleware dynamically:', err));
  }

  // Fallback CORS for non-PayPal routes
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || SERVER_CONFIG.frontend.urls.includes(origin)) {
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
  app.use('/api/paypal', paypalPayoutsRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/onboarding', onboardingRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/health', healthRoutes);
  app.use('/api', reviewRoutes);
  app.use('/api/vendor', vendorRoutes);

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
      // router can handle the route. Use a middleware function instead of
      // `app.get('*', ...)` to avoid path-to-regexp compatibility issues.
      app.use((req, res, next) => {
        try {
          if (req.method !== 'GET') return next();
          // Skip API routes
          if (req.path.startsWith('/api') || req.path.startsWith('/server') || req.path.startsWith('/_next')) return next();

          // If the request appears to be for a file (has an extension), let static middleware handle it
          if (req.path.match(/\.[a-zA-Z0-9]+$/)) return next();

          res.sendFile(join(staticPath, 'index.html'), (err) => {
            if (err) next(err);
          });
        } catch (err) {
          // If path matching throws due to path-to-regexp issues elsewhere, fall back to next()
          console.warn('SPA fallback middleware error, skipping fallback:', err && err.message);
          return next();
        }
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

  app.listen(SERVER_CONFIG.port, () => {
    console.log(`Server running on port ${SERVER_CONFIG.port}`);
  });
}

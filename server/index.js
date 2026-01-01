// Load environment variables FIRST before importing anything that uses config
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
// Load .env with override to ensure all vars are available
config({ path: join(rootDir, '.env'), override: true });

// Log that env vars were loaded and show what we got
console.log('[dotenv] Environment variables loaded from .env');
console.log('[dotenv] Key variables:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? '✓' : '✗',
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? '✓' : '✗',
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID ? '✓' : '✗',
  PORT: process.env.PORT
});

// Import cron FIRST (before anything else)
// This is safe because cron.js doesn't depend on the config module
import './cron.js';

// NOW we can safely import express and other standard modules
import express from 'express';
import cors from 'cors';
import fs from 'fs';

// Create a function to initialize the server after all env vars are loaded
async function initializeServer() {
  // NOW import config modules - this happens AFTER dotenv has loaded everything
  const { SERVER_CONFIG, PAYPAL_CONFIG, SUPABASE_CONFIG, validateServerConfig } = await import('./config.js');

  // Validate configuration
  validateServerConfig();

  // Debug - Print loaded environment variables
  console.log('Loaded Environment Variables:', {
    VITE_PAYPAL_CLIENT_ID: PAYPAL_CONFIG.clientId ? '✓ Present' : '✗ Missing',
    VITE_PAYPAL_SECRET: PAYPAL_CONFIG.secret ? '✓ Present' : '✗ Missing',
    NODE_ENV: SERVER_CONFIG.environment,
    PORT: SERVER_CONFIG.port
  });

  // Load all route modules
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
    { default: orders },
    { default: wishlist },
    { default: inventory },
    { default: messages },
    { default: profile },
    { default: products },
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
    import('./orders.js'),
    import('./wishlist.js'),
    import('./inventory.js'),
    import('./messages.js'),
    import('./profile.js'),
    import('./products.js'),
  ]);

  // Start the server with all config and routes loaded
  startServer(SERVER_CONFIG, {
    webhook,
    paypal,
    capture,
    payouts,
    configurePayPalMiddleware,
    onboarding,
    dashboard,
    health,
    review,
    vendor,
    orders,
    wishlist,
    inventory,
    messages,
    profile,
    products,
  });
}

// Call the async initializer
initializeServer().catch(err => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});

function startServer(SERVER_CONFIG, routes) {
  const app = express();

  // Middleware
  // Apply PayPal middleware
  if (typeof routes.configurePayPalMiddleware === 'function') {
    try {
      routes.configurePayPalMiddleware(app);
    } catch (err) {
      console.error('Failed to apply PayPal middleware:', err);
    }
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
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  }));

  app.use(express.json());

  // Routes
  app.use('/api/paypal', routes.paypal);
  app.use('/api/paypal', routes.capture);
  app.use('/api/paypal', routes.payouts);
  app.use('/api/webhooks', routes.webhook);
  app.use('/api/onboarding', routes.onboarding);
  app.use('/api/dashboard', routes.dashboard);
  app.use('/api/health', routes.health);
  app.use('/api', routes.review);
  app.use('/api/vendor', routes.vendor);
  app.use('/api/orders', routes.orders);
  app.use('/api/wishlist', routes.wishlist);
  app.use('/api/inventory', routes.inventory);
  app.use('/api/messages', routes.messages);
  app.use('/api/profile', routes.profile);
  
  // Products route - multer middleware applied to specific endpoint in router
  app.use('/api/products', routes.products);

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

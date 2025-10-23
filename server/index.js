import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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
(async () => {
  webhookRoutes = (await import('./webhooks.js')).default;
  paypalRoutes = (await import('./paypal-orders.js')).default;

  // Now start the server (moved inside async init)
  startServer();
})();

let app;

function startServer() {
  app = express();

  // Middleware
  app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://3d838acc679e.ngrok-free.app',
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
  app.use('/api/webhooks', webhookRoutes);

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
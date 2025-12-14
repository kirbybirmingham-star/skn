import express from 'express';
import cors from 'cors';
import { SERVER_CONFIG } from './config.js';

// Middleware to configure PayPal for SSR compatibility
export function configurePayPalMiddleware(app) {
  // Configure CORS for PayPal
  const corsOptions = {
    origin: (origin, callback) => {
      const allowedOrigins = [
        ...SERVER_CONFIG.frontend.urls,
        'https://www.paypal.com'
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  };

  app.use(cors(corsOptions));

  // Add security headers
  app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Cache the PayPal SDK
    if (req.url.includes('/sdk/js')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    
    next();
  });

  // Handle preflight requests. Use a path pattern compatible with the
  // path-to-regexp version used by Express (use '/*' instead of '*').
  // No explicit app.options registration to avoid path-to-regexp issues across
  // different Express/path-to-regexp versions. The global `app.use(cors())`
  // above will handle preflight requests.

  // Add environment check middleware
  app.use('/api/paypal', (req, res, next) => {
    const clientId = process.env.VITE_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.VITE_PAYPAL_SECRET || process.env.PAYPAL_SECRET;

    if (!clientId || !clientSecret) {
      console.error('PayPal credentials missing');
      return res.status(500).json({ 
        error: 'PayPal configuration incomplete',
        details: process.env.NODE_ENV === 'development' ? {
          clientId: !!clientId,
          clientSecret: !!clientSecret
        } : undefined
      });
    }

    next();
  });
}
import { SERVER_CONFIG } from './config.js';

/**
 * Express middleware to authenticate users using Supabase JWT
 */
export async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    // Store token for use in route handlers
    req.user = { token };
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Express CORS middleware
 */
export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  
  if (origin && SERVER_CONFIG.frontend.urls.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Add security headers
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}
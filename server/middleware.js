import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const app = express();

const corsOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://skn.onrender.com',
  'https://skn-2.onrender.com'
];

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || corsOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://www.paypal.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.paypal.com", "https://api.sandbox.paypal.com"],
    },
  },
}));

// Initialize Supabase client for middleware
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Middleware: verify Authorization: Bearer <token>
export async function verifySupabaseJwt(req, res, next) {
  try {
    if (!supabase) return res.status(503).json({ error: 'Server not configured for authentication verification' });

    const auth = req.headers.authorization || req.headers.Authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing Authorization header' });
    const token = auth.split(' ')[1];
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' });
    req.user = data.user;
    next();
  } catch (err) {
    console.error('verifySupabaseJwt error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// Alias for backward compatibility with orders.js and other modules
export const authenticateUser = verifySupabaseJwt;

// Alias for backward compatibility with vendor.js and wishlist.js
export const verifyJWT = verifySupabaseJwt;

// Alias for backward compatibility
export const requireAuth = verifySupabaseJwt;

// Middleware: require specific role(s)
export function requireRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ error: 'Authentication required' });

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', req.user.id)
        .single();

      if (error || !data) return res.status(403).json({ error: 'User profile not found' });

      const userRole = data.role;
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      req.user.role = userRole; // Add role to req.user for convenience
      next();
    } catch (err) {
      console.error('requireRole error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  };
}

export default app;
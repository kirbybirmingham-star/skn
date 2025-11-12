import express from 'express';
const router = express.Router();

function mask(val) {
  if (!val) return null;
  if (val.length <= 8) return '••••';
  return `${val.slice(0,4)}...${val.slice(-4)}`;
}

router.get('/', (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || null;
    const supabaseAnon = process.env.VITE_SUPABASE_ANON_KEY || null;
    const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY || null;
    const paypalClient = process.env.VITE_PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID || null;
    const paypalSecret = process.env.VITE_PAYPAL_SECRET || process.env.PAYPAL_SECRET || null;

    return res.json({
      ok: true,
      env: {
        node_env: process.env.NODE_ENV || null,
        port: process.env.PORT || null,
      },
      supabase: {
        url: supabaseUrl ? supabaseUrl.replace(/(^https?:\/\/|\/$)/g, '') : null,
        hasAnonKey: !!supabaseAnon,
        hasServiceKey: !!supabaseService,
        anonKey: mask(supabaseAnon),
        serviceKey: mask(supabaseService),
      },
      paypal: {
        hasClientId: !!paypalClient,
        hasSecret: !!paypalSecret,
        clientId: mask(paypalClient),
      }
    });
  } catch (err) {
    console.error('Health endpoint error', err);
    return res.status(500).json({ ok: false, error: 'health check failed' });
  }
});

export default router;

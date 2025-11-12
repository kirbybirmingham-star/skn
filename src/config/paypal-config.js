export const PAYPAL_CONFIG = {
  // PayPal Script configuration
  SCRIPT_CONFIG: {
    'client-id': process.env.VITE_PAYPAL_CLIENT_ID,
    currency: 'USD',
    intent: 'capture',
    components: ['buttons'],
    'data-namespace': 'skn_paypal',
    'disable-funding': 'credit,card,p24,sofort',
    'enable-funding': 'venmo,paylater',
  },

  // PayPal Button configuration
  BUTTON_STYLES: {
    layout: 'vertical',
    color: 'gold',
    shape: 'rect',
    label: 'checkout',
    height: 50,
  },

  // API endpoints
  ENDPOINTS: {
    SANDBOX: 'https://api-m.sandbox.paypal.com',
    PRODUCTION: 'https://api-m.paypal.com',
  },

  // Allowed origins for CORS
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://skn.onrender.com',
    'https://skn-2.onrender.com',
    'https://www.paypal.com',
  ],

  // Cache settings
  CACHE_SETTINGS: {
    SDK: {
      maxAge: 3600,
      public: true,
    },
  },

  // Security headers
  SECURITY_HEADERS: {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  },

  // App settings
  APP_SETTINGS: {
    BRAND_NAME: 'SKN Bridge Trade',
    SUCCESS_URL: 'https://skn.onrender.com/success',
    CANCEL_URL: 'https://skn.onrender.com/cart',
  },
};
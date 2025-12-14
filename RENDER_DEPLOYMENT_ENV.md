# Render Deployment Environment Configuration

## Overview
The application supports both local development and Render cloud deployment with automatic environment detection.

## How It Works

### Local Development
- **Frontend**: Runs on `http://localhost:3000` (Vite dev server)
- **Backend**: Runs on `http://localhost:3001` (Node/Express)
- **API Route**: Frontend uses `/api` proxy, which Vite routes to `http://localhost:3001`
- **Detection**: `import.meta.env.DEV` is `true`, and `VITE_API_URL` is `http://localhost:3001`
- **Result**: `API_CONFIG.baseURL` = `/api`

### Render Deployment
- **Frontend Service**: Deployed at `https://skn-2.onrender.com`
- **Backend Service**: Deployed at a separate Render URL (e.g., `https://skn-backend-api.onrender.com`)
- **API Route**: Frontend will append `/api` to the configured backend root so calls target the server's `/api/*` handlers
- **Detection**: `VITE_API_URL` is set to backend service URL (contains `onrender.com`, not localhost)
- **Result**: `API_CONFIG.baseURL` = `https://skn-backend-api.onrender.com/api`

## Environment Variables to Set on Render

### Frontend Service (`skn-2`)
Set the following environment variables in the Render dashboard:

```
VITE_SUPABASE_URL=https://tmyxjsqhtxnuchmekbpt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_PAYPAL_CLIENT_ID=Ae9aWcPWLr5fWx6VPddjCKlPcqIZCQF5OB79PW1fcZ...
VITE_PAYPAL_SECRET=EBK2vfhqSVPBtnVckWYkCcVayjKbqiMZ-zcvgABHH1oY...
VITE_PAYPAL_MODE=sandbox
VITE_PAYPAL_CURRENCY=USD
VITE_API_URL=https://skn-backend-api.onrender.com
VITE_FRONTEND_URL=https://skn-2.onrender.com
```

**Important**: Set `VITE_API_URL` to match your deployed backend service URL on Render.

**Note**: Do **not** include a trailing `/api` in `VITE_API_URL` — the frontend will normalize and append `/api` automatically. For example, set `VITE_API_URL=https://skn-backend-api.onrender.com` (not `https://skn-backend-api.onrender.com/api`).

### Backend Service
Set the following environment variables:

```
VITE_SUPABASE_URL=https://tmyxjsqhtxnuchmekbpt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_PAYPAL_CLIENT_ID=Ae9aWcPWLr5fWx6VPddjCKlPcqIZCQF5OB79PW1fcZ...
VITE_PAYPAL_SECRET=EBK2vfhqSVPBtnVckWYkCcVayjKbqiMZ-zcvgABHH1oY...
VITE_PAYPAL_MODE=sandbox
VITE_PAYPAL_CURRENCY=USD
VITE_FRONTEND_URL=https://skn-2.onrender.com
NODE_ENV=production
PORT=3001
```

## Local Development Setup

No environment configuration changes needed. The defaults in `.env` work fine:

```env
VITE_API_URL=http://localhost:3001
VITE_FRONTEND_URL=http://localhost:3000
```

## How API URLs are Selected (Logic)

In `src/config/environment.js`:

1. If running in Vite dev mode (`import.meta.env.DEV` is true) **AND** the API URL is localhost → use `/api` proxy
2. Otherwise → use full URL from `VITE_API_URL` environment variable

```javascript
const isDeployedOnRender = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '';
  return apiUrl && !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1');
};

const baseURL = isDevelopment && !isDeployedOnRender()
  ? '/api'
  : `${(import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')}/api`;
```

## Debugging

The frontend logs the API URL it's using on startup:

```
[Environment] API URL: /api (isDev: true, isDeployed: false)
```

or on Render:

```
[Environment] API URL: https://skn-backend-api.onrender.com/api (isDev: false, isDeployed: true)
```

Check the browser console to verify the correct URL is being used.

## CORS Configuration

When deploying on Render:
- Frontend and backend are on different domains
- Backend **must** allow CORS from the frontend domain

In `server/index.js` (or middleware), ensure CORS allows the frontend origin:

```javascript
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'https://skn-2.onrender.com',
  // Add other frontend URLs as needed
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

## Common Issues

### Issue: "CORS policy: Permission was denied"
- **Cause**: Frontend and backend on different domains, but CORS not configured
- **Solution**: Check backend CORS middleware allows the frontend origin

### Issue: Frontend uses localhost API URL on deployed site
- **Cause**: `VITE_API_URL` environment variable not set in Render frontend service
- **Solution**: Set `VITE_API_URL` to your backend service URL in Render dashboard

### Issue: Local development not working
- **Cause**: Vite proxy not routing to backend, or backend not running
- **Solution**: 
  - Ensure backend is running: `npm start` (port 3001)
  - Ensure frontend is running: `npm run dev` (port 3000)
  - Check console for `[Environment] API URL: /api`

## Testing the Configuration

### Local Test
1. Run backend: `npm start`
2. Run frontend: `npm run dev`
3. Open `http://localhost:3000`
4. Check console: should see `[Environment] API URL: /api`
5. Try fetching from onboarding dashboard

### Deployed Test
1. Push changes to main branch
2. Check Render builds complete
3. Navigate to `https://skn-2.onrender.com`
4. Check console: should see `[Environment] API URL: https://skn-backend-api.onrender.com/api`
5. Try fetching from onboarding dashboard (should work without CORS error)

# SKN Bridgetrade

This repository contains a Vite + React frontend and an Express server for the SKN Bridge Trade project.

## Quick local run

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

## Start server (production)

```powershell
npm start
```

## Deploying to Render

1. Push this repository to GitHub.
2. In Render, create a new *Static Site* for the frontend:
   - Connect GitHub repo and select the `main` branch.
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
3. Create a *Web Service* for the server:
   - Connect GitHub repo and select the `main` branch.
   - Environment: Node
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

## Environment variables

- `SUPABASE_*` keys (see `server/.env` or Render dashboard)
- `PORT` — server port (default: `3001`)
- Frontend URLs and any other runtime secrets should be configured in the hosting environment.

## PayPal Configuration

This project performs PayPal token exchange and order creation on the server. When running against PayPal **live/production**, set the server environment to production and provide your live credentials. Capturing an order performs a real payment.

- `PAYPAL_CLIENT_ID` — your PayPal app Client ID (server-only)
- `PAYPAL_SECRET` — your PayPal app Secret (server-only)
- `VITE_PAYPAL_CLIENT_ID` / `VITE_PAYPAL_SECRET` — optional copies for local/dev; the server reads both prefixed and non-prefixed names. Do NOT commit secrets.
- `NODE_ENV=production` — server will use PayPal production API (`https://api-m.paypal.com`).
- For sandbox testing, use sandbox app credentials and `NODE_ENV=development` (or leave unset) so the code targets PayPal sandbox.

Important:
- Creating a PayPal order (`/v2/checkout/orders`) does not capture funds. Calling capture (`/v2/checkout/orders/{id}/capture`) will perform a real charge in production.
- Keep `PAYPAL_SECRET` private. The server performs the OAuth exchange and stores no secrets in source control.

## Notes

- The `render.yaml` file is included as a blueprint for Render deployments.
- Ensure the `main` branch is the branch you use on GitHub.

# skn
webstuff
=======
# SKN Bridgetrade

This repository contains a Vite + React frontend and an Express server.

Quick local run

```powershell
npm install
npm run dev
```

Build

```powershell
npm run build
```

Start server (production)

```powershell
npm start
```

# SKN Bridgetrade

This repository contains a Vite + React frontend and an Express server.

Quick local run

```powershell
npm install
npm run dev
```

Build

```powershell
npm run build
```

Start server (production)

```powershell
npm start
```

Deploying to Render

1. Push this repository to GitHub.
2. In Render, create a new *Static Site* for the frontend:
   - Connect GitHub repo and select the `main` branch.
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
3. Create a *Web Service* for the server:
   - Connect GitHub repo and select the `main` branch.
   - Environment: Node
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

Environment variables

- Add any required secrets in the Render dashboard for both services (e.g., SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE/PayPal secrets, etc.)

Notes

- The `render.yaml` file is included as a blueprint that Render can use for Infrastructure as Code deployments.
- Ensure the `main` branch exists and is the branch you use on GitHub.
 is included as a blueprint that Render can use for Infrastructure as Code deployments.
- Ensure the `main` branch exists and is the branch you use on GitHub.
=======
<<<<<<< HEAD
# skn
webstuff
=======
# SKN Bridgetrade

This repository contains a Vite + React frontend and an Express server.

Quick local run

```powershell
npm install
npm run dev
```

Build

```powershell
npm run build
```

Start server (production)

```powershell
npm start
```

# SKN Bridgetrade

This repository contains a Vite + React frontend and an Express server.

Quick local run

```powershell
npm install
npm run dev
```

Build

```powershell
npm run build
```

Start server (production)

```powershell
npm start
```

Deploying to Render

1. Push this repository to GitHub.
2. In Render, create a new *Static Site* for the frontend:
   - Connect GitHub repo and select the `main` branch.
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
3. Create a *Web Service* for the server:
   - Connect GitHub repo and select the `main` branch.
   - Environment: Node
   - Build command: `npm install && npm run build`
   - Start command: `npm start`

Environment variables

- Add any required secrets in the Render dashboard for both services (e.g., SUPABASE_URL, SUPABASE_ANON_KEY, STRIPE/PayPal secrets, etc.)

Notes

- The `render.yaml` file is included as a blueprint that Render can use for Infrastructure as Code deployments.
- Ensure the `main` branch exists and is the branch you use on GitHub.
 is included as a blueprint that Render can use for Infrastructure as Code deployments.
- Ensure the `main` branch exists and is the branch you use on GitHub.
>>>>>>> cc97638ba2bc00ecfa8026f552ab06f85fb9199c

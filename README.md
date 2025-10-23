<<<<<<< HEAD
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

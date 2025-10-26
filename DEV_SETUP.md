Local development and deploy checklist

This file contains recommended steps and best practices for developing locally and deploying the app.

1) Local environment (safe, non-committed)
- Copy `.env.example` to `.env` and fill in values locally (do NOT commit `.env`). Example:
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  VITE_PAYPAL_CLIENT_ID=your-paypal-client-id
  VITE_PAYPAL_SECRET=your-paypal-secret
  NODE_ENV=development
  PORT=3001
  FRONTEND_URL=http://localhost:3000

2) Install dependencies
- Run (once):
  npm ci

3) Start servers
- Backend (terminal A):
  node server/index.js
- Frontend (terminal B):
  npm run dev

4) Build for production (locally)
- To test the production build and static serving behavior:
  npm run build
- Then start the server and visit http://localhost:3001 (or whichever PORT) to confirm the server serves `dist` and SPA routing works.

5) Deployment notes
- Netlify:
  - Use `netlify.toml` in root (already provided) with `publish = "dist"` and redirects to `/index.html`.
  - Set necessary env vars in the Netlify site settings (VITE_SUPABASE_*, VITE_PAYPAL_*).
  - Ensure Node version matches .nvmrc if you rely on specific engine behavior.

- Render (web service):
  - Ensure the service's build command installs deps and runs `npm run build` (render and netlify guard skip postinstall builds by default now).
  - Add required environment variables to the Render service.

6) Troubleshooting
- If the deployed site loads `index.html` that references `/src/*`, then the wrong file was deployed (dev index.html). Make sure Netlify/Render publishes `dist` and that `dist/index.html` references `/assets`.
- If client-side navigation (deep links) 404, confirm SPA fallback is configured. Express server includes an explicit SPA fallback; Netlify uses `_redirects`/`netlify.toml`.

7) Useful commands
- Clean install: npm ci
- Dev server: npm run dev
- Build: npm run build
- Start backend only: node server/index.js

If you want, I can also add a small `make dev` or npm script to start both backend and frontend concurrently locally (requires `concurrently` package).
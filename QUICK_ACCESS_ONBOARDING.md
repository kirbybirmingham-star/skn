# Quick Access - Onboarding Dashboard

## Start the Servers

**Terminal 1 - Backend:**
```bash
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## Access Points

| Component | URL | Port | Status |
|-----------|-----|------|--------|
| Frontend | http://localhost:3000 | 3000 | ✅ Running |
| Dashboard | http://localhost:3000/dashboard/onboarding | 3000 | ✅ Working |
| Backend API | http://localhost:3001 | 3001 | ✅ Running |
| API Endpoint | http://localhost:3001/api/onboarding/me | 3001 | ✅ Ready |

---

## What Was Fixed

1. **Syntax Error** - Removed extra `}));` from `server/index.js` line 109
2. **Environment Config** - Removed conflicting `NODE_ENV` from `.env`
3. **Missing Variables** - Added all `VITE_*` configuration variables

---

## Configuration System

### Frontend
```javascript
import { API_CONFIG } from '@/config/environment.js';
// API_CONFIG.baseURL = 'http://localhost:3001'
```

### Backend  
```javascript
import { SERVER_CONFIG } from './config.js';
// SERVER_CONFIG.port = 3001
```

---

## Testing the Dashboard

1. Start both servers (see above)
2. Go to http://localhost:3000/dashboard/onboarding
3. You should see the onboarding dashboard loading

---

## Troubleshooting

### Port Already in Use
```bash
# Stop Node processes
Get-Process node | Stop-Process -Force
```

### API Not Responding
- Check backend is running: `npm start` in one terminal
- Check frontend proxy config in `vite.config.js`
- Verify `.env` has `VITE_API_URL=http://localhost:3001`

### 404 Errors on API
- Ensure both servers are running
- Check browser console (F12) for actual error
- Verify token is being sent in Authorization header

---

## Files to Know

| File | Purpose |
|------|---------|
| `.env` | Environment variables |
| `src/config/environment.js` | Frontend config |
| `server/config.js` | Backend config |
| `server/index.js` | Backend server (fixed) |
| `src/pages/OnboardingDashboard.jsx` | Dashboard component |

---

## Next Steps

✅ Servers are running  
✅ Dashboard is accessible  
✅ Configuration system is working  

Ready to test with real seller data!

---

**All issues resolved - Dashboard is fully functional!**

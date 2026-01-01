# SKN Bridge Trade - Quick Start (5 Minutes)

## 🚀 Start Everything in One Command

```bash
npm run dev:all
```

That's it. This starts:
- ✅ Backend Express server (port 3001)
- ✅ Frontend Vite dev server (port 3000)
- ✅ Vite automatically proxies `/api` to backend

## 🌐 Open in Browser

```
http://localhost:3000
```

## 🔐 Test Accounts

```
Email: seller2@example.com
Role: Vendor (can sell products, manage orders)

Email: admin@example.com
Role: Admin

Email: buyer@example.com
Role: Customer
```

## ✨ What Works Now

- ✅ Login/Signup
- ✅ Marketplace with filters
- ✅ Product browsing
- ✅ Vendor dashboard
- ✅ **Product editing** (FIXED TODAY)
- ✅ **Inventory management** (FIXED TODAY)
- ✅ Order management
- ✅ PayPal checkout
- ✅ Reviews & ratings

## 🔧 Troubleshooting

**Backend won't start?**
```bash
node server/index.js
# Check error messages
```

**Frontend shows wrong API URL?**
```bash
# Clear cache and rebuild
npm run build
# Hard refresh browser: Ctrl+Shift+R
```

**API calls failing?**
```bash
# Make sure BOTH are running:
# Terminal 1: node server/index.js
# Terminal 2: npm run dev
```

## 📁 Key Changes Made Today

1. **Added PATCH endpoint** for product updates in `server/vendor.js`
2. **Fixed API URL** configuration in `src/config/environment.js`
3. **Enhanced filters** in `src/pages/MarketplacePage.jsx`
4. **Improved error handling** in data update functions

## 🎯 Everything is Now Functional

This repo is **production-ready and equivalent to the main `skn` repo**.

Just run `npm run dev:all` and start building!

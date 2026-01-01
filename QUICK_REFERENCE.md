# DATA LAYER - QUICK REFERENCE

## Import

```javascript
import DataLayer from '$lib/api/DataLayer';
import { 
  createProductsStore, 
  createProductStore,
  useCreateProduct,
  createOrdersStore,
  useOrderFulfillment,
  success,
  error
} from '$lib/hooks/useDataLayer';
```

## Products

### Fetch All
```javascript
const products = createProductsStore({ categoryId: 'electronics' });
onMount(() => products.fetch());
// $products.data, $products.loading, $products.error
```

### Fetch One
```javascript
const product = createProductStore('product-123');
onMount(() => product.fetch());
// $product.data, $product.loading
```

### Create
```javascript
const { create, loading } = useCreateProduct();
const result = await create({ title, description, base_price, ... });
```

### Update
```javascript
const product = createProductStore('product-123');
const result = await product.update({ title, base_price, ... });
```

### Delete
```javascript
const product = createProductStore('product-123');
const result = await product.delete();
```

## Vendors

### Fetch All
```javascript
const vendors = createVendorsStore();
onMount(() => vendors.fetch());
```

### Fetch Current User's Vendor
```javascript
const vendor = createVendorStore(userId);
onMount(() => vendor.fetch());
```

### Update
```javascript
const vendor = createVendorStore(userId);
const result = await vendor.update({ name, description, ... });
```

## Orders

### Fetch Vendor Orders
```javascript
const orders = createOrdersStore();
onMount(() => orders.fetch());
```

### Fulfill Order
```javascript
const { fulfill } = useOrderFulfillment();
const result = await fulfill('order-123');
```

### Cancel Order
```javascript
const { cancel } = useOrderFulfillment();
const result = await cancel('order-123');
```

## Inventory

### Update
```javascript
const { update } = useInventoryUpdate();
const result = await update('product-123', 'variant-456', 50);
```

## Notifications

```javascript
import { success, error, info } from '$lib/hooks/useDataLayer';

success('Product created!');
error('Something went wrong');
info('Please wait...');
```

## Store Pattern

### Store States
```javascript
$store.loading    // true when fetching
$store.loaded     // true after first successful fetch
$store.error      // error message if any
$store.data       // the actual data
$store.ready      // true when loaded and not loading
$store.hasError   // true if $store.error is not null
```

### Store Methods
```javascript
store.fetch()     // fetch data
store.refresh()   // refetch current data
store.clear()     // clear data and reset state
```

## Direct API Calls

```javascript
// Get products
const result = await DataLayer.products.getAll({ categoryId: 'electronics' });
if (result.success) console.log(result.data.products);

// Create product
const result = await DataLayer.products.create({ ... });

// Update product
const result = await DataLayer.products.update('product-123', { ... });

// Delete product
const result = await DataLayer.products.delete('product-123');
```

## Response Format

All operations return:
```javascript
{
  success: true/false,
  data: { ... },
  error: { message, code, details },
  metadata: { timestamp, ... }
}
```

## In Svelte Template

```svelte
{#if $store.loading}
  Loading...
{:else if $store.hasError}
  Error: {$store.error}
{:else if $store.data}
  <!-- Use data -->
{:else}
  No data
{/if}
```

## Form Submission

```svelte
<script>
  import { useCreateProduct } from '$lib/hooks/useDataLayer';
  const { create, loading } = useCreateProduct();
  
  async function handleSubmit(e) {
    e.preventDefault();
    const result = await create(formData);
  }
</script>

<form on:submit={handleSubmit}>
  <!-- fields -->
  <button disabled={$loading}>Submit</button>
</form>
```

## Batch Operations

```javascript
import { useBatch } from '$lib/hooks/useDataLayer';
const { execute } = useBatch();

const result = await execute([
  { name: 'op1', execute: () => DataLayer.products.getAll() },
  { name: 'op2', execute: () => DataLayer.vendors.getAll() }
]);
```

## Retry Logic

```javascript
import { executeWithRetry } from '$lib/api/DataLayer';

const result = await executeWithRetry(
  () => DataLayer.products.getAll(),
  3,        // max retries
  1000      // base delay in ms
);
```

## Validation

```javascript
import { validate } from '$lib/api/DataLayer';

const { valid, errors } = validate(data, 'product');
if (!valid) {
  errors.forEach(err => console.log(err));
}
```

## Configuration

Edit `src/config/dataLayerConfig.js` for:
- API endpoints
- Validation rules
- Error messages
- Success messages
- Rate limits
- Cache settings

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "User must be logged in" | Operation requires authentication | User needs to sign in |
| "You do not have permission" | User doesn't own resource | Check ownership logic |
| "Validation failed" | Data doesn't match rules | Check form input against rules |
| "Network connection failed" | No internet | Check connection, retry |
| "Request timed out" | Server slow | Retry with backoff |

## Debugging

Check browser console for `[DataLayer]` logs:
```
[DataLayer] GET /products
[DataLayer API] Attempt 1/3
[DataLayer] Products.getAll failed: Network error
```

Add custom logging:
```javascript
const result = await DataLayer.products.getAll();
console.log('Result:', result);
console.log('Success:', result.success);
console.log('Data:', result.data);
console.log('Error:', result.error);
```

## Performance Tips

1. **Use stores for reactive data** - Don't refetch if store already has data
2. **Batch operations** - Combine related operations
3. **Retry wisely** - Don't retry immediately, use exponential backoff
4. **Cache results** - Enable caching in config for reads
5. **Lazy load** - Fetch data only when needed

## Testing

```javascript
// Test data layer directly
import DataLayer from '$lib/api/DataLayer';

describe('DataLayer', () => {
  it('should fetch products', async () => {
    const result = await DataLayer.products.getAll();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data.products)).toBe(true);
  });
});
```

## File Locations

- Core: `src/api/DataLayer.js`
- Config: `src/config/dataLayerConfig.js`
- Hooks: `src/lib/hooks/useDataLayer.js`
- Examples: `src/components/examples/`
- Guides: `DATA_LAYER_GUIDE.md`, `MIGRATION_CHECKLIST.md`

---

**Last Updated**: Generated for bulletproof data operations
**Status**: Production Ready
**Version**: 1.0.0
- [ ] RLS policies allow service role bypass

See: [FIXES_APPLIED_SUMMARY.md](FIXES_APPLIED_SUMMARY.md)

---

## 📁 KEY FILES

### Most Important
```
server/
├── index.js               ← Server entry point
├── middleware.js          ← JWT verification
├── vendor.js              ← Vendor endpoints ⭐
└── onboarding.js          ← Seller signup

src/
├── contexts/SupabaseAuthContext.jsx    ← Auth state
├── components/ProtectedRoute.jsx       ← Route guard
├── lib/routerConfig.jsx                ← Routes
└── pages/vendor/
    ├── Index.jsx          ← Layout
    ├── Dashboard.jsx      ← Main dashboard
    ├── Products.jsx       ← Product management
    └── Orders.jsx         ← Order management
```

### Database
```
supabase_migrations/
├── ... initial schema
└── fix_vendors_rls.sql    ← RLS policies ⭐
```

---

## 🧪 TEST THESE FLOWS

### 1. Seller Onboarding
```
Sign Up → Become Seller → Fill Form → Check Dashboard
Expected: /dashboard/vendor loads, role = vendor
```

### 2. Vendor Orders
```
Login as vendor → /dashboard/vendor/orders → Click order
Expected: See order details, can fulfill/cancel
```

### 3. Payment (if testing)
```
Buy product → Checkout → PayPal → Confirm → Vendor sees order
Expected: Order in vendor dashboard with correct status
```

---

## 🚨 COMMON ERRORS & FIXES

### "Cannot find module 'vendor.js'"
✅ **Fixed** - File created at `server/vendor.js`

### "Failed to load url /src/pages/Dashboardpage.jsx"
✅ **Fixed** - Import path corrected in `routerConfig.jsx`

### "permission denied for schema public"
→ Run: `node scripts/apply-rls-policies.js`  
→ Guide: [RLS_FIX_GUIDE.md](RLS_FIX_GUIDE.md)

### "401 Unauthorized on /api/vendor/*"
→ Check: JWT in request headers (DevTools → Network)  
→ Fix: Ensure `Authorization: Bearer TOKEN` header

### "Supabase connection failed"
→ Check: `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`  
→ Test: `node scripts/diagnose-service-role.js`

---

## 🚀 DEPLOYMENT CHECKLIST

```bash
# 1. Build locally
npm run build           # ✅ No errors

# 2. Set Render env vars
# Go to: https://dashboard.render.com
# Set: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, etc.

# 3. Push to main
git add .
git commit -m "fix: description"
git push origin main

# 4. Monitor deployment
# Watch: https://dashboard.render.com build logs

# 5. Test live domain
# Visit: https://YOUR_DOMAIN.onrender.com
# Check: No console errors, features work
```

See: [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)

---

## 📊 ENDPOINTS REFERENCE

### Vendor Orders (All require JWT)
```
GET    /api/vendor/orders
GET    /api/vendor/orders/:id
POST   /api/vendor/orders/:id/fulfill
POST   /api/vendor/orders/:id/cancel
POST   /api/vendor/orders/:id/tracking
GET    /api/vendor/orders/analytics
GET    /api/vendor/products/top
```

### Authentication
```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me
```

### Products
```
GET    /api/products?vendor_id=X
POST   /api/products           (vendor only)
PATCH  /api/products/:id       (owner only)
DELETE /api/products/:id       (owner only)
```

### Orders
```
GET    /api/orders             (buyer's orders)
POST   /api/orders             (create order)
GET    /api/orders/:id         (order details)
```

See: [BASELINE_IMPLEMENTATION_GUIDE.md](BASELINE_IMPLEMENTATION_GUIDE.md#-detailed-implementation-areas)

---

## 🔧 USEFUL SCRIPTS

```bash
# Diagnose backend access to database
node scripts/diagnose-service-role.js

# Apply RLS fixes
node scripts/apply-rls-policies.js

# Run migrations
node scripts/apply_migrations.js

# Check products table
node scripts/check-products.js

# Test Supabase connection
node scripts/test-supabase.js

# Create test user
node scripts/create_test_user.js
```

---

## 📖 DOCUMENTATION QUICK LINKS

| Need | Link |
|------|------|
| System overview | [BASELINE_IMPLEMENTATION_GUIDE.md](BASELINE_IMPLEMENTATION_GUIDE.md) |
| All docs | [MASTER_DOCUMENTATION_INDEX.md](MASTER_DOCUMENTATION_INDEX.md) |
| Fix build | [BUILD_ISSUES_FIXED.md](BUILD_ISSUES_FIXED.md) |
| Fix database | [RLS_FIX_GUIDE.md](RLS_FIX_GUIDE.md) |
| Deploy | [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) |
| Feature check | [FUNCTIONALITY_ALIGNMENT_CHECKLIST.md](FUNCTIONALITY_ALIGNMENT_CHECKLIST.md) |
| Setup | [DEV_SETUP.md](DEV_SETUP.md) |

---

## 🎯 BEFORE COMMITTING CODE

```bash
# 1. Test build
npm run build

# 2. Check linting (if configured)
npm run lint

# 3. Test locally
npm run dev:all &
# ... test features ...

# 4. Check for secrets
# Make sure .env is in .gitignore
git status | grep ".env"  # Should be empty

# 5. Commit with clear message
git add .
git commit -m "feat: add new feature" 
# or
git commit -m "fix: resolve issue"

# 6. Push
git push origin BRANCH_NAME
```

---

## 💡 HELPFUL TIPS

### View Supabase Live
https://app.supabase.com/project/YOUR_PROJECT_ID

### View Backend Logs
```bash
# See real-time logs while server runs
npm run dev:all 2>&1 | grep "0]"
```

### View Network Requests
DevTools → Network tab → Preserve logs → Make request

### Check JWT Contents
Paste token at https://jwt.io (don't use sensitive tokens online)

### Test Endpoint Quickly
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/vendor/orders
```

---

## ⏱️ COMMON TIME ESTIMATES

| Task | Time |
|------|------|
| Setup dev environment | 15 min |
| Build & verify | 5 min |
| Test seller flow | 10 min |
| Fix build error | 5-15 min |
| Fix DB permission | 10-20 min |
| Deploy to Render | 10 min |
| Debug API issue | 5-20 min |

---

## 🎓 FIRST TIME SETUP

```bash
# 1. Clone (if not already)
git clone <URL>
cd skn-main-standalone

# 2. Install (one time)
npm install

# 3. Copy env files
cp .env.example .env
cp server/.env.example server/.env

# 4. Fill in values (get from Supabase, PayPal)
# Edit .env and server/.env

# 5. Start dev
npm run dev:all

# 6. Test
# Go to http://localhost:3000
# Try signup → become seller → dashboard
```

**Total time**: ~20 minutes

---

## 📞 WHEN STUCK

1. **Check this card** ↑ (you're reading it!)
2. **Check relevant guide** (see Documentation Quick Links)
3. **Search repo for error** (grep or GitHub search)
4. **Check console/logs** (DevTools, server output)
5. **Ask in issues** (if a team project)

**Most issues** are covered in:
- [BUILD_ISSUES_FIXED.md](BUILD_ISSUES_FIXED.md)
- [RLS_FIX_GUIDE.md](RLS_FIX_GUIDE.md)
- [SERVICE_ROLE_GUIDE.md](SERVICE_ROLE_GUIDE.md)

---

**Print or Bookmark This Page**  
**Status**: ✅ Current as of December 30, 2025


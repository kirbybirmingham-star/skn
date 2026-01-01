# SETUP & INTEGRATION GUIDE

## Installation & Setup

### Step 1: Verify Files Exist ✅

All files should be created in these locations:

```
src/
├── api/
│   └── DataLayer.js                    ✅ Core operations (600+ lines)
├── config/
│   └── dataLayerConfig.js              ✅ Configuration
├── lib/
│   ├── hooks/
│   │   └── useDataLayer.js             ✅ Svelte hooks (400+ lines)
│   └── validation/
│       └── schemas.js                  ✅ Validation schemas
└── components/
    └── examples/
        ├── ProductListingExample.svelte ✅ Fetch example
        ├── ProductCreationExample.svelte ✅ Create example
        └── VendorOrdersExample.svelte    ✅ Orders example

Documentation/
├── BULLETPROOF_DATA_LAYER_SUMMARY.md   ✅ Complete overview
├── DATA_LAYER_GUIDE.md                 ✅ Comprehensive guide
├── MIGRATION_CHECKLIST.md              ✅ Step-by-step migration
├── QUICK_REFERENCE.md                  ✅ Quick lookup
└── SETUP_INTEGRATION_GUIDE.md          ✅ This file
```

Verify all files exist:
```bash
ls -la src/api/DataLayer.js
ls -la src/config/dataLayerConfig.js
ls -la src/lib/hooks/useDataLayer.js
ls -la src/lib/validation/schemas.js
```

### Step 2: Update Configuration

Edit `src/config/dataLayerConfig.js` to match your environment:

```javascript
// Development
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:5173/api'
  : 'https://your-production-url.com/api';

// Production
const API_BASE_URL = 'https://your-render-url.onrender.com/api';
```

### Step 3: Verify Supabase Client

Ensure `src/lib/customSupabaseClient.js` exists and exports:

```javascript
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Step 4: Test Import

Create a test file to verify everything works:

```javascript
// test-imports.js
import DataLayer from '$lib/api/DataLayer';
import { createProductsStore } from '$lib/hooks/useDataLayer';
import { validateData, productSchema } from '$lib/validation/schemas';

console.log('✅ DataLayer imported:', typeof DataLayer);
console.log('✅ Hooks imported:', typeof createProductsStore);
console.log('✅ Schemas imported:', typeof validateData);
```

Run: `node test-imports.js`

## Quick Start Examples

### Example 1: Fetch and Display Products

```svelte
<script>
  import { onMount } from 'svelte';
  import { createProductsStore } from '$lib/hooks/useDataLayer';

  const products = createProductsStore();

  onMount(() => {
    // Fetch products on component mount
    products.fetch();
  });
</script>

<div>
  {#if $products.loading}
    <p>Loading products...</p>
  {:else if $products.hasError}
    <p>Error: {$products.error}</p>
  {:else if $products.data?.products}
    {#each $products.data.products as product (product.id)}
      <div>
        <h3>{product.title}</h3>
        <p>${product.base_price}</p>
      </div>
    {/each}
  {/if}
</div>
```

### Example 2: Create Product with Validation

```svelte
<script>
  import { useCreateProduct } from '$lib/hooks/useDataLayer';
  import { validateData, productSchema } from '$lib/validation/schemas';

  const { create, loading } = useCreateProduct();

  let formData = {
    title: '',
    description: '',
    base_price: '',
    category_id: 'electronics',
    inventory_quantity: 0
  };

  let errors = {};

  async function handleSubmit(e) {
    e.preventDefault();

    // Validate locally
    const { isValid, errors: validationErrors } = validateData(formData, productSchema);
    if (!isValid) {
      errors = validationErrors;
      return;
    }

    // Submit via data layer
    const result = await create({
      ...formData,
      base_price: Number(formData.base_price),
      inventory_quantity: Number(formData.inventory_quantity)
    });

    if (result.success) {
      // Form submitted successfully
      formData = { title: '', description: '', base_price: '', ... };
    }
  }
</script>

<form on:submit={handleSubmit}>
  <input bind:value={formData.title} placeholder="Product title" />
  {#if errors.title}
    <span class="error">{errors.title}</span>
  {/if}

  <input bind:value={formData.description} placeholder="Description" />
  {#if errors.description}
    <span class="error">{errors.description}</span>
  {/if}

  <button disabled={$loading}>
    {$loading ? 'Creating...' : 'Create Product'}
  </button>
</form>
```

### Example 3: Update and Delete

```svelte
<script>
  import { createProductStore } from '$lib/hooks/useDataLayer';

  export let productId;

  const product = createProductStore(productId);

  onMount(() => product.fetch());

  async function handleUpdate(updatedData) {
    const result = await product.update(updatedData);
    if (result.success) {
      // Success - notification shown automatically
    }
  }

  async function handleDelete() {
    if (confirm('Delete this product?')) {
      const result = await product.delete();
      if (result.success) {
        // Navigate away or update UI
      }
    }
  }
</script>

<div>
  {#if $product.loading && !$product.loaded}
    Loading...
  {:else if $product.hasError}
    Error: {$product.error}
  {:else if $product.data}
    <h1>{$product.data.title}</h1>
    <button on:click={() => handleUpdate({ title: 'New title' })}>
      Update
    </button>
    <button on:click={handleDelete}>Delete</button>
  {/if}
</div>
```

## Integration with Existing Components

### Step 1: Identify Components to Migrate

List your main components:
- [ ] Product list/search
- [ ] Product detail
- [ ] Product form
- [ ] Vendor dashboard
- [ ] Order list
- [ ] etc.

### Step 2: Migrate One Component

Pick the simplest one first. Example - ProductList:

**BEFORE**:
```svelte
<script>
  let products = [];
  let loading = true;

  onMount(async () => {
    const res = await fetch('/api/products');
    products = await res.json();
    loading = false;
  });
</script>
```

**AFTER**:
```svelte
<script>
  import { createProductsStore } from '$lib/hooks/useDataLayer';
  const products = createProductsStore();
  
  onMount(() => products.fetch());
</script>
```

### Step 3: Test in Browser

1. Start dev server: `npm run dev`
2. Open component in browser
3. Check browser console for `[DataLayer]` logs
4. Verify data loads correctly
5. Check no errors

### Step 4: Update Other References

If other components imported from this one, update them too:

```javascript
// OLD: Getting data from store
export const productsStore = writable([]);

// NEW: Get from DataLayer directly
import { createProductsStore } from '$lib/hooks/useDataLayer';
export const products = createProductsStore();
```

### Step 5: Repeat for All Components

Follow MIGRATION_CHECKLIST.md for complete list.

## Testing

### Unit Test Example

```javascript
// src/__tests__/DataLayer.test.js
import { describe, it, expect } from 'vitest';
import DataLayer from '$lib/api/DataLayer';

describe('DataLayer', () => {
  it('should fetch products successfully', async () => {
    const result = await DataLayer.products.getAll();
    expect(result.success).toBe(true);
    expect(Array.isArray(result.data.products)).toBe(true);
  });

  it('should validate product data', () => {
    const { valid, errors } = DataLayer.validate(
      { title: '' },
      'product'
    );
    expect(valid).toBe(false);
    expect(errors.length > 0).toBe(true);
  });
});
```

Run: `npm run test`

### Component Test Example

```svelte
<script>
  import { render } from '@testing-library/svelte';
  import ProductList from './ProductList.svelte';

  describe('ProductList', () => {
    it('should display products', async () => {
      const { getByText } = render(ProductList);
      // Wait for data to load
      await new Promise(r => setTimeout(r, 100));
      expect(getByText(/product name/i)).toBeInTheDocument();
    });
  });
</script>
```

## Debugging

### Enable Full Logging

In `src/api/DataLayer.js`, ensure console.log calls are active:

```javascript
console.log(`[DataLayer API] ${method} ${url}`);
console.error('[DataLayer] Error:', error);
```

### Check Browser Console

Look for `[DataLayer]` prefixed messages:

```
[DataLayer] GET /products
[DataLayer API] Attempt 1/3
[DataLayer] Products.getAll failed: Network error
```

### Test Individual Operations

```javascript
// In browser console
import DataLayer from '$lib/api/DataLayer';

// Test fetch
const result = await DataLayer.products.getAll();
console.log(result);

// Test validation
const { valid, errors } = DataLayer.validate({ title: '' }, 'product');
console.log(errors);
```

## Performance Optimization

### 1. Use Caching

```javascript
const products = createProductsStore();
await products.fetch(); // Cached for 5 minutes
await products.fetch(); // Uses cache
```

### 2. Batch Operations

```javascript
const { execute } = useBatch();
const result = await execute([
  { name: 'products', execute: () => DataLayer.products.getAll() },
  { name: 'vendors', execute: () => DataLayer.vendors.getAll() }
]);
```

### 3. Lazy Load Data

```svelte
<script>
  const products = createProductsStore();
  
  // Only fetch when needed
  function loadProducts() {
    products.fetch();
  }
</script>

<button on:click={loadProducts}>Load Products</button>
```

## Troubleshooting

### Issue: "User must be logged in"

**Cause**: User is not authenticated
**Fix**: Check that user is signed in before calling operations
```javascript
const user = await getCurrentUser();
if (!user) {
  // Show login screen
}
```

### Issue: "You do not have permission"

**Cause**: User doesn't own the resource
**Fix**: Verify user owns the resource before updating
```javascript
const isOwner = await checkProductOwnership(productId, userId);
if (!isOwner) {
  // Show error
}
```

### Issue: "Validation failed"

**Cause**: Data doesn't match validation rules
**Fix**: Check validation errors
```javascript
const result = await create(data);
if (!result.success) {
  console.log(result.error.details.errors);
}
```

### Issue: "Network connection failed"

**Cause**: No internet or backend not running
**Fix**: Check network and backend status
```bash
# Check backend
curl http://localhost:3001/api/health

# Check network
ping 8.8.8.8
```

### Issue: CORS errors

**Cause**: Backend not configured for CORS
**Fix**: Check backend CORS configuration
```javascript
// In server/index.js or backend
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

## Migration Status

Track your progress:

```
✅ Setup Phase
├─ [x] Files created
├─ [x] Configuration done
├─ [x] Imports working
└─ [x] Tests passing

🔄 Component Migration
├─ [ ] ProductList
├─ [ ] ProductForm
├─ [ ] ProductDetail
├─ [ ] VendorDashboard
├─ [ ] OrderList
└─ [ ] OtherComponent

📊 Progress: 0/15 components
```

## Final Checklist

Before going to production:

- [ ] All components migrated
- [ ] All tests passing
- [ ] No console errors
- [ ] All operations tested manually
- [ ] Error messages clear and helpful
- [ ] Loading states show correctly
- [ ] Success notifications appear
- [ ] Performance acceptable
- [ ] Code review approved
- [ ] Documentation complete

## Support

For issues or questions:

1. **Check logs**: Look at `[DataLayer]` logs in console
2. **Review examples**: See example components
3. **Check docs**: Read DATA_LAYER_GUIDE.md
4. **Test directly**: Use browser console to test operations
5. **Debug**: Follow Debugging section above

---

## Next Steps

1. ✅ **Verify setup**: Check all files exist
2. ✅ **Configure**: Update dataLayerConfig.js
3. ⏭️ **Implement**: Start migrating components (MIGRATION_CHECKLIST.md)
4. ⏭️ **Test**: Verify each component works
5. ⏭️ **Deploy**: Push to production with confidence

**Ready to start? Pick your first component and follow MIGRATION_CHECKLIST.md!**

# BULLETPROOF DATA LAYER IMPLEMENTATION

## Overview

A unified, bulletproof data layer that ensures all fetch and update operations work flawlessly regardless of future changes to the app. This system provides:

- **Single Source of Truth**: All data operations go through centralized functions
- **Automatic Validation**: Data is validated before being sent to the backend
- **Consistent Responses**: All operations return the same standardized response format
- **Built-in Error Handling**: Comprehensive error handling with user-friendly messages
- **Authorization Checks**: Ownership verification before allowing updates/deletes
- **Complete Logging**: Full audit trail for debugging
- **Reactive Integration**: Svelte stores for seamless component integration

## Architecture

```
DataLayer.js (Core operations)
├── Products: getAll, getById, create, update, delete
├── Vendors: getAll, getByOwner, update
├── Orders: getVendorOrders, fulfill, cancel
├── Inventory: update
└── Utilities: validate, createResponse, executeBatch, executeWithRetry

dataLayerConfig.js (Configuration)
├── API endpoints
├── Validation rules
├── Error/success messages
├── Rate limiting
└── Caching settings

useDataLayer.js (Svelte Integration)
├── Stores: notification, data stores
├── Hooks: createDataStore, useCreateProduct, useOrderFulfillment, etc.
└── Utilities: showNotification, success, error, info
```

## Key Features

### 1. Standardized Response Format

All operations return:
```javascript
{
  success: boolean,
  data: any,
  error: { message, code, details },
  metadata: { timestamp, ... }
}
```

### 2. Automatic Validation

Data is validated against predefined rules before sending:
- String length constraints
- Number ranges
- Type checking
- Enum validation

### 3. Authorization Checks

All sensitive operations verify:
- User is logged in
- User owns the resource
- User has appropriate permissions

### 4. Error Handling

- Network errors handled gracefully
- Server errors caught and formatted
- User-friendly error messages
- Detailed logging for debugging

### 5. Retry Logic

Automatic retry with exponential backoff:
```javascript
await executeWithRetry(operation, maxRetries = 3, baseDelay = 1000);
```

## Usage Examples

### In Svelte Components

#### Fetch and Display Products
```svelte
<script>
  import { createProductsStore } from '$lib/hooks/useDataLayer';
  
  const products = createProductsStore({ categoryId: 'electronics' });
  
  onMount(() => products.fetch());
</script>

{#if $products.loading}
  Loading...
{:else if $products.hasError}
  <p>{$products.error}</p>
{:else}
  {#each $products.data?.products || [] as product}
    <ProductCard {product} />
  {/each}
{/if}
```

#### Create Product
```svelte
<script>
  import { useCreateProduct } from '$lib/hooks/useDataLayer';
  
  const { create, loading } = useCreateProduct();
  
  async function handleSubmit(formData) {
    const result = await create(formData);
    if (result.success) {
      // Product created, result.data contains new product
    }
  }
</script>

<form on:submit={handleSubmit}>
  <!-- form fields -->
  <button disabled={$loading}>Create Product</button>
</form>
```

#### Update Product
```svelte
<script>
  import { createProductStore } from '$lib/hooks/useDataLayer';
  
  export let productId;
  const product = createProductStore(productId);
  
  onMount(() => product.fetch());
  
  async function handleUpdate(data) {
    const result = await product.update(data);
    // Product updated, notification shown automatically
  }
</script>
```

#### Vendor Orders
```svelte
<script>
  import { createOrdersStore, useOrderFulfillment } from '$lib/hooks/useDataLayer';
  
  const orders = createOrdersStore();
  const { fulfill, cancel } = useOrderFulfillment();
  
  onMount(() => orders.fetch());
  
  async function handleFulfill(orderId) {
    const result = await fulfill(orderId);
    if (result.success) {
      // Refresh orders after fulfilling
      orders.refresh();
    }
  }
</script>
```

### Direct API Usage

```javascript
import DataLayer from '$lib/api/DataLayer';

// Fetch products
const result = await DataLayer.products.getAll({ categoryId: 'electronics' });
if (result.success) {
  console.log(result.data.products);
} else {
  console.error(result.error.message);
}

// Create product
const createResult = await DataLayer.products.create({
  title: 'New Product',
  description: 'Product description',
  base_price: 99.99,
  category_id: 'electronics',
  vendor_id: 'vendor-123'
});

// Update product
const updateResult = await DataLayer.products.update('product-123', {
  title: 'Updated Title',
  base_price: 89.99
});

// With retry logic
const result = await executeWithRetry(
  () => DataLayer.products.getAll(),
  3,
  1000
);
```

## Migration Guide

### Step 1: Replace all fetch calls

**BEFORE**:
```javascript
const response = await fetch('/api/products');
const data = await response.json();
```

**AFTER**:
```javascript
const result = await DataLayer.products.getAll();
if (result.success) {
  const data = result.data;
}
```

### Step 2: Update Svelte components

**BEFORE**:
```svelte
<script>
  let products = [];
  let loading = true;
  
  onMount(async () => {
    const response = await fetch('/api/products');
    products = await response.json();
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

{#if $products.loading}
  Loading...
{:else if $products.hasError}
  Error: {$products.error}
{:else}
  <!-- Use $products.data -->
{/if}
```

### Step 3: Replace form submissions

**BEFORE**:
```javascript
const response = await fetch('/api/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formData)
});
```

**AFTER**:
```javascript
const result = await DataLayer.products.create(formData);
if (result.success) {
  // Success - notification shown automatically
  console.log(result.data);
}
```

## Error Handling

All errors follow a consistent format:

```javascript
{
  success: false,
  error: {
    message: "User-friendly error message",
    code: "ERROR_CODE",
    details: { /* original error */ }
  }
}
```

Automatic notifications are shown for all errors, or manually show:

```javascript
import { error, success, info } from '$lib/hooks/useDataLayer';

error('Something went wrong');
success('Operation completed!');
info('Please wait...');
```

## Validation Rules

Edit validation rules in `dataLayerConfig.js`:

```javascript
export const VALIDATION_RULES = {
  product: {
    title: { required: true, min: 3, max: 255 },
    base_price: { required: true, min: 0.01, type: 'number' }
  }
};
```

Validation happens automatically in create/update operations.

## Advanced Features

### Batch Operations

Execute multiple operations with error tracking:

```javascript
const { execute } = useBatch();

const result = await execute([
  { name: 'product1', execute: () => DataLayer.products.getAll() },
  { name: 'product2', execute: () => DataLayer.products.getById('123'), stopOnError: true }
]);

// result.data.results contains results of each operation
// result.data.errors contains any failures
```

### Retry with Exponential Backoff

```javascript
const result = await executeWithRetry(
  () => DataLayer.products.getAll(),
  maxRetries = 3,
  baseDelay = 1000
);
// Retries at 1s, 2s, 4s delays
```

## Best Practices

1. **Always check result.success** before accessing result.data
2. **Use Svelte stores** for component-level data management
3. **Leverage automatic notifications** - don't manually show success messages
4. **Validate data before sending** - validation rules are comprehensive
5. **Use ownership checks** - authorization is automatic for products/vendors
6. **Batch related operations** when possible
7. **Handle errors gracefully** - show user-friendly messages

## Configuration

All configuration in `src/config/dataLayerConfig.js`:

- API endpoints
- Validation rules
- Error/success messages
- Rate limits
- Cache settings

Change these values to customize behavior across the entire app.

## Debugging

Enable detailed logging by checking browser console:

```
[DataLayer] GET /products
[DataLayer API] Attempt 1/3
[DataLayer] Validators.getByOwner failed: User must be logged in
```

All operations log their status for easy debugging.

## FAQ

**Q: Can I use the data layer without Svelte stores?**
A: Yes, call DataLayer methods directly. They return Promises that resolve to standardized responses.

**Q: What if I need custom validation?**
A: Add rules to VALIDATION_RULES in dataLayerConfig.js, or override in individual operations.

**Q: How do I add a new data operation?**
A: Add to DataLayer.js following the existing pattern - validate, authorize, execute, handle errors.

**Q: Will this break existing code?**
A: Yes, you need to migrate components to use the new layer. Start with most-used components.

**Q: How do I debug failed operations?**
A: Check browser console for [DataLayer] logs and inspect the error object in the response.

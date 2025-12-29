# Using the Database Debug Hook in Components

## Quick Start

```javascript
import { useDatabaseDebug } from '@/hooks/useDatabaseDebug';

function MyComponent() {
  const db = useDatabaseDebug();
  
  const result = await db.update('table', id, data);
}
```

## The Hook API

```javascript
const db = useDatabaseDebug();

// SELECT
await db.select(table, options);

// INSERT  
await db.insert(table, data, options);

// UPDATE
await db.update(table, id, updates, options);

// DELETE
await db.delete(table, id, options);
```

## Basic Examples

### 1. Simple Update

```javascript
import { useDatabaseDebug } from '@/hooks/useDatabaseDebug';
import { useToast } from '@/components/ui/use-toast';

function ProductForm() {
  const db = useDatabaseDebug();
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      await db.update('products', productId, {
        title: form.title,
        price: Number(form.price)
      });
      toast({ title: 'Saved' });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### 2. Insert with Validation

```javascript
async function createProduct(data) {
  const db = useDatabaseDebug();
  const { toast } = useToast();

  try {
    if (!data.title || data.title.length < 3) {
      toast({ 
        title: 'Validation Error', 
        description: 'Title too short',
        variant: 'destructive'
      });
      return;
    }

    const result = await db.insert('products', {
      title: data.title.trim(),
      vendor_id: data.vendorId,
      base_price: Number(data.price) || 0
    }, {
      context: 'product-creation-form'
    });

    toast({ title: 'Product created' });
    return result;
  } catch (error) {
    toast({
      title: 'Creation failed',
      description: error.message,
      variant: 'destructive'
    });
  }
}
```

### 3. Load and Filter

```javascript
async function loadVendorProducts(vendorId) {
  const db = useDatabaseDebug();

  const products = await db.select('products', {
    filters: [['vendor_id', vendorId]],
    orderBy: ['created_at', true],
    limit: 50,
    context: `load-products-for-vendor-${vendorId}`
  });

  return products;
}
```

### 4. Bulk Operations

```javascript
async function updateMultipleProducts(updates) {
  const db = useDatabaseDebug();
  const results = { success: 0, failed: 0 };

  for (const { id, data } of updates) {
    try {
      await db.update('products', id, data, {
        context: `bulk-update-${id}`
      });
      results.success++;
    } catch (error) {
      results.failed++;
      console.error(`Failed to update ${id}:`, error);
    }
  }

  return results;
}
```

### 5. Delete with Confirmation

```javascript
async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"?`)) return;

  const db = useDatabaseDebug();
  const { toast } = useToast();

  try {
    await db.delete('products', id, {
      context: `delete-product-${id}`
    });
    toast({ title: 'Deleted' });
  } catch (error) {
    toast({
      title: 'Delete failed',
      description: error.message,
      variant: 'destructive'
    });
  }
}
```

## Options Parameter

The 4th parameter lets you add context:

```javascript
await db.update(
  'products',
  id,
  updates,
  {
    context: 'product-edit-form',  // Where this came from
    idField: 'id'                   // Primary key field (default: 'id')
  }
)
```

### Context Examples

- `'product-form-submit'` - Product edit form
- `'admin-bulk-update'` - Admin panel bulk operation
- `'vendor-dashboard-update'` - Vendor dashboard
- `'checkout-inventory-update'` - Checkout process
- `'order-status-change'` - Order status update

## What Gets Logged Automatically

For every operation, the hook logs:

✅ **Operation type** - INSERT, UPDATE, DELETE, SELECT
✅ **Table name** - Which table
✅ **Record ID** - Which record(s)
✅ **Payload sent** - Exact data you sent
✅ **Payload received** - What came back
✅ **Before/after** - What changed (for updates)
✅ **Duration** - How long it took
✅ **Error details** - If something went wrong
✅ **Timestamp** - When it happened
✅ **Context** - Where it came from

## Viewing Logs

All operations are automatically visible:

1. **Admin Console**: Go to `/admin` → Database Debug Console
2. **Browser Console**: 
   ```javascript
   getDebugLogs()
   getDebugLogs({ status: 'failed' })
   ```

## Error Handling

The hook throws errors just like normal Supabase calls:

```javascript
try {
  await db.update('products', id, updates);
} catch (error) {
  console.error('Update failed:', error.message);
  // Error is also logged to admin console
}
```

## Common Patterns

### Pattern 1: Form Submit Handler

```javascript
const handleFormSubmit = async (formData) => {
  try {
    const updates = {
      title: formData.title?.trim(),
      description: formData.description?.trim(),
      price: Number(formData.price) || 0
    };

    await db.update('products', productId, updates, {
      context: 'product-form-submit'
    });

    toast({ title: 'Saved successfully' });
  } catch (error) {
    toast({
      title: 'Save failed',
      description: error.message,
      variant: 'destructive'
    });
  }
};
```

### Pattern 2: Load Data on Mount

```javascript
useEffect(() => {
  const loadData = async () => {
    const products = await db.select('products', {
      filters: [['vendor_id', vendorId]],
      context: `load-vendor-products-${vendorId}`
    });
    setProducts(products);
  };

  loadData();
}, [vendorId]);
```

### Pattern 3: Batch Operations

```javascript
const processBatch = async (items) => {
  const results = [];

  for (const item of items) {
    try {
      const result = await db.update('products', item.id, item.data, {
        context: `batch-process-${item.id}`
      });
      results.push({ id: item.id, success: true });
    } catch (error) {
      results.push({ id: item.id, success: false, error: error.message });
    }
  }

  return results;
};
```

### Pattern 4: Conditional Updates

```javascript
const smartUpdate = async (productId, changes) => {
  // Only include fields that actually changed
  const updates = {};
  
  if (changes.title) updates.title = changes.title.trim();
  if (changes.price) updates.price = Number(changes.price);
  if (changes.description) updates.description = changes.description.trim();

  if (Object.keys(updates).length === 0) {
    toast({ title: 'No changes to save' });
    return;
  }

  await db.update('products', productId, updates, {
    context: 'smart-update'
  });

  toast({ title: 'Saved' });
};
```

## Debugging Tips

### Tip 1: Check the Admin Console

After any operation, go to `/admin` and look for it in the Database Debug Console.

### Tip 2: Use Descriptive Context

```javascript
// ❌ Generic
await db.update('products', id, data);

// ✅ Descriptive
await db.update('products', id, data, {
  context: 'product-form-submit-from-vendor-dashboard'
});
```

### Tip 3: Log Results

```javascript
const result = await db.update('products', id, updates);
console.log('Updated product:', result);
// You can see what came back from the database
```

### Tip 4: Check for Undefined Values

The hook automatically warns about undefined/null values:

```javascript
// ❌ Will warn
await db.update('products', id, {
  title: undefined,  // ⚠️ Won't be sent
  price: null        // ⚠️ Will be sent as null
});

// ✅ Better
const updates = {};
if (title) updates.title = title;
if (price) updates.price = price;
await db.update('products', id, updates);
```

## Integration into Existing Components

### Before (without debug hook):
```javascript
const updated = await updateProduct(id, data);
```

### After (with debug hook):
```javascript
const db = useDatabaseDebug();
const updated = await db.update('products', id, data, {
  context: 'my-form-name'
});
```

That's it! No other changes needed. The hook handles all the logging automatically.

## Real-World Example: Product Edit Component

```javascript
import React, { useState } from 'react';
import { useDatabaseDebug } from '@/hooks/useDatabaseDebug';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

function ProductEditForm({ product, onSave }) {
  const db = useDatabaseDebug();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: product.title,
    description: product.description,
    price: product.base_price / 100
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title || form.title.length < 3) {
      toast({
        title: 'Validation Error',
        description: 'Title must be at least 3 characters',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const updates = {
        title: form.title.trim(),
        description: form.description.trim(),
        base_price: Math.round(Number(form.price) * 100) || 0
      };

      const updated = await db.update(
        'products',
        product.id,
        updates,
        {
          context: `product-edit-form-${product.id}`
        }
      );

      toast({
        title: 'Success',
        description: 'Product updated successfully'
      });

      onSave(updated);

    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update: ${error.message}`,
        variant: 'destructive'
      });

      // Debug info
      console.log('Update failed. Check /admin console for details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Title</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </div>

      <div>
        <label>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div>
        <label>Price ($)</label>
        <input
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Product'}
      </Button>

      <p className="text-xs text-gray-500">
        💡 All changes are logged. Check <code>/admin</code> to see details.
      </p>
    </form>
  );
}

export default ProductEditForm;
```

## Summary

✅ Import the hook: `import { useDatabaseDebug } from '@/hooks/useDatabaseDebug'`
✅ Call it: `const db = useDatabaseDebug()`
✅ Use it: `await db.update('table', id, data, { context: 'my-context' })`
✅ View logs: Go to `/admin` or check browser console

That's all you need to debug database operations! All logging happens automatically.

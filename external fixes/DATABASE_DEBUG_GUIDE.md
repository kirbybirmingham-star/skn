# Database Debug Helper - Usage Guide

## Overview

The Database Debug Helper provides comprehensive logging and debugging capabilities for all database operations. It helps identify issues with updates, mutations, data inconsistencies, and payload problems.

## Features

✅ **Automatic Logging**: All database operations are logged with full details
✅ **Before/After Comparison**: See exactly what changed in each update
✅ **Payload Validation**: Automatically detects and warns about undefined values
✅ **Performance Tracking**: Monitor operation duration and identify slow queries
✅ **Error Capture**: Detailed error logging for failed operations
✅ **Visual Console**: Admin panel includes a live debug console
✅ **Analysis Tools**: Generate reports and analyze patterns
✅ **Export**: Download logs as JSON for further analysis

## Usage

### Option 1: Direct Helper Functions (Development)

```javascript
import { logDatabaseOperation } from '@/lib/databaseDebugHelper';
import { debugUpdate, debugSelect, debugInsert, debugDelete } from '@/lib/databaseDebugHelper';

// Log an operation manually
logDatabaseOperation({
  table: 'products',
  method: 'update',
  id: 'product-123',
  payloadSent: { title: 'New Title' },
  payloadReceived: { id: 'product-123', title: 'New Title', updated_at: '...' },
  error: null,
  duration: 145,
  context: 'product-edit-form'
});

// Use wrapper functions
const data = await debugUpdate('products', productId, { title: 'New Title' }, {
  context: 'edit-product-form'
});

const products = await debugSelect('products', {
  context: 'load-products',
  filters: [['vendor_id', vendorId, 'eq']],
  limit: 10
});

const newProduct = await debugInsert('products', productData, {
  context: 'create-product-form'
});

await debugDelete('products', productId, {
  context: 'delete-product-form'
});
```

### Option 2: React Hook (Recommended for Components)

```javascript
import { useDatabaseDebug } from '@/hooks/useDatabaseDebug';

function MyComponent() {
  const db = useDatabaseDebug();

  const handleUpdate = async () => {
    try {
      const updated = await db.update('products', id, {
        title: form.title,
        description: form.description
      }, {
        context: 'product-form-submit'
      });
      console.log('Updated:', updated);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <button onClick={handleUpdate}>Save Product</button>
  );
}
```

### Option 3: Admin Console

Access the debug console as an admin at `/admin`:

1. **Live Monitoring**: Console auto-refreshes and shows operations in real-time
2. **Filtering**: Filter by operation type (SELECT, INSERT, UPDATE, DELETE) or by status (success/errors)
3. **Expand Logs**: Click any log to see full details:
   - Payload sent to database
   - Payload received from database
   - Before/after comparison (for updates)
   - Error details
   - Operation duration
   - Context where operation was triggered

4. **Analysis**: Click "Analyze" to see:
   - Operation counts by type and table
   - Error rate and timing
   - Slow operations (>1000ms)
   - Payload issues
   - Success rates per table

5. **Export**: Download logs as JSON for offline analysis

6. **Clear**: Reset logs to start fresh

## Console Functions

Available in browser console for development:

```javascript
// Import in console (dev only)
import { getDebugLogs, analyzeDebugLogs, printDebugSummary, exportDebugLogs, clearDebugLogs } from '@/lib/databaseDebugHelper';

// Get all logs
const logs = getDebugLogs();

// Filter logs
const updateLogs = getDebugLogs({ method: 'update' });
const errorLogs = getDebugLogs({ status: 'failed' });
const recentLogs = getDebugLogs({ since: '2025-12-29T10:00:00Z' });

// Analyze patterns
const analysis = analyzeDebugLogs();
console.table(analysis);

// Print formatted summary
printDebugSummary();

// Export for analysis
const json = exportDebugLogs();
// Download or copy to file

// Clear logs
clearDebugLogs();
```

## Common Issues Detected

### 1. Undefined Values in Payload

❌ **Problem**: 
```javascript
{ image: 'https://...vendors/undefined/products/...' }
```

✅ **Detection**: Helper automatically warns:
```
⚠️  Field "image" contains string 'undefined': "https://...vendors/undefined/..."
```

### 2. Null Fields

❌ **Problem**:
```javascript
{ description: null, category: undefined }
```

✅ **Detection**: Helper logs warnings:
```
⚠️  Field "description" is null
⚠️  Field "category" is undefined - skipping
```

### 3. Type Mismatches

❌ **Problem**: Sending string when number expected
```javascript
{ price: "1250" }  // Should be: { price: 1250 }
```

✅ **Solution**: Use debugUpdate and it will show the exact mismatch

### 4. Slow Queries

❌ **Problem**: Database operation takes >1000ms
```
🐢 Slow Operations: 
  [2025-12-29T10:15:30Z] products.update: 2500ms
```

✅ **Solution**: Check the payload size and filters - optimize as needed

## Performance Monitoring

The debug helper tracks operation duration. Use this to identify:

- Slow batch operations
- Complex queries with many relations
- Deadlocks or timeouts
- Database bottlenecks

## Best Practices

1. **Add Context**: Always include context to know where operations come from
   ```javascript
   await debugUpdate(table, id, updates, {
     context: 'product-form-submit'
   });
   ```

2. **Use Hooks in Components**: Prefer `useDatabaseDebug()` hook in React components

3. **Check Admin Console**: Regularly check `/admin` for error patterns

4. **Export Logs**: Export logs periodically for analysis and archival

5. **Filter Before Update**: Validate data before sending:
   ```javascript
   const sanitized = sanitizePayload(formData);
   // Now safe to send to database
   ```

## Example: Debugging Product Update

### The Problem
Product updates returning 400 Bad Request with image URL containing "undefined"

### The Debug Process
1. Go to `/admin` in browser
2. Filter logs: Method = "update", Status = "errors"
3. Expand failed update logs
4. Look at "Payload Sent" - find the problematic field
5. Check "Context" to know which form triggered it
6. Compare with "Payload Received" to see if partial data was saved
7. Use the timestamp to correlate with your actions

### The Solution
Once you identify the issue (e.g., `vendors/undefined/` in image URL):

```javascript
// In your form submission
const updates = {
  title: form.title.trim(),
  price: Number(form.price) || 0,
  image: form.image && !form.image.includes('undefined') ? form.image : undefined
};

// Use debug helper with context
await debugUpdate('products', productId, updates, {
  context: 'product-edit-form-submit'
});
```

Check the admin console to verify the fix worked.

## Logging Policy

- **Development (`import.meta.env.DEV`)**: Full logging to console
- **Production**: No automatic console logging (but logs are still collected)
- **Admin Console**: Always available on `/admin` for authenticated admins
- **Storage**: Last 100 operations kept in memory
- **Export**: JSON format for external analysis

## Troubleshooting

### "Admin Panel not accessible"
- Ensure user has `role: 'admin'` in profiles table
- Check `user.user_metadata.role` in browser console

### "Database Debug Console not showing"
- Ensure you're logged in as admin
- Visit `/admin` page
- Check browser console for errors

### "Logs not appearing"
- Toggle "Live/Paused" button
- Filter to "all" to see any operations
- Ensure database operations are actually happening
- Check that you're not in a private browser window (localStorage limitation)

## Advanced: Custom Logging

Add custom logging to any operation:

```javascript
import { logDatabaseOperation } from '@/lib/databaseDebugHelper';

async function customDatabaseOperation() {
  const startTime = performance.now();
  
  try {
    const result = await myCustomDbQuery();
    
    logDatabaseOperation({
      table: 'custom_table',
      method: 'custom_query',
      payloadSent: { /* input */ },
      payloadReceived: result,
      duration: performance.now() - startTime,
      context: 'my-custom-operation'
    });
    
    return result;
  } catch (error) {
    logDatabaseOperation({
      table: 'custom_table',
      method: 'custom_query',
      error: error.message,
      duration: performance.now() - startTime,
      context: 'my-custom-operation'
    });
    throw error;
  }
}
```

## Support

For issues with the database debug helper:
1. Check the admin console at `/admin`
2. Export logs and examine the payload
3. Look for patterns in error messages
4. Check context field to correlate with user actions
5. Review before/after comparison for update operations

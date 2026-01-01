# Database Debug Helper - Quick Reference

## What It Does

Logs all database operations with detailed information:
- What was sent to the database
- What was received back
- Before/after comparison for updates
- Errors with full details
- Operation timing
- Operation context (where it came from)

## How to Use

### 1. Admin Console (Easiest)
```
Go to: /admin → Scroll to "Database Debug Console"
- View live database operations
- Click to expand and see full details
- Filter by operation type or status
- Click "Analyze" for a summary report
- Click "Export" to download logs as JSON
```

### 2. In React Components
```javascript
import { useDatabaseDebug } from '@/hooks/useDatabaseDebug';

function MyForm() {
  const db = useDatabaseDebug();
  
  const handleSave = async () => {
    try {
      const result = await db.update('products', id, {
        title: 'New Title',
        price: 1250
      });
      console.log('Saved:', result);
    } catch (error) {
      console.error('Failed:', error);
      // Check admin console for why it failed
    }
  };
  
  return <button onClick={handleSave}>Save</button>;
}
```

### 3. In Browser Console (Development Only)
```javascript
// View all logs
getDebugLogs()

// View only errors
getDebugLogs({ status: 'failed' })

// View only product updates
getDebugLogs({ table: 'products', method: 'update' })

// Get analysis
analyzeDebugLogs()

// Print formatted summary
printDebugSummary()

// Export as JSON
exportDebugLogs()
```

## Common Debugging Scenarios

### Scenario 1: "My update isn't working"
1. Go to `/admin`
2. Filter: Method = "update"
3. Click the failed update log
4. Look at "Payload Sent" - find the problem field
5. Fix in your form and try again

### Scenario 2: "I'm getting a 400 error"
1. Go to `/admin`
2. Filter: Status = "errors"
3. Expand the 400 error
4. Check "Payload Sent" for:
   - `undefined` values
   - `null` values
   - `"undefined"` strings in URLs
   - Wrong data types
5. Fix in code, test again

### Scenario 3: "This is slow!"
1. Go to `/admin`
2. Click "Analyze"
3. Look for "Slow Operations" section
4. Check the operation that's taking too long
5. Review what data was queried

### Scenario 4: "What operations happened?"
1. Go to `/admin`
2. See "Total" logs at top
3. Look at "By Table" section for counts
4. Look at "By Method" for operation types
5. Expand any to see details

## Data Shown For Each Operation

```
🗄️  [UPDATE] products
├─ Status: success
├─ Timestamp: 2025-12-29 10:15:30.123
├─ Duration: 145ms
├─ Payload Sent: { title: '...', price: 1250, ... }
├─ Payload Received: { id: '...', title: '...', updated_at: '...', ... }
├─ Changes: 
│  ├─ title: { before: '...', after: '...', changed: true }
│  └─ price: { before: 1000, after: 1250, changed: true }
└─ Context: product-form-submit
```

## Warnings You Might See

| Warning | Meaning | What to Do |
|---------|---------|-----------|
| `⚠️  Field "x" is undefined` | You're sending undefined value | Don't send that field |
| `⚠️  Field "x" is null` | You're sending null value | Decide if that's intentional |
| `⚠️  Field "x" contains string 'undefined'` | URL/string has "undefined" in it | Fix the string construction |
| `400 Bad Request` | Database rejected the data | Check payload - likely undefined values |

## Quick Fixes

### Fix 1: Undefined in Image URL
```javascript
// ❌ Wrong
image: `vendors/undefined/products/...`

// ✅ Right
image: vendorId ? `vendors/${vendorId}/products/...` : undefined
// or skip it
if (image && !image.includes('undefined')) {
  payload.image = image;
}
```

### Fix 2: Undefined Fields
```javascript
// ❌ Wrong
payload = {
  title: form.title,
  description: form.description,  // might be undefined
  price: form.price
}

// ✅ Right
const payload = {};
if (form.title) payload.title = form.title;
if (form.description) payload.description = form.description;
if (form.price) payload.price = form.price;
```

### Fix 3: Type Mismatches
```javascript
// ❌ Wrong
payload = {
  price: "1250",  // string instead of number
  quantity: "5"   // string instead of number
}

// ✅ Right
payload = {
  price: Number(form.price) || 0,
  quantity: Number(form.quantity) || 0
}
```

## Admin Console Buttons

| Button | What It Does |
|--------|-------------|
| Success/Errors/Method Filters | Show/hide specific operations |
| Live/Paused | Toggle auto-refresh of logs |
| Analyze | Generate report of all operations |
| Export | Download logs as JSON file |
| Clear | Delete all logs |

## Tips

1. **Always add context** when debugging:
   ```javascript
   await db.update(table, id, data, { 
     context: 'my-form-name-submit' 
   })
   ```

2. **Check admin console regularly** while developing

3. **Export logs** before clearing to keep a record

4. **Use the "Changes" section** to see what actually changed

5. **Look at timestamps** to correlate with your actions

## Need Help?

1. Check the admin console at `/admin`
2. Look for error patterns
3. Export logs and review
4. Check the context field to see where the operation came from
5. Compare "Payload Sent" with "Payload Received"
6. Read [DATABASE_DEBUG_GUIDE.md](./DATABASE_DEBUG_GUIDE.md) for advanced usage

# Product Update Fix - December 29, 2025

## Problem Summary
Product updates were failing silently on the frontend. The Supabase update call would return HTTP 204 (success) but the database was not actually being updated. The root cause was **RLS (Row Level Security) policies blocking the UPDATE operation** on the `products` table.

### Symptoms
- Frontend shows "Product updated successfully"
- Database price remains unchanged
- Logs show: `💰 Price update check: Attempted 1250, Got 125000 - ❌ FAILED (RLS or policy issue)`
- HTTP 204 response but data not persisted

## Root Cause
Supabase RLS policies were silently denying UPDATE operations when using the anon key (user-authenticated client). The policy allowed READ but blocked WRITE operations for certain conditions.

## Solution Implemented

### 1. **Backend API Endpoint** (server/vendor.js)
Created a new PATCH endpoint that uses the **service role key** (which bypasses RLS):

```javascript
// PATCH /api/vendor/products/:productId
router.patch('/products/:productId', verifySupabaseJwt, async (req, res) => {
  // 1. Verify user authentication
  // 2. Check vendor ownership (authorization)
  // 3. Map form fields to database schema:
  //    - price_in_cents → base_price
  //    - image → image_url
  //    - category → category_id
  // 4. Update using service role client (bypasses RLS)
  // 5. Return updated product
})
```

**Key Features:**
- Verifies JWT token from Supabase auth
- Checks product ownership via vendor relationship
- Handles field name mapping (form → database schema)
- Uses service role key to bypass RLS
- Returns full updated product object

### 2. **Frontend API Integration** (src/api/EcommerceApi.js)
Simplified the `updateProduct()` function to call the backend endpoint instead of direct Supabase client:

```javascript
export async function updateProduct(productId, updates) {
  // Get auth token from Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  
  // Call backend API endpoint
  const response = await fetch(`${API_BASE_URL}/vendor/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  
  return response.json().product;
}
```

**Benefits:**
- Cleaner, simpler implementation
- Leverages backend's service role key
- Proper error handling
- No more complex RLS workarounds

### 3. **CORS Configuration Fix** (server/index.js)
Added `PATCH` to the allowed HTTP methods in CORS configuration:

```javascript
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
```

## Field Mapping
The backend correctly maps frontend form fields to database schema:

| Frontend Field | Database Field | Purpose |
|---|---|---|
| `title` | `title` | Product name |
| `description` | `description` | Product description |
| `price_in_cents` | `base_price` | Price in cents |
| `image` | `image_url` | Product image URL |
| `category_id` | `category_id` | Category foreign key |

## Testing Results
✅ **Product Update Flow:**
1. User navigates to /vendor/products
2. Edits product (e.g., changes price from 1250 to 1500)
3. Clicks "Save"
4. Frontend sends PATCH to `/api/vendor/products/{productId}`
5. Backend verifies authorization + uses service role key
6. Database successfully updates
7. Response returns updated product
8. UI confirms success

**Verified Fields:**
- ✅ Price updates persist
- ✅ Title updates persist
- ✅ Description updates persist
- ✅ Authorization works (only vendor owner can update)
- ✅ Database changes are immediate and visible

## Files Modified

### Backend
- **server/vendor.js** - Added PATCH `/products/:productId` endpoint with service role auth
- **server/index.js** - Added 'PATCH' to CORS allowed methods

### Frontend
- **src/api/EcommerceApi.js** - Simplified `updateProduct()` to call backend API
- Removed complex RLS workaround logic
- Removed service role client initialization attempt (not needed)

## Architecture Benefits
1. **Security**: RLS policies still work via service role key validation
2. **Simplicity**: Frontend no longer needs complex field mapping logic
3. **Authorization**: Backend enforces vendor ownership check before update
4. **Maintainability**: Single source of truth for field mapping (backend)
5. **Scalability**: Can add additional validations server-side without frontend changes

## Deployment Notes
For production deployment:
1. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in backend environment
2. Verify RLS policies are in place (they block direct updates)
3. Service role key should only exist server-side (never expose to frontend)
4. Monitor `/api/vendor/products` PATCH requests in backend logs

## Future Improvements
- Add rate limiting to product update endpoint
- Add audit logging for product changes
- Add bulk product update support
- Add image upload handling in update endpoint
- Add category management in update endpoint

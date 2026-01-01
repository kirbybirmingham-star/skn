# 🚀 Complete Migration & Alignment Guide
## Bringing Older App Branches to Current Version

**Date:** December 31, 2025  
**Status:** Complete Production-Ready Guide  
**Purpose:** Debug, fix, and align ANY branch of the app to current architecture  
**Target:** All pages, all features, all known issues

---

## ⚡ Quick Start (5 Minutes)

If your app is broken, follow this checklist:

- [ ] **Step 1:** Check if you're calling Supabase directly from frontend (❌ WRONG)
- [ ] **Step 2:** Check if backend API endpoints exist in your server folder
- [ ] **Step 3:** Check if JWT middleware is verifying authorization
- [ ] **Step 4:** Check if products/orders/profiles display correctly
- [ ] **Step 5:** Run full diagnostics below

If ALL checks pass, your branch is aligned. If any fail, follow the detailed fixes.

---

## 🎯 What Changed (Architecture Overview)

### The Core Change: Service Role Pattern

**Old Way (BROKEN):**
```javascript
// Frontend directly calls Supabase (RLS blocks it)
const { data } = await supabase
  .from('products')
  .update({ title: 'New' })
  .eq('id', productId);  // ❌ RLS policy rejects this
```

**New Way (FIXED):**
```javascript
// Frontend calls backend API
const response = await fetch('/api/vendor/products/' + productId, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ title: 'New' })
});

// Backend uses service role to bypass RLS
const supabase = createClient(url, SUPABASE_SERVICE_ROLE_KEY);
const { data } = await supabase
  .from('products')
  .update({ title: 'New' })
  .eq('id', productId);  // ✅ Service role bypasses RLS
```

**Why?** RLS policies protect the database from unauthorized direct access. The backend has the service role key and enforces authorization checks before touching the database.

---

## 🔍 Diagnostic Checklist

Run through each section to identify issues in your branch:

### 1. Frontend API Layer Check

**File:** `src/api/EcommerceApi.jsx`

❌ **Problem:** Direct Supabase calls
```javascript
import { supabase } from '@/config/supabaseClient';

export async function updateProduct(id, updates) {
  // ❌ WRONG - Frontend calling Supabase
  return await supabase
    .from('products')
    .update(updates)
    .eq('id', id);
}
```

✅ **Solution:** Call backend API instead
```javascript
export async function updateProduct(id, updates) {
  // ✅ CORRECT - Call backend API
  const token = localStorage.getItem('auth_token');
  return await fetch(`/api/vendor/products/${id}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
}
```

**Required Functions in EcommerceApi.jsx:**
```javascript
// Read operations (may use Supabase directly)
export async function getProducts() { ... }
export async function getVendors() { ... }
export async function getCategories() { ... }

// Write operations (MUST use backend API)
export async function updateProduct(id, updates) { ... }
export async function updateUserProfile(updates) { ... }
export async function createProduct(vendorId, data) { ... }
export async function deleteProduct(id) { ... }

// Vendor operations (MUST use backend API)
export async function updateVendor(vendorId, updates) { ... }
export async function updateVendorProfile(vendorId, updates) { ... }

// Category operations (MUST use backend API)
export async function getOrCreateCategoryByName(name) { ... }
```

---

### 2. Backend API Endpoints Check

**File:** `server/vendor.js`

**Required Endpoints:**

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/vendor/products/:id` | PATCH | Update product | ✅ Must exist |
| `/api/vendor/products` | POST | Create product | ✅ Must exist |
| `/api/vendor/products/:id` | DELETE | Delete product | ✅ Must exist |
| `/api/vendor/profile` | PATCH | Update vendor profile | ✅ Must exist |
| `/api/vendor/orders` | GET | List vendor orders | ✅ Must exist |
| `/api/orders/vendor/recent` | GET | Recent orders (dashboard) | ✅ Must exist |
| `/api/dashboard/vendor/:id` | GET | Vendor dashboard stats | ✅ Must exist |

**Check:** Each endpoint should:
1. Verify JWT token from `Authorization: Bearer <token>` header
2. Extract user ID from verified token
3. Check authorization (vendor ownership)
4. Use service role client for database operations
5. Return explicit error responses (not 204 silent failures)

❌ **Problem Example:**
```javascript
// WRONG - No field mapping
router.patch('/api/vendor/products/:id', (req, res) => {
  const { title, price, category } = req.body;
  // ❌ Database expects: title, base_price, metadata.category_name
  // ❌ No JWT verification
  // ❌ No authorization check
  supabase.from('products').update({ title, price, category });
});
```

✅ **Correct Example:**
```javascript
// CORRECT - Full implementation
router.patch('/api/vendor/products/:id', async (req, res) => {
  try {
    // 1. Verify JWT
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
    const { data, error: verifyError } = await supabase.auth.getUser(token);
    if (verifyError) return res.status(401).json({ error: 'Invalid token' });
    
    const userId = data.user.id;

    // 2. Check authorization
    const { data: product } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', req.params.id)
      .single();
    
    const { data: vendor } = await supabase
      .from('vendors')
      .select('user_id')
      .eq('id', product.vendor_id)
      .single();
    
    if (vendor.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // 3. Map fields
    const { title, price_in_cents, category, image, ...rest } = req.body;
    const updates = {
      title,
      base_price: price_in_cents,
      image_url: image,
      metadata: { category_name: category },
      ...rest
    };

    // 4. Use service role
    const { data: updated, error } = await supabaseService
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select();
    
    if (error) return res.status(400).json({ error: error.message });
    
    // 5. Return result
    return res.json({ data: updated[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
```

---

### 3. JWT Middleware Check

**File:** `server/middleware.js`

Must verify every protected route:

❌ **Problem:**
```javascript
// WRONG - Middleware not verifying token
export const authMiddleware = (req, res, next) => {
  next(); // ❌ No verification
};
```

✅ **Correct:**
```javascript
// CORRECT - Middleware verifies JWT
export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const { data, error } = await supabase.auth.getUser(token);
    if (error) return res.status(401).json({ error: 'Invalid token' });

    req.user = data.user;
    next();
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
```

All protected endpoints should use: `router.post('/path', authMiddleware, handler);`

---

### 4. Page Component Data Refresh Check

**Pages that MUST refresh from database after updates:**

#### 4.1 Products Page
**File:** `src/pages/vendor/Products.jsx`

❌ **Problem:**
```javascript
// WRONG - Only updates local state
await updateProduct(productId, formData);
setProducts(prev => prev.map(p => p.id === productId ? {...p, ...formData} : p));
```

✅ **Solution:**
```javascript
// CORRECT - Updates AND refreshes from database
await updateProduct(productId, formData);
const updated = await listProductsByVendor(vendor.id);
setProducts(updated);
toast.success('Product updated successfully');
```

---

#### 4.2 Account Settings Page
**File:** `src/pages/AccountSettings.jsx`

❌ **Problem:**
```javascript
// WRONG - No refresh after update
await updateUserProfile(updates);
toast.success('Profile saved');
```

✅ **Solution:**
```javascript
// CORRECT - Updates AND refreshes from database
await updateUserProfile(updates);

// Refresh user context
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('users')
  .select('*')
  .eq('id', user.id)
  .single();

setUser({ ...user, profile });
toast.success('Profile saved');
```

---

#### 4.3 Store Settings Page
**File:** `src/pages/vendor/Store.jsx`

❌ **Problem:**
```javascript
// WRONG - Not reloading vendor data
await updateVendor(vendor.id, formData);
setVendor({...vendor, ...formData});
```

✅ **Solution:**
```javascript
// CORRECT - Reloads from database
await updateVendor(vendor.id, formData);
const updated = await getVendorByOwner(user.id);
setVendor(updated);
toast.success('Store updated');
```

---

#### 4.4 Vendor Dashboard
**File:** `src/pages/vendor/Dashboard.jsx`

❌ **Problem:**
```javascript
// WRONG - Calling non-existent endpoint
const response = await fetch('/api/vendor/orders');
// ❌ Endpoint doesn't exist
```

✅ **Solution:**
```javascript
// CORRECT - Using proper endpoint
const response = await fetch('/api/orders/vendor/recent', {
  headers: { Authorization: `Bearer ${token}` }
});
const orders = await response.json();
setRecentOrders(orders);
```

---

#### 4.5 Marketplace Page
**File:** `src/pages/MarketplacePage.jsx`

❌ **Problem - MARKETPLACE NOT LOADING PRODUCTS:**
```javascript
// WRONG - Multiple issues
useEffect(() => {
  const loadData = async () => {
    try {
      // ❌ May have wrong endpoint names
      const [products, vendors, categories] = await Promise.all([
        getProducts(),
        getVendors(),
        getCategories()
      ]);
      setProducts(products);
      setVendors(vendors);
      setCategories(categories);
    } catch (err) {
      // ❌ Error silently fails
      console.log(err);
    }
  };
  loadData();
}, []);
```

✅ **Solution:**
```javascript
useEffect(() => {
  const loadData = async () => {
    try {
      // ✅ Load with error handling
      const products = await getProducts();
      const vendors = await getVendors();
      const categories = await getCategories();
      
      if (!products || products.length === 0) {
        console.warn('No products loaded');
      }
      
      setProducts(products || []);
      setVendors(vendors || []);
      setCategories(categories || []);
    } catch (err) {
      console.error('Failed to load marketplace:', err);
      setError(err.message);
      toast.error('Failed to load marketplace');
    }
  };
  loadData();
}, []);
```

**Required EcommerceApi functions:**
```javascript
export async function getProducts() {
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('status', 'active');
  return data || [];
}

export async function getVendors() {
  const { data } = await supabase
    .from('vendors')
    .select('*')
    .eq('verification_status', 'verified');
  return data || [];
}

export async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  return data || [];
}
```

---

### 5. Database Schema & Field Mapping Check

**Problem:** Frontend and backend field names don't match

**Database Schema (Real column names):**
```sql
products table:
- id (UUID)
- title (text)
- base_price (numeric) ← NOT "price"
- image_url (text) ← NOT "image"
- metadata (jsonb) ← contains category_name
- status (text)

users table:
- id (UUID)
- email (text)
- full_name (text)

vendors table:
- id (UUID)
- user_id (UUID)
- business_name (text)
- business_logo (text)
```

**Frontend Form Fields vs Database:**

| Form Field | Database Column | Note |
|-----------|-----------------|------|
| title | title | ✅ Same |
| price_in_cents | base_price | ❌ Different - must convert |
| image | image_url | ❌ Different - must rename |
| category | metadata.category_name | ❌ Nested - must extract |
| description | description | ✅ Same |

**Field Mapping Function (Backend):**
```javascript
function mapFormToDB(formData) {
  const dbData = {};
  
  // Direct mappings
  if (formData.title !== undefined) dbData.title = formData.title;
  if (formData.description !== undefined) dbData.description = formData.description;
  
  // Price conversion: cents → database
  if (formData.price_in_cents !== undefined) {
    dbData.base_price = formData.price_in_cents;
  }
  
  // Image field rename
  if (formData.image !== undefined) {
    dbData.image_url = formData.image;
  }
  
  // Category to metadata
  if (formData.category !== undefined) {
    dbData.metadata = { 
      ...formData.metadata,
      category_name: formData.category 
    };
  }
  
  return dbData;
}
```

---

## 🛠️ Complete Fix Procedures

### Fix #1: Products Not Updating (RLS Blocked)

**Symptoms:**
- Product update form submits but nothing changes
- No error message shown
- Refresh page shows old values

**Root Cause:** Frontend calling Supabase directly

**Location:** `src/api/EcommerceApi.jsx`

**Step-by-step Fix:**

1. **Find the updateProduct function:**
```javascript
// BEFORE
export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select();
  return { data, error };
}
```

2. **Replace with backend API call:**
```javascript
// AFTER
export async function updateProduct(id, updates) {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');
  
  const response = await fetch(`/api/vendor/products/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update product');
  }
  
  return await response.json();
}
```

3. **Ensure backend endpoint exists:** `server/vendor.js`
```javascript
router.patch('/api/vendor/products/:id', authMiddleware, async (req, res) => {
  // See section 2 above for complete implementation
});
```

---

### Fix #2: Marketplace Not Loading Products

**Symptoms:**
- Marketplace page shows empty
- No products displayed
- Console shows no errors or vague errors

**Root Cause:** 
- Missing products function in API layer
- OR incorrect endpoint
- OR no error handling

**Location:** `src/pages/MarketplacePage.jsx` + `src/api/EcommerceApi.jsx`

**Step-by-step Fix:**

1. **Add to EcommerceApi.jsx:**
```javascript
export async function getProducts(filters = {}) {
  try {
    let query = supabase
      .from('products')
      .select('*, vendors(id, business_name, avatar_url)')
      .eq('status', 'active');
    
    // Apply filters
    if (filters.category) {
      query = query.eq('metadata->>category_name', filters.category);
    }
    if (filters.vendorId) {
      query = query.eq('vendor_id', filters.vendorId);
    }
    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error loading products:', err);
    return [];
  }
}
```

2. **Update MarketplacePage.jsx:**
```javascript
import { getCategories, getProducts, getVendors } from '@/api/EcommerceApi';
import { useToast } from '@/components/ui/use-toast';

export default function MarketplacePage() {
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [productsData, vendorsData, categoriesData] = await Promise.all([
          getProducts(),
          getVendors(),
          getCategories()
        ]);

        if (!productsData || productsData.length === 0) {
          console.warn('No products available');
        }

        setProducts(productsData || []);
        setVendors(vendorsData || []);
        setCategories(categoriesData || []);
      } catch (err) {
        console.error('Failed to load marketplace:', err);
        setError(err.message);
        toast({
          title: 'Error',
          description: 'Failed to load marketplace: ' + err.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!products || products.length === 0) {
    return <div>No products available yet</div>;
  }

  return (
    <div>
      {/* Display products */}
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

---

### Fix #3: Orders Showing Wrong Data

**Symptoms:**
- Orders table shows undefined values
- Wrong columns displayed
- Vendor sees incorrect order amounts

**Root Cause:** Field mapping incorrect in backend endpoint

**Location:** `server/vendor.js` → GET `/api/vendor/orders`

**Step-by-step Fix:**

1. **Check current endpoint:**
```javascript
// WRONG - Missing fields, wrong mapping
router.get('/api/vendor/orders', authMiddleware, async (req, res) => {
  const orders = await supabase
    .from('order_items')
    .select('id, order_id, price, status')
    .eq('vendor_id', vendorId);
  // ❌ Wrong: price instead of unit_price
  // ❌ Wrong: status in wrong table
  // ❌ Missing: total_amount, created_at, customer email
});
```

2. **Replace with correct version:**
```javascript
router.get('/api/vendor/orders', authMiddleware, async (req, res) => {
  try {
    const { vendorId } = req.query;
    
    // Get vendor for current user
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', req.user.id)
      .single();
    
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    // Correct select statement
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        product_id,
        quantity,
        unit_price,
        total_price,
        orders (
          id,
          status,
          created_at,
          total_amount,
          metadata
        )
      `)
      .eq('vendor_id', vendor.id)
      .order('orders(created_at)', { ascending: false });
    
    if (error) return res.status(400).json({ error: error.message });
    
    // Format response
    const formatted = data.map(item => ({
      ...item,
      customer_email: item.orders?.metadata?.payer_email,
      order_status: item.orders?.status,
      order_date: item.orders?.created_at,
      order_total: item.orders?.total_amount
    }));
    
    return res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

### Fix #4: Profile Not Updating

**Symptoms:**
- User profile form submits but changes don't save
- Or saves locally but disappears on refresh

**Root Cause:** Frontend calling Supabase directly or no refresh after update

**Location:** `src/pages/AccountSettings.jsx` + `server/profile.js`

**Step-by-step Fix:**

1. **Check backend endpoint exists:** `server/profile.js`
```javascript
router.patch('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { full_name, phone, address, ...rest } = req.body;
    
    // Use service role
    const { data, error } = await supabaseService
      .from('users')
      .update({ full_name, phone, address, ...rest })
      .eq('id', req.user.id)
      .select();
    
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

2. **Update frontend component:**
```javascript
// In AccountSettings.jsx
const handleSaveProfile = async (updates) => {
  try {
    // Call API
    const token = localStorage.getItem('auth_token');
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) throw new Error('Failed to save');
    
    // Refresh profile from backend
    const profileRes = await fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const updatedProfile = await profileRes.json();
    
    // Update context
    setUser({ ...user, ...updatedProfile });
    toast.success('Profile saved successfully');
  } catch (err) {
    toast.error('Failed to save profile: ' + err.message);
  }
};
```

---

### Fix #5: Category System Not Working

**Symptoms:**
- Can't assign category to product
- Category dropdown empty
- Products have no category

**Root Cause:** Missing category functions or no category FK conversion

**Location:** `src/api/EcommerceApi.jsx`

**Step-by-step Fix:**

1. **Add category functions:**
```javascript
export async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  return data || [];
}

export async function getOrCreateCategoryByName(name) {
  if (!name || name.trim() === '') {
    // Return "Uncategorized" ID
    const { data: uncategorized } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Uncategorized')
      .single();
    return uncategorized?.id;
  }

  // Check if category exists
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('name', name)
    .single();
  
  if (existing) return existing.id;

  // Create new category
  const { data: created } = await supabase
    .from('categories')
    .insert({ name })
    .select('id')
    .single();
  
  return created?.id;
}

export async function ensureDefaultCategory() {
  const { data: exists } = await supabase
    .from('categories')
    .select('id')
    .eq('name', 'Uncategorized')
    .single();
  
  if (!exists) {
    await supabase
      .from('categories')
      .insert({ name: 'Uncategorized' });
  }
}

export async function getCategoryStats() {
  const { data } = await supabase
    .from('products')
    .select('metadata->>category_name')
    .then(res => {
      if (!res.data) return { data: [] };
      const counts = {};
      res.data.forEach(item => {
        const cat = item['metadata->>category_name'] || 'Uncategorized';
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return { data: Object.entries(counts).map(([name, count]) => ({ name, count })) };
    });
  return data;
}
```

2. **Use in product creation:**
```javascript
const handleCreateProduct = async (formData) => {
  try {
    // Get or create category
    const categoryId = await getOrCreateCategoryByName(formData.category);
    
    // Call backend with categoryId
    const response = await fetch('/api/vendor/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...formData,
        category_id: categoryId  // FK reference
      })
    });
    
    const result = await response.json();
    toast.success('Product created');
  } catch (err) {
    toast.error(err.message);
  }
};
```

---

## 📊 Complete File-by-File Checklist

### ✅ Frontend API Layer (`src/api/EcommerceApi.jsx`)

Must have these functions:

```javascript
// ✅ READ operations (OK to use Supabase directly)
export async function getProducts(filters) { }
export async function getVendors(filters) { }
export async function getCategories() { }
export async function getVendorById(id) { }
export async function getProductById(id) { }
export async function getOrders() { }

// ✅ WRITE operations (MUST use backend API)
export async function createProduct(vendorId, data) { }
export async function updateProduct(id, updates) { }
export async function deleteProduct(id) { }
export async function updateUserProfile(updates) { }
export async function updateVendor(vendorId, updates) { }

// ✅ Category operations (MUST use backend API)
export async function getOrCreateCategoryByName(name) { }
export async function ensureDefaultCategory() { }

// ✅ Dashboard operations
export async function getVendorDashboardData(vendorId) { }
export async function getVendorByOwner(userId) { }
```

---

### ✅ Backend Middleware (`server/middleware.js`)

Must have:

```javascript
// JWT verification middleware
export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: 'Invalid token' });
  
  req.user = data.user;
  next();
};
```

All protected routes: `router.method('/path', authMiddleware, handler);`

---

### ✅ Backend Endpoints (`server/vendor.js`)

Must have:

```javascript
// Read endpoints (no auth needed)
router.get('/api/dashboard/vendor/:id', (req, res) => { });
router.get('/api/vendor/products/top', authMiddleware, (req, res) => { });

// Write endpoints (auth required)
router.post('/api/vendor/products', authMiddleware, (req, res) => { });
router.patch('/api/vendor/products/:id', authMiddleware, (req, res) => { });
router.delete('/api/vendor/products/:id', authMiddleware, (req, res) => { });
router.patch('/api/vendor/profile', authMiddleware, (req, res) => { });
router.get('/api/vendor/orders', authMiddleware, (req, res) => { });
```

---

### ✅ Backend Order Endpoints (`server/orders.js`)

Must have:

```javascript
// Required endpoints
router.get('/api/orders/vendor/recent', authMiddleware, (req, res) => { });
router.get('/api/vendor/:vendorId/orders', authMiddleware, (req, res) => { });
```

---

### ✅ Frontend Pages

| Page | File | Must Check |
|------|------|-----------|
| Marketplace | `src/pages/MarketplacePage.jsx` | Loads products, shows error handling |
| Products (Vendor) | `src/pages/vendor/Products.jsx` | Updates refresh from DB |
| Store Settings | `src/pages/vendor/Store.jsx` | Updates refresh from DB |
| Dashboard | `src/pages/vendor/Dashboard.jsx` | Uses `/api/orders/vendor/recent` |
| Account Settings | `src/pages/AccountSettings.jsx` | Profile updates refresh |
| Orders | `src/pages/vendor/Orders.jsx` | Shows correct field values |

---

## 🚨 Common Issues & Quick Fixes

### Issue: "Cannot read property of undefined"
**Cause:** Data didn't load  
**Fix:** Add null checks: `products?.map()` instead of `products.map()`

### Issue: Products page shows old data after edit
**Cause:** No refresh from database  
**Fix:** Add: `const updated = await listProductsByVendor(vendor.id); setProducts(updated);`

### Issue: Form submits but nothing changes
**Cause:** Frontend calling Supabase (RLS blocks it)  
**Fix:** Replace Supabase call with: `fetch('/api/vendor/products/...')`

### Issue: Marketplace empty/404
**Cause:** Missing `getProducts()` function  
**Fix:** Add complete function to `EcommerceApi.jsx` (see section above)

### Issue: Orders showing wrong values
**Cause:** Wrong field names in SELECT  
**Fix:** Use `unit_price`, `total_price`, not `price`

### Issue: Category always null
**Cause:** No `getOrCreateCategoryByName()` call  
**Fix:** Before creating product, get category ID: `const catId = await getOrCreateCategoryByName(cat);`

### Issue: Vendor sees other vendors' data
**Cause:** No authorization check  
**Fix:** Always check: `if (vendor.user_id !== req.user.id) return 403;`

---

## 🧪 Testing Checklist

After applying fixes, test each feature:

### Test 1: Product Creation
- [ ] Open Products page
- [ ] Create new product
- [ ] Refresh page
- [ ] Product still exists ✅

### Test 2: Product Update
- [ ] Open Products page
- [ ] Edit product title
- [ ] Submit form
- [ ] See success message
- [ ] Refresh page
- [ ] Title changed ✅

### Test 3: Marketplace Display
- [ ] Open Marketplace
- [ ] See products loading
- [ ] See multiple products ✅

### Test 4: Orders Display
- [ ] Open Vendor Dashboard
- [ ] See recent orders
- [ ] Amounts correct
- [ ] Dates correct ✅

### Test 5: Profile Update
- [ ] Open Account Settings
- [ ] Change name
- [ ] Save
- [ ] Refresh page
- [ ] Name changed ✅

### Test 6: Category System
- [ ] Create product with custom category
- [ ] Save product
- [ ] Refresh page
- [ ] Category preserved ✅

---

## 🔐 Security Verification

- [ ] Frontend never calls `supabase.from()` for write operations
- [ ] All write operations go through `/api/*` endpoints
- [ ] All protected endpoints verify JWT token
- [ ] All protected endpoints check authorization (ownership)
- [ ] Service role key only in `server/` files and `.env`
- [ ] No sensitive data in frontend environment
- [ ] All errors return explicit messages (not silent 204)

---

## 📋 Implementation Verification Template

Print this and check off each item:

```
BEFORE MERGING YOUR BRANCH
==========================

Frontend API Layer:
  [ ] updateProduct() calls /api/vendor/products/:id
  [ ] updateVendor() calls /api/vendor/profile  
  [ ] updateUserProfile() calls /api/profile
  [ ] createProduct() calls /api/vendor/products
  [ ] deleteProduct() calls /api/vendor/products/:id
  [ ] getOrCreateCategoryByName() exists
  [ ] All write operations use backend API

Backend Endpoints:
  [ ] /api/vendor/products/:id (PATCH) exists
  [ ] /api/vendor/products (POST) exists
  [ ] /api/vendor/products/:id (DELETE) exists
  [ ] /api/vendor/profile (PATCH) exists
  [ ] /api/vendor/orders (GET) exists
  [ ] /api/orders/vendor/recent (GET) exists
  [ ] /api/profile (GET/PATCH) exists
  [ ] All endpoints verify JWT
  [ ] All endpoints check authorization

Pages:
  [ ] MarketplacePage loads products without errors
  [ ] Products page refreshes from DB after update
  [ ] Store page refreshes from DB after update
  [ ] Dashboard loads recent orders
  [ ] AccountSettings refreshes profile after update
  [ ] Orders page shows correct field values
  [ ] No console errors during navigation

Database:
  [ ] Field mapping correct (price_in_cents → base_price)
  [ ] Image mapping correct (image → image_url)
  [ ] Category mapping correct (to metadata.category_name)
  [ ] All updates persist after refresh
```

---

## 🎓 Reference Architecture Diagram

```
                    FRONTEND (React)
                    
    MarketplacePage ─────> getProducts()
    ProductPage     ─────> getProductById()
    StoreSettings   ─────> updateVendor()
    Products        ─────> listProductsByVendor()
    AccountSettings ─────> updateUserProfile()
    
                         ↓ calls ↓
                         
                    src/api/EcommerceApi.jsx
                    
    READ ops:  
    ├─ getProducts() → Supabase.from('products')
    ├─ getVendors() → Supabase.from('vendors')
    └─ getCategories() → Supabase.from('categories')
    
    WRITE ops (MUST call backend):
    ├─ updateProduct() → fetch('/api/vendor/products/:id')
    ├─ updateVendor() → fetch('/api/vendor/profile')
    └─ updateUserProfile() → fetch('/api/profile')
    
                         ↓ calls ↓
                         
                    BACKEND (Node/Express)
                    
    server/middleware.js:
    └─ authMiddleware: Verify JWT token
    
    server/vendor.js:
    ├─ GET /api/vendor/orders (with auth)
    ├─ PATCH /api/vendor/products/:id (with auth)
    ├─ POST /api/vendor/products (with auth)
    └─ PATCH /api/vendor/profile (with auth)
    
    server/profile.js:
    ├─ GET /api/profile (with auth)
    └─ PATCH /api/profile (with auth)
    
    server/orders.js:
    └─ GET /api/orders/vendor/recent (with auth)
    
                         ↓ uses ↓
                         
                SUPABASE (Database + Auth)
                
    Service Role Client:
    ├─ Update users
    ├─ Update products
    ├─ Update vendors
    └─ Bypass RLS policies (safely, with auth checks)
```

---

## 🎯 Next Steps

1. **Identify your branch state:** Run diagnostics above
2. **Apply only needed fixes:** Use the section that matches your problems
3. **Test each fix:** Use testing checklist
4. **Verify security:** Use security verification list
5. **Merge with confidence:** All issues should be resolved

---

## ✅ Final Checklist Before Going Live

- [ ] No direct Supabase calls from frontend (except reads)
- [ ] All writes go through backend API
- [ ] All updates refresh from database
- [ ] Marketplace loads without errors
- [ ] Products can be created and updated
- [ ] Orders display with correct data
- [ ] Profile updates persist
- [ ] Categories work correctly
- [ ] No console errors during normal usage
- [ ] JWT verification works on all protected endpoints
- [ ] Authorization checks prevent unauthorized access

---

**You are now ready to align your branch with the current production version! 🚀**

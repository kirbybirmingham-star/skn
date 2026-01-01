# Quick Reference - Product System Architecture

## How to Use the Product System

### Display All Products
```javascript
import { getProducts } from '@/api/EcommerceApi';

const response = await getProducts({
  page: 1,
  perPage: 24
});

// response.products = Array of products
// response.total = Total count in database
```

### Filter by Vendor
```javascript
const response = await getProducts({
  sellerId: 'vendor-uuid-here',
  page: 1,
  perPage: 24
});
```

### Search Products
```javascript
const response = await getProducts({
  searchQuery: 'laptop',
  page: 1,
  perPage: 24
});
```

### Filter by Price Range
```javascript
const response = await getProducts({
  priceRange: '50-200',  // or 'under-50', 'over-500'
  page: 1,
  perPage: 24
});
```

### Sort Products
```javascript
const response = await getProducts({
  sortBy: 'price-low',  // or 'price-high', 'newest'
  page: 1,
  perPage: 24
});
```

---

## Product Data Structure

```javascript
{
  id: "uuid-string",
  title: "Product Name",
  description: "Product description",
  slug: "product-slug",
  vendor_id: "vendor-uuid",
  base_price: 2999,           // in cents ($29.99)
  currency: "USD",
  image_url: "https://...",   // main product image
  gallery_images: [],         // array of additional images
  is_published: true,
  created_at: "2025-12-31T..."
}
```

---

## Key Files & Their Purpose

| File | Purpose | Modify When |
|------|---------|------------|
| `productsHandler.js` | Core query logic | Adding filters, caching, or query optimization |
| `EcommerceApi.jsx` | Public API | Changing API interface or return shape |
| `ProductsList.jsx` | Product display | Changing UI or pagination behavior |
| `productUtils.js` | Data utilities | Adding new data transformations |
| `customSupabaseClient.js` | Auth client | Changing Supabase configuration |

---

## How to Add a New Filter

### Example: Add Stock Filter

**Step 1:** Update `productsHandler.js`
```javascript
export async function fetchProductsHandler(options = {}) {
  const { 
    // ... existing options
    inStock = null  // ← ADD THIS
  } = options;

  // ... existing query building code ...

  if (inStock === true) {
    query = query.gt('stock_quantity', 0);
  }
}
```

**Step 2:** Update `EcommerceApi.jsx`
```javascript
export async function getProducts(options = {}) {
  return await fetchProductsHandler(options);
  // No changes needed here - it passes through all options
}
```

**Step 3:** Use in component
```javascript
const response = await getProducts({
  inStock: true,
  page: 1,
  perPage: 24
});
```

---

## Console Logging Reference

When debugging, look for these logs:

```
✅ 🔧 productsHandler: Building query with fields: [list of fields]
✅ 🔧 productsHandler: Getting total count...
✅ 🔧 productsHandler: Executing query...
✅ 🔧 productsHandler: Query successful!
✅ 🔧 productsHandler: Returned X products on page Y
✅ 🔧 productsHandler: Total available: Z

❌ 🔧 productsHandler: Query error: [error message]
```

---

## Performance Tips

1. **Don't change perPage to more than 48** - UI will be slow
2. **Add result caching for repeated queries** - See optimization path in BASELINE_v2
3. **Use indexes in Supabase** - Index vendor_id, category_id, created_at
4. **Monitor query performance** - Use Supabase dashboard

---

## Common Tasks

### Task: Show products from specific vendor
```javascript
// In MarketplacePage.jsx
const response = await getProducts({
  sellerId: currentVendor.id,
  page: vendorPage,
  perPage: 24
});
```

### Task: Show featured products
```javascript
// First, add featured column to database
// Then filter by is_featured or special category
const response = await getProducts({
  categoryId: 'featured',
  sortBy: 'newest',
  perPage: 6
});
```

### Task: Implement search
```javascript
// In search component
const response = await getProducts({
  searchQuery: userSearchInput,
  page: 1,
  perPage: 24
});
```

---

## Dark Mode Checklist

When adding new UI elements:

```jsx
// ✅ CORRECT - All colors have dark variants
<div className="bg-green-50 dark:bg-green-950 text-green-900 dark:text-green-100">

// ❌ WRONG - Missing dark variants
<div className="bg-green-50 text-green-900">

// ✅ CORRECT - For all components
className="bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100"
```

---

## Future Enhancement Checklist

When implementing new features:

- [ ] Added console logs for debugging
- [ ] Updated error handling
- [ ] Tested in light mode
- [ ] Tested in dark mode
- [ ] Tested on mobile
- [ ] Updated documentation
- [ ] Added to this quick reference
- [ ] Performance benchmarked

---

## Support

For issues or questions:
1. Check console logs (search for 🔧 or ❌)
2. Read BASELINE_v2_COMPLETE.md
3. Check PRODUCT_DISPLAY_FIX_COMPLETE.md
4. Verify database schema in Supabase dashboard

---

**Last Updated:** December 31, 2025

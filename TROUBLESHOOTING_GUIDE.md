# Troubleshooting Guide - Filter & Update Issues

## Common Filter Problems

### Problem: Products not filtering by category

**Symptoms:**
- All products shown regardless of category selection
- Category dropdown changes but no effect on results
- Console shows `categoryId = null`

**Debug Steps:**
1. Check if `selectedCategoryId` is being set:
   ```javascript
   console.log('Category selected:', { selectedCategory, selectedCategoryId });
   ```

2. Verify category object has `id` field:
   ```javascript
   const categories = await getCategories();
   console.log('Categories:', categories);
   // Should show: [{ id: 1, name: "Electronics", slug: "electronics" }, ...]
   ```

3. Check ProductsList receives the prop:
   ```javascript
   // In ProductsList at top:
   console.log('ProductsList props:', { categoryId, searchQuery, priceRange, sortBy });
   ```

4. Verify API call includes categoryId:
   ```javascript
   // In getProducts():
   console.log('API filters:', { categoryId, searchQuery, priceRange });
   ```

**Solutions:**
- Ensure `getCategories()` returns objects with `id` property
- Verify category ID is numeric (not string):
  ```javascript
  const cid = Number.isInteger(Number(categoryId)) ? Number(categoryId) : categoryId;
  ```
- Check database: `SELECT id, name, slug FROM categories;`
- Verify Supabase RLS doesn't block category queries

---

### Problem: Price filtering returns wrong products

**Symptoms:**
- Prices outside range shown
- "Under $50" shows $100 items
- No results when should have matches
- Variant products not appearing in price filter

**Debug Steps:**
1. Check price normalization:
   ```javascript
   // Add to ProductsList
   const normalizePriceRange = (pr) => {
     // ... normalization logic
     console.log('Price range normalized:', { input: pr, output: prToken });
     return prToken;
   };
   ```

2. Verify cents conversion:
   ```javascript
   // Check if prices are cents (not dollars)
   const products = await getProducts({ priceRange: '50-200' });
   products.forEach(p => {
     const price = p.base_price || p.variants?.[0]?.price_in_cents;
     console.log(`${p.title}: ${price} cents = $${price/100}`);
   });
   ```

3. Check variant matching:
   ```javascript
   // In getProducts() debug:
   const variantRes = await supabase
     .from('product_variants')
     .select('product_id, price_in_cents, price');
   console.log('Variant prices found:', variantRes.data);
   ```

4. Verify union is working:
   ```javascript
   // Check both base and variant results
   console.log('Base price matches:', baseData.length);
   console.log('Variant matches:', variantData.length);
   console.log('Combined unique:', combined.length);
   ```

**Solutions:**
- Ensure all prices in database are in cents (not dollars)
- Check `price_in_cents` field exists in product_variants
- Verify price range token format: "50-200" not "50-200" (with spaces)
- Confirm variant query returns product_id correctly
- Test hardcoded ranges to isolate normalization issues

**Price Range Token Format:**
```
Input           → Token           → API Query
"Under $50"     → "under-50"      → max: 5000
"$50-$200"      → "50-200"        → min: 5000, max: 20000
"Over $500"     → "over-500"      → min: 50000
"All" / null    → "all"           → No price filter
```

---

### Problem: Search not returning results

**Symptoms:**
- Search box appears but no results shown
- Results disappear when typing
- Special characters break search
- Case-sensitive matching (won't find "iPhone" with "iphone")

**Debug Steps:**
1. Check search query is passed:
   ```javascript
   console.log('Search query:', searchQuery);
   console.log('Search trimmed:', searchQuery.trim());
   console.log('Has length:', searchQuery.trim().length > 0);
   ```

2. Verify database contains search terms:
   ```sql
   SELECT title, description FROM vendor_products 
   WHERE title ILIKE '%laptop%' OR description ILIKE '%laptop%';
   ```

3. Check API query construction:
   ```javascript
   // In getProducts():
   if (searchQuery && String(searchQuery).trim().length > 0) {
     const searchQueryStr = String(searchQuery).trim();
     console.log('Applying search filter:', searchQueryStr);
     query = query.or(`title.ilike.%${searchQueryStr}%,description.ilike.%${searchQueryStr}%`);
   }
   ```

4. Test with simple term:
   ```javascript
   // Try single word
   await getProducts({ searchQuery: 'laptop' });
   // Then try phrase
   await getProducts({ searchQuery: 'gaming laptop' });
   ```

**Solutions:**
- Use `ilike` (not `like`) for case-insensitive matching
- Escape special characters: `searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`
- Test search with actual data from database
- Trim whitespace: `searchQuery.trim().length > 0`
- Check database has non-empty title/description fields

---

### Problem: Sort not working correctly

**Symptoms:**
- Newest sort shows random order
- Price sort doesn't order by price
- Rating/popular sorts not implemented
- Mobile vs desktop sort differs

**Debug Steps:**
1. Check sort value received:
   ```javascript
   console.log('Sort by:', sortBy);
   console.log('Sort options:', sortOptions);
   ```

2. Verify it's passed to API:
   ```javascript
   // In ProductsList:
   const resp = await getProducts({ sortBy, ... });
   console.log('Requested sort:', sortBy);
   ```

3. Check if server-side or client-side:
   ```javascript
   // In getProducts():
   const isClientSideSort = sb === 'price_asc' || sb === 'price_desc' || 
                            sb === 'rating_asc' || sb === 'rating_desc';
   console.log('Client-side sort?', isClientSideSort);
   console.log('Sort option:', sb);
   ```

4. Test server-side sorts:
   ```sql
   -- Check ordering works
   SELECT * FROM vendor_products 
   ORDER BY created_at DESC LIMIT 10;  -- newest
   
   SELECT * FROM vendor_products 
   ORDER BY title ASC LIMIT 10;  -- title_asc
   ```

**Solutions:**
- Map sort options to database columns correctly
- For "price-low": implement client-side sort
- For "rating": requires reviews join (may not be implemented)
- Test each sort option independently
- Check data actually differs (e.g., created_at times)

---

### Problem: Autocomplete suggestions not showing

**Symptoms:**
- Search box appears but no dropdown
- Categories not in suggestions
- Popular searches missing
- Typed text doesn't filter suggestions

**Debug Steps:**
1. Check suggestions load:
   ```javascript
   console.log('Suggested searches:', suggestedSearches);
   console.log('Suggestions loaded?', suggestedSearches.length > 0);
   ```

2. Verify categories fetch:
   ```javascript
   const cats = await getCategories();
   console.log('Categories:', cats);
   // Should have: id, name, slug
   ```

3. Check Autocomplete receives options:
   ```javascript
   <Autocomplete
     options={suggestedSearches}
     // ... other props
   />
   console.log('Options passed to Autocomplete:', suggestedSearches);
   ```

4. Test autocomplete filtering:
   ```javascript
   // In Autocomplete component:
   console.log('Input value:', value);
   console.log('Filtered options:', filteredOptions);
   console.log('Open state:', isOpen);
   ```

**Solutions:**
- Wrap getCategories() call in try-catch with fallback
- Verify suggestion objects have `label`, `value`, `type` properties
- Ensure categories have name field
- Check Autocomplete CSS doesn't hide dropdown
- Test with hardcoded suggestions first

**Expected Suggestion Structure:**
```javascript
{
  label: "Electronics",        // Display text
  value: "electronics",        // Internal value
  type: "category"             // 'category', 'popular', 'price', 'feature'
}
```

---

## Common Update Problems

### Problem: Product update fails silently

**Symptoms:**
- Form submits but nothing happens
- No error message shown
- Product list doesn't update
- Console shows no logs

**Debug Steps:**
1. Check loading state:
   ```javascript
   console.log('Loading state:', loading);
   // Should be: false → true → false
   ```

2. Verify form validation:
   ```javascript
   if (!form.title || form.title.length < 3) {
     console.log('Validation failed:', form);
     return;
   }
   ```

3. Check API call:
   ```javascript
   console.log('Calling updateProduct:', { productId, updates: form });
   ```

4. Monitor API response:
   ```javascript
   // Add in updateProduct()
   console.log('Response status:', response.status);
   console.log('Response data:', data);
   ```

**Solutions:**
- Add try/catch with detailed logging
- Verify form data structure matches API expectations
- Check network tab in DevTools for failed requests
- Ensure setLoading(false) in finally block
- Verify toast notifications configured

---

### Problem: Auth token not sent with update request

**Symptoms:**
- 401 Unauthorized error
- "You must be logged in" message
- Update works for some users, not others
- Console shows empty Authorization header

**Debug Steps:**
1. Check session exists:
   ```javascript
   const { data: { session }, error } = await supabase.auth.getSession();
   console.log('Session:', session);
   console.log('Token:', session?.access_token);
   ```

2. Verify token in request:
   ```javascript
   // In updateProduct():
   console.log('Auth token:', token.substring(0, 20) + '...');
   console.log('Headers sent:', {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json'
   });
   ```

3. Check token expiration:
   ```javascript
   // Decode JWT to check exp claim
   const parts = token.split('.');
   const payload = JSON.parse(atob(parts[1]));
   console.log('Token expires at:', new Date(payload.exp * 1000));
   ```

**Solutions:**
- Ensure user is logged in before allowing updates
- Call getSession() fresh before API call
- Refresh token if expired
- Check backend API endpoint requires Bearer token
- Verify Authorization header format exactly

---

### Problem: Optimistic update causes stale UI

**Symptoms:**
- UI updates immediately but with old data
- Refresh shows different (correct) data
- Multiple rapid clicks cause confusion
- Variant changes don't reflect

**Debug Steps:**
1. Check optimistic update logic:
   ```javascript
   setProducts(prev => prev.map(p => 
     p.id === productId ? { ...p, ...updated } : p
   ));
   console.log('Optimistic update applied:', { productId, updated });
   ```

2. Verify API response matches update:
   ```javascript
   const updated = await updateProduct(productId, form);
   console.log('API returned:', updated);
   console.log('Form submitted:', form);
   // Should match
   ```

3. Check state update order:
   ```javascript
   // Order should be: API call → get response → optimistic update → feedback
   const response = await updateProduct(...);
   setProducts(prev => ...);  // ← After API succeeds
   toast({ title: 'Updated' });
   ```

**Solutions:**
- Only apply optimistic update after successful API response
- Return full updated object from API
- Don't update state before API call
- Verify form data format matches database schema
- Test with network throttling

---

### Problem: Form validation not preventing submission

**Symptoms:**
- Invalid data sent to API
- Empty titles accepted
- Negative prices stored
- API errors after form bypass

**Debug Steps:**
1. Check validation runs:
   ```javascript
   if (!form.title || form.title.length < 3) {
     console.log('Validation failed - returning');
     toast({ title: 'Validation Error', ... });
     return;  // ← Check this executes
   }
   ```

2. Verify validation rules match requirements:
   ```javascript
   const validationRules = {
     title: form.title?.length >= 3,
     price: form.price_in_cents >= 0,
     inventory: Number.isInteger(form.inventory_quantity)
   };
   console.log('Validation results:', validationRules);
   ```

3. Check form data type conversions:
   ```javascript
   console.log({
     title: typeof form.title,           // 'string'
     price: typeof form.price_in_cents,  // 'number'
     inventory: typeof form.inventory_quantity  // 'number'
   });
   ```

**Solutions:**
- Add explicit validation function
- Type-convert inputs: `Number()`, `String()`, `Boolean()`
- Test each validation rule independently
- Return early if validation fails
- Show user-friendly error message for each field

---

## Performance Issues

### Problem: Filters slow to respond

**Symptoms:**
- UI lags when selecting filter
- Search results delayed
- Autocomplete suggests slowly
- Many requests in network tab

**Solutions:**
- **Debounce search** - Wait 300ms after user stops typing
  ```javascript
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearchChange = (value) => {
    clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      setSearchQuery(value);
    }, 300));
  };
  ```

- **Memoize filtered options** - Already done in Autocomplete
- **Limit suggestions** - Use `maxSuggestions={8}`
- **Lazy load images** - Use IntersectionObserver or `loading="lazy"`
- **Pagination** - Keep at 24 items/page

### Problem: Too many API requests

**Symptoms:**
- Network tab shows many getProducts calls
- API rate limits hit
- Database under heavy load
- Lag with multiple users

**Debug:**
```javascript
console.log('ProductsList effect triggered for:', {
  sellerId, categoryId, searchQuery, priceRange, sortBy, page
});
```

**Solutions:**
- Check all dependencies in useEffect are needed
- Don't include functions in dependencies (memoize them)
- Debounce rapid filter changes
- Only re-fetch on actual changes
- Consider caching popular searches

---

## Database/Schema Issues

### Problem: Wrong column names cause "column not found"

**Symptoms:**
- 500 errors in API
- "column does not exist" errors
- Null results despite data existing
- Different results than expected

**Debug Steps:**
1. Verify actual schema:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns
   WHERE table_name = 'vendor_products';
   ```

2. Check expected columns:
   - `id` (uuid or int)
   - `title` (text)
   - `description` (text)
   - `base_price` (numeric)
   - `category_id` (int)
   - `vendor_id` (uuid)
   - `created_at` (timestamp)
   - `image_url` (text, optional)

3. For variants:
   - `product_id` (references products)
   - `price_in_cents` (integer)
   - `price` (numeric, optional)
   - `inventory_quantity` (integer)

**Solutions:**
- Update column names in getProducts() to match schema
- Add missing columns if needed
- Migrate data if columns renamed
- Use `SELECT *` to inspect actual data structure

---

## Browser/Environment Issues

### Problem: Filters work in dev but not in production

**Symptoms:**
- Localhost works fine
- Deployed version broken
- Different API URLs
- CORS errors

**Debug Steps:**
1. Check API_BASE_URL:
   ```javascript
   // In environment.js or config:
   console.log('API_BASE_URL:', API_BASE_URL);
   ```

2. Verify in network tab:
   - Actual request URL shown
   - Should match deployment API endpoint
   - Should have `/api` in path

3. Check CORS headers:
   - Look for "Access-Control-Allow-Origin" in response headers
   - Should include your deployed domain

**Solutions:**
- Verify environment variables set correctly in deployment
- Check API_BASE_URL includes protocol (http/https)
- Ensure backend API is running
- Add CORS headers to backend if needed
- Test with production API endpoint locally

---

## Testing Checklist

Use this to verify all filters work:

```javascript
// Test each filter independently
const tests = [
  { name: 'No filters', filters: {} },
  { name: 'Category only', filters: { categoryId: 1 } },
  { name: 'Search only', filters: { searchQuery: 'laptop' } },
  { name: 'Price only', filters: { priceRange: '50-200' } },
  { name: 'Sort only', filters: { sortBy: 'price-low' } },
  { name: 'Category + Price', filters: { categoryId: 1, priceRange: '50-200' } },
  { name: 'Search + Sort', filters: { searchQuery: 'laptop', sortBy: 'newest' } },
  { name: 'All filters', filters: { 
    categoryId: 1, 
    searchQuery: 'laptop', 
    priceRange: '50-200', 
    sortBy: 'price-low' 
  } },
];

for (const test of tests) {
  console.log(`Testing: ${test.name}`);
  const result = await getProducts(test.filters);
  console.log(`Results: ${result.products.length} products`);
  if (result.products.length > 0) {
    console.log(`First product:`, result.products[0]);
  }
}
```

---

## Still Having Issues?

### Debugging Checklist:
1. ✓ Check console for errors (Ctrl+Shift+J)
2. ✓ Open DevTools Network tab
3. ✓ Check API responses (JSON preview)
4. ✓ Verify database has data (SQL query)
5. ✓ Test API endpoint directly (curl or Postman)
6. ✓ Check environment variables set
7. ✓ Clear browser cache and reload
8. ✓ Verify authentication status
9. ✓ Check RLS policies allow access
10. ✓ Review recent code changes

### Resources:
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [MDN Network Tab Guide](https://developer.mozilla.org/en-US/docs/Tools/Network_Monitor)


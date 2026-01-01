# Quick Implementation Reference - Filters & Updates

## Filter Flow Diagram

```
MarketplacePage (State Management)
├── State Variables
│   ├── searchQuery
│   ├── selectedCategory / selectedCategoryId
│   ├── priceRange
│   ├── sortBy
│   └── viewMode
│
├── Load Categories on Mount
│   └── Generate Suggestions (Category + Popular + Price)
│
└── Pass to ProductsList
    ├── categoryId={selectedCategoryId}
    ├── searchQuery={searchQuery}
    ├── priceRange={priceRange}
    ├── sortBy={sortBy}
    └── viewMode={viewMode}
         │
         └─> ProductsList
             ├── Call getProducts(filters)
             ├── Normalize priceRange
             ├── Handle pagination
             └── Render with view mode (grid/list)
```

## API Call Flow

```
ProductsList
├── useEffect [dependency: all filters]
├── Normalize priceRange token
├── Call: getProducts({
│   ├── sellerId,
│   ├── categoryId,
│   ├── searchQuery,
│   ├── priceRange: normalized,
│   ├── sortBy,
│   ├── page,
│   └── perPage: 24
│ })
├── Update state
│   ├── setProducts(resp.products)
│   ├── setTotal(resp.total)
│   ├── setLoading(false)
│   └── setError(null)
└── Render output (loading/error/empty/products)
```

## Key Filter Transformations

### Price Range Token Mapping
```
Input (String)          →  Output (Token)       →  API Behavior
"all"                   →  "all"                →  No price filter
"All"/"ALL"             →  "all"                →  No price filter
"Under $50"             →  "under-50"           →  max: $50 * 100 cents
"$50-$200"              →  "50-200"             →  min: $50*100, max: $200*100
"Over $500"             →  "over-500"           →  min: $500 * 100 cents
```

### Category ID Resolution
```
User Selects "Electronics" →
  1. Find in categories array: categories.find(c => c.name.toLowerCase() === 'electronics')
  2. Extract: cat.id (numeric) and cat.slug (string)
  3. Store: selectedCategory = cat.slug, selectedCategoryId = cat.id
  4. Pass to API: categoryId={selectedCategoryId}
```

### Search Query Processing
```
User Input: "Gaming Laptop"
  ↓
Trim whitespace
  ↓
API Query: title.ilike.%Gaming Laptop% OR description.ilike.%Gaming Laptop%
  ↓
Case-insensitive partial match on both fields
```

## ProductsList Props Expected

```javascript
{
  sellerId: null,                    // Optional: vendor ID
  categoryId: 42,                    // Optional: category numeric ID
  searchQuery: "laptop",             // Optional: search text
  priceRange: "50-200",              // Optional: normalized price token
  sortBy: "newest",                  // Optional: sort option
  viewMode: "grid",                  // "grid" or "list"
  page: 1,                           // Optional: page number
  perPage: 24                        // Optional: items per page
}
```

## API Functions Reference

### getProducts(options)
```javascript
// Returns: { products: [], total: number }

// Usage:
const { products, total } = await getProducts({
  sellerId: "vendor-123",
  categoryId: 5,
  searchQuery: "boots",
  priceRange: "50-200",
  sortBy: "price-low",
  page: 1,
  perPage: 24
});
```

**Filtering Logic:**
- Price range applies to both `base_price` and product variants
- Search uses full-text matching on title + description
- Categories matched by ID or slug
- Sorting: "newest" (default), "oldest", "title_asc", "title_desc"

### updateProduct(productId, updates)
```javascript
// Returns: updated product object

// Usage:
const updated = await updateProduct(productId, {
  title: "New Title",
  description: "New Description",
  category: "Electronics",
  image: "url-to-image",
  variants: [
    {
      id: "var-1",
      title: "Size M",
      price_in_cents: 9999,
      inventory_quantity: 50
    }
  ]
});

// Requires: User session with auth token
// Error handling: Throws on network/auth/validation errors
```

### getCategories()
```javascript
// Returns: array of category objects

// Usage:
const categories = await getCategories();
// [
//   { id: 1, name: "Electronics", slug: "electronics" },
//   { id: 2, name: "Clothing", slug: "clothing" },
//   ...
// ]
```

### getVendors()
```javascript
// Returns: array of vendor objects (for featured section)

const vendors = await getVendors();
// [
//   { id: "v1", name: "Store A", owner_id: "user-123", ... },
//   ...
// ]
```

## State Update Pattern

### When User Changes Filter
```javascript
// 1. Update state immediately
setSortBy("price-low");

// 2. Component dependency triggers useEffect
// 3. ProductsList refetches with new filters
// 4. Loading state shows skeleton
// 5. New products render
```

### When User Submits Form

```javascript
try {
  setLoading(true);      // Show loading indicator
  
  // Validate
  if (!form.title || form.title.length < 3) {
    toast("Title required");
    return;
  }
  
  // Call API
  const updated = await updateProduct(productId, form);
  
  // Optimistic update
  setProducts(prev => prev.map(p => p.id === productId ? updated : p));
  
  // Feedback
  toast("Updated successfully!");
  
} catch (err) {
  toast(`Error: ${err.message}`);
  
} finally {
  setLoading(false);     // Hide loading
  setOpen(false);        // Close modal
}
```

## Common Filter Combinations

### "Electronics under $50"
```javascript
{
  categoryId: 1,         // Electronics
  priceRange: "under-50",
  searchQuery: ""
}
```

### "Search for 'iphone' sorted by rating"
```javascript
{
  searchQuery: "iphone",
  sortBy: "rating",
  priceRange: "all",
  categoryId: null
}
```

### "Clothing between $50-$200"
```javascript
{
  categoryId: 2,         // Clothing
  priceRange: "50-200",
  sortBy: "newest"
}
```

### "All products sorted by price low to high"
```javascript
{
  searchQuery: "",
  categoryId: null,
  priceRange: "all",
  sortBy: "price-low"
}
```

## Autocomplete Suggestion Flow

```javascript
// On component mount:
useEffect(() => {
  const cats = await getCategories();
  
  const categorySuggestions = cats.map(cat => ({
    label: cat.name,           // "Electronics"
    value: cat.name.toLowerCase(),
    type: "category",
    // Used when selected:
    // setSelectedCategory(cat.slug)
    // setSelectedCategoryId(cat.id)
  }));
  
  const popularSuggestions = [
    { label: 'Electronics', value: 'electronics', type: 'popular' },
    { label: 'Under $50', value: 'under-50', type: 'price' },
    ...
  ];
  
  setSuggestedSearches([...popular, ...categories].slice(0, 10));
}, []);

// When user selects suggestion:
<Autocomplete
  onSelect={(option) => {
    if (option.type === 'category') {
      // Find category and set both slug and ID
      const cat = categories.find(c => c.name.toLowerCase() === option.value);
      setSelectedCategory(cat.slug);
      setSelectedCategoryId(cat.id);
    } else if (option.type === 'price') {
      setPriceRange(option.value);
    }
    setSearchQuery(option.label);  // Display text in search box
  }}
/>
```

## Troubleshooting Filters

### Products not filtering by category
- ✓ Check `selectedCategoryId` is numeric (not slug)
- ✓ Verify category exists in database
- ✓ Check `categoryId` is passed to `getProducts()`

### Search not working
- ✓ Verify `searchQuery` has trim().length > 0
- ✓ Check fields (title + description) exist in database
- ✓ Use `ilike` for case-insensitive matching

### Price filtering missing results
- ✓ Check price is stored in cents (not dollars)
- ✓ Verify token format: "50-200" or "under-50"
- ✓ Check both base_price and variants are included

### Sorting not applied
- ✓ For "newest": use `created_at DESC`
- ✓ For "price-low": client-side sort after fetch
- ✓ Verify sort option value matches API expectations

## Mobile Responsive Behavior

### Desktop (lg and above)
- Search bar full width at top
- Sidebar with filters on left (sticky)
- Products on right
- Quick links in sidebar

### Tablet (md)
- Search bar full width
- Filters collapsible below search
- 2-3 columns product grid
- Quick links in filter section

### Mobile (below md)
- Search bar full width
- Filters in collapsible drawer
- 1 column product list
- Quick links in drawer
- Drawer toggles via button

## Performance Tips

1. **Debounce search** if real-time (currently user-triggered)
2. **Memoize autocomplete options** with useMemo (already done)
3. **Lazy load images** in product cards
4. **Paginate results** (already 24/page)
5. **Cache categories** on initial load
6. **Avoid re-renders** with proper dependency arrays

## Testing Checklist

- [ ] Filter by category alone
- [ ] Filter by price range alone
- [ ] Filter by search query alone
- [ ] Combine multiple filters
- [ ] Sort by each option
- [ ] Toggle grid/list view
- [ ] Clear all filters
- [ ] Check pagination
- [ ] Test on mobile/tablet/desktop
- [ ] Test autocomplete suggestions
- [ ] Test error states
- [ ] Test empty states
- [ ] Test loading states

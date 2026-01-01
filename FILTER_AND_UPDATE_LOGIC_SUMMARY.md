# Marketplace Filter and Data Update Logic - Detailed Summary

## Table of Contents
1. [Filter Implementation](#filter-implementation)
2. [State Variables](#state-variables)
3. [ProductsList Component](#productslist-component)
4. [Special Filtering Logic](#special-filtering-logic)
5. [Search Autocomplete](#search-autocomplete)
6. [Filter UI Components](#filter-ui-components)
7. [Data Update Logic](#data-update-logic)
8. [Error Handling & Validation](#error-handling--validation)
9. [Loading States & Optimistic Updates](#loading-states--optimistic-updates)

---

## Filter Implementation

### Overview
The marketplace implements a **multi-layered filtering system** that combines frontend state management with backend API queries. Filters are applied progressively with validation at each stage.

### Filter Types
1. **Search Query** - Full-text search on product title and description
2. **Category** - Category ID-based filtering
3. **Price Range** - Multiple predefined ranges with variant-based matching
4. **Sort Order** - Server-side and client-side sorting options
5. **View Mode** - Grid or list view (UI only, doesn't affect API)

---

## State Variables

### MarketplacePage.jsx Filter State

```javascript
const [searchQuery, setSearchQuery] = useState('');           // Current search text
const [selectedCategory, setSelectedCategory] = useState('all'); // Category slug/value
const [selectedCategoryId, setSelectedCategoryId] = useState(null); // Category numeric ID
const [priceRange, setPriceRange] = useState('all');         // Price range token
const [sortBy, setSortBy] = useState('newest');              // Sort option value
const [viewMode, setViewMode] = useState('grid');            // 'grid' or 'list'
const [showFilters, setShowFilters] = useState(false);       // Mobile filter visibility
const [categories, setCategories] = useState([]);            // Available categories
const [featured, setFeatured] = useState([]);                // Featured products
const [vendors, setVendors] = useState([]);                  // Featured vendors
const [suggestedSearches, setSuggestedSearches] = useState([]); // Search suggestions
```

### Price Range Options
```javascript
const priceRanges = ['All', 'Under $50', '$50-$200', '$200-$500', 'Over $500'];
```

### Sort Options
```javascript
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Popular' }
];
```

---

## ProductsList Component

### Props Received from MarketplacePage
```javascript
ProductsList({
  categoryId={selectedCategoryId}           // Numeric category ID
  searchQuery={searchQuery}                 // Text search
  priceRange={priceRange}                  // Price range token
  sortBy={sortBy}                          // Sort option
  viewMode={viewMode}                      // 'grid' or 'list'
  sellerId={null}                          // Optional: filter by vendor
})
```

### ProductsList Internal State
```javascript
const [products, setProducts] = useState([]);     // Fetched products
const [loading, setLoading] = useState(true);     // Loading state
const [error, setError] = useState(null);         // Error message
const [page, setPage] = useState(1);              // Current page number
const [perPage] = useState(24);                   // Items per page
const [total, setTotal] = useState(null);         // Total product count
```

### Product Fetching Logic

```javascript
useEffect(() => {
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Normalize price range parameter
      const normalizePriceRange = (pr) => {
        if (!pr) return 'all';
        const p = String(pr).toLowerCase();
        if (p.includes('under')) return 'under-50';
        if (p.includes('over')) return 'over-500';
        const nums = p.match(/(\d+)/g);
        if (nums && nums.length >= 2) return `${nums[0]}-${nums[1]}`;
        return 'all';
      };

      const prToken = normalizePriceRange(priceRange);
      
      // Call API with normalized filters
      const resp = await getProducts({
        sellerId,
        categoryId,
        searchQuery,
        priceRange: prToken,
        sortBy,
        page,
        perPage
      });

      if (!resp.products || resp.products.length === 0) {
        setProducts([]);
        setTotal(resp.total || 0);
        return;
      }

      setProducts(resp.products);
      setTotal(resp.total ?? null);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  fetchProducts();
}, [sellerId, categoryId, searchQuery, priceRange, page]);
```

### Rendering Logic
- **Loading State**: Shows skeleton loaders
- **Error State**: Displays error message with retry button
- **Empty State**: Shows different message based on whether filters are active
- **Success State**: Renders products in grid or list layout with pagination

---

## Special Filtering Logic

### 1. Price Range Filtering

The system implements **sophisticated price matching** that handles both base prices and variant prices:

```javascript
const parsePriceRange = (prToken) => {
  if (!prToken) return { min: null, max: null };
  const pr = String(prToken).toLowerCase();
  let min = null, max = null;
  
  if (pr.startsWith('under')) {
    const num = parseInt(pr.replace(/[^0-9]/g, ''), 10);
    max = isNaN(num) ? null : num * 100;  // Convert to cents
  } else if (pr.startsWith('over')) {
    const num = parseInt(pr.replace(/[^0-9]/g, ''), 10);
    min = isNaN(num) ? null : num * 100;
  } else if (pr.includes('-')) {
    const parts = pr.match(/(\d+)/g);
    if (parts && parts.length >= 2) {
      min = parseInt(parts[0], 10) * 100;
      max = parseInt(parts[1], 10) * 100;
    }
  }
  return { min, max };
};
```

**Price Matching Strategy:**
- Base price filtering applied to `base_price` column
- Variant prices checked from `product_variants` table
- Results **unioned** between base-price matches and variant-matched products
- Supports both `price_in_cents` and `price` fields

### 2. Search Query Filtering

Implements **full-text search** with OR logic:

```javascript
if (searchQuery && String(searchQuery).trim().length > 0) {
  const searchQueryStr = String(searchQuery).trim();
  query = query.or(`title.ilike.%${searchQueryStr}%,description.ilike.%${searchQueryStr}%`);
}
```

- Case-insensitive matching using `ilike`
- Searches both title and description fields
- Matches partial strings (% wildcards)

### 3. Category Filtering

Supports both numeric IDs and slug-based matching:

```javascript
if (categoryId) {
  const cid = Number.isInteger(Number(categoryId)) ? Number(categoryId) : categoryId;
  query = query.eq('category_id', cid);
} else if (options.categorySlug) {
  const slug = String(options.categorySlug).trim();
  query = query.or(`metadata->>category.ilike.%${slug}%,title.ilike.%${slug}%`);
}
```

### 4. Sorting Logic

**Server-side sorting:**
- `newest` - Orders by `created_at DESC` (default)
- `oldest` - Orders by `created_at ASC`
- `title_asc` - Orders by `title ASC`
- `title_desc` - Orders by `title DESC`

**Client-side sorting indicators:**
- `price_asc` - Fetches all results, sorts by price ascending
- `price_desc` - Fetches all results, sorts by price descending
- `rating_asc` / `rating_desc` - Prepared for rating-based sorting

Client-side sorting defers pagination until after sorting is applied.

---

## Search Autocomplete

### Suggestion Generation (MarketplacePage.jsx)

```javascript
useEffect(() => {
  let mounted = true;
  const fetch = async () => {
    try {
      const cats = await getCategories();
      if (!mounted) return;
      setCategories(cats || []);
      
      // Generate category-based suggestions
      const categorySuggestions = (cats || []).map(cat => ({
        label: cat.name,
        value: cat.name.toLowerCase(),
        type: 'category'
      }));

      // Add popular search terms
      const popularSuggestions = [
        { label: 'Electronics', value: 'electronics', type: 'popular' },
        { label: 'Clothing', value: 'clothing', type: 'popular' },
        { label: 'Home & Garden', value: 'home-garden', type: 'popular' },
        { label: 'Under $50', value: 'under-50', type: 'price' },
        { label: 'Free Shipping', value: 'free-shipping', type: 'feature' },
      ];

      // Combine and limit
      const suggestions = [...popularSuggestions, ...categorySuggestions].slice(0, 10);
      setSuggestedSearches(suggestions);
    } catch (err) {
      console.warn('Failed to load categories', err);
      // Fallback suggestions
      setSuggestedSearches([
        { label: 'Electronics', value: 'electronics', type: 'popular' },
        { label: 'Clothing', value: 'clothing', type: 'popular' },
        { label: 'Home & Garden', value: 'home-garden', type: 'popular' },
      ]);
    }
  };
  fetch();
  return () => { mounted = false };
}, []);
```

### Suggestion Structure
Each suggestion is an object with:
- `label` - Display text
- `value` - Internal value
- `type` - 'category' | 'popular' | 'price' | 'feature'

### Autocomplete Component Features

The `Autocomplete` component provides:

**Filtering Algorithm:**
```javascript
const filtered = options.filter(option => {
  const optionText = option.label.toLowerCase();
  return optionText.includes(searchTerm) ||
         optionText.split(' ').some(word => word.startsWith(searchTerm));
});
```

**Relevance Sorting:**
1. **Exact matches** - Highest priority
2. **Prefix matches** - Second priority (starts with search term)
3. **Contains matches** - Sorted by length (shorter = more relevant)

**Features:**
- Fuzzy matching with word-level prefix detection
- Keyboard navigation (arrow keys, Enter, Escape)
- Text highlighting on matches
- Maximum 8 suggestions by default (configurable)
- Loading state with spinner
- Clear button for quick reset
- Accessible with ARIA attributes

**Key Props:**
```javascript
<Autocomplete
  options={suggestedSearches}
  value={searchQuery}
  onChange={setSearchQuery}
  onSelect={(option) => {
    // Handle category/price selection
    if (option.type === 'category') {
      const cat = categories.find(c => c.name.toLowerCase() === option.value);
      if (cat) {
        setSelectedCategory(cat.slug || cat.name.toLowerCase());
        setSelectedCategoryId(cat.id);
        setPriceRange('all');
      }
    } else if (option.type === 'price') {
      setPriceRange(option.value);
    }
    setSearchQuery(option.label);
  }}
  placeholder="Search for items, categories, or brands..."
  maxSuggestions={10}
  highlightMatches={true}
/>
```

---

## Filter UI Components

### 1. Desktop Search Bar (lg:col-span-12)

```jsx
<div className="bg-card rounded-lg p-6 shadow border space-y-4">
  <div className="flex flex-col lg:flex-row gap-4">
    <div className="flex-1">
      <Autocomplete {/* search component */} />
    </div>
    <div className="flex flex-wrap gap-2">
      {/* Filters toggle button with active indicator */}
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 relative"
      >
        <SlidersHorizontal className="w-4 h-4" />
        {(selectedCategory !== 'all' || priceRange !== 'all' || sortBy !== 'newest') && (
          <span className="absolute -top-1 -right-1 bg-primary text-xs rounded-full h-5 w-5 flex items-center justify-center">!</span>
        )}
      </Button>
      {/* Grid/List view toggle */}
      <div className="flex border rounded-lg">
        <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm">
          <Grid className="w-4 h-4" />
        </Button>
        <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm">
          <List className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </div>

  {/* Advanced Filters - Collapsible */}
  {showFilters && (
    <motion.div className="border-t pt-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sort dropdown */}
        <div>
          <label className="text-sm font-medium mb-2 block">Sort by</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        
        {/* Category dropdown */}
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <select value={selectedCategory} onChange={(e) => {
            const val = e.target.value;
            setSelectedCategory(val);
            if (val === 'all') setSelectedCategoryId(null);
            else {
              const cat = categories.find(c => c.slug === val || c.name.toLowerCase() === val);
              setSelectedCategoryId(cat ? cat.id : null);
            }
          }}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.slug || cat.name.toLowerCase()}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Price range dropdown */}
        <div>
          <label className="text-sm font-medium mb-2 block">Price Range</label>
          <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
            {priceRanges.map(range => (
              <option key={range} value={range.toLowerCase()}>{range}</option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  )}
</div>
```

### 2. Desktop Sidebar (lg:col-span-3, sticky)

Contains duplicate filter controls and quick links:

```jsx
<aside className="hidden lg:block lg:col-span-3 sticky top-28 self-start">
  {/* Active Filters Card */}
  <div className="bg-card rounded-lg p-4 shadow border">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold">Active Filters</h3>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setSelectedCategory('all');
          setSelectedCategoryId(null);
          setPriceRange('all');
          setSearchQuery('');
          setSortBy('newest');
        }}
      >
        Clear All
      </Button>
    </div>
    {/* Sort, Category, Price selects */}
  </div>

  {/* Quick Links */}
  <QuickLinks
    links={[
      { href: '/marketplace?category=electronics', label: 'Electronics' },
      { href: '/marketplace?category=clothing', label: 'Fashion' },
      { href: '/marketplace?category=home-garden', label: 'Home & Garden' },
      { href: '/marketplace?price=under-50', label: 'Under $50' },
      { href: '/marketplace?sort=rating', label: 'Top Rated' },
      { href: '/marketplace?sort=newest', label: 'New Arrivals' },
    ]}
  />
</aside>
```

### 3. Mobile Filter Drawer (lg:hidden)

```jsx
<div className="lg:hidden">
  <Button
    variant="outline"
    onClick={() => setShowFilters(!showFilters)}
    className="w-full mb-4"
  >
    <SlidersHorizontal className="w-4 h-4 mr-2" />
    {showFilters ? 'Hide' : 'Show'} Filters & Quick Links
    {(selectedCategory !== 'all' || priceRange !== 'all' || sortBy !== 'newest') && (
      <span className="ml-2 bg-primary text-xs px-2 py-1 rounded-full">Active</span>
    )}
  </Button>

  {showFilters && (
    <motion.div className="bg-card rounded-lg p-4 shadow border mb-4">
      <div className="space-y-6">
        {/* Active Filters Section */}
        <div>
          {/* Sort, Category, Price selects */}
        </div>

        {/* Quick Links Grid */}
        <div>
          <h3 className="font-semibold mb-3">Quick Links</h3>
          <div className="grid grid-cols-2 gap-2">
            {/* Quick link cards */}
          </div>
        </div>
      </div>
    </motion.div>
  )}
</div>
```

### 4. View Mode Toggle

```jsx
<div className="flex border rounded-lg">
  <Button
    variant={viewMode === 'grid' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => setViewMode('grid')}
  >
    <Grid className="w-4 h-4" />
  </Button>
  <Button
    variant={viewMode === 'list' ? 'default' : 'ghost'}
    size="sm"
    onClick={() => setViewMode('list')}
  >
    <List className="w-4 h-4" />
  </Button>
</div>
```

---

## Data Update Logic

### updateProduct Function

**Location:** `src/api/EcommerceApi.js` (lines 787-820)

```javascript
export async function updateProduct(productId, updates) {
  console.log('🔍 updateProduct called with:', { productId, updates });
  
  try {
    // Step 1: Get authentication session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('You must be logged in to update products');
    }
    
    const token = session.access_token;
    
    // Step 2: Call backend API with service role bypass
    const response = await fetch(`${API_BASE_URL}/vendor/products/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    
    // Step 3: Handle response
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Product updated successfully via backend API:', data.product);
    
    return data.product;
  } catch (err) {
    console.error('❌ Product update failed:', err.message);
    throw err;
  }
}
```

**Key Points:**
- Uses **backend API** (not direct Supabase), allowing service role to bypass RLS
- Requires **authentication token** from session
- Updates are **full or partial** (PATCH request)
- Returns updated product object
- Logs all steps for debugging

### updateVendor Function

**Location:** `src/api/EcommerceApi.js` (lines 957-980)

```javascript
export async function updateVendor(vendorId, updates) {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  
  try {
    // Direct Supabase update with RLS
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', vendorId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating vendor ${vendorId}:`, error);
      throw error;
    }
    
    return data;
  } catch (err) {
    console.error(`Failed to update vendor ${vendorId}:`, err);
    throw err;
  }
}
```

**Key Points:**
- Uses **direct Supabase** client (subject to RLS)
- Simpler than product updates (no backend API)
- Returns updated vendor object

---

## Error Handling & Validation

### Form Validation (Vendor Products Page)

**Location:** `src/pages/vendor/Products.jsx` (lines 62-90)

```javascript
const handleSave = async () => {
  // Title validation
  if (!form.title || form.title.length < 3) {
    toast({ 
      title: 'Validation', 
      description: 'Title must be at least 3 characters', 
      variant: 'destructive' 
    });
    return;
  }

  try {
    if (editingId) {
      // Normalize variants for update
      const variantsToSave = (form.variants && form.variants.length) 
        ? form.variants.map((v, i) => ({
            id: v.id || `${editingId}-v${i+1}`,
            title: v.title || `Variant ${i+1}`,
            price_in_cents: Number(v.price_in_cents || 0),
            price_formatted: `$${((Number(v.price_in_cents)||0)/100).toFixed(2)}`,
            inventory_quantity: Number(v.inventory_quantity || 0)
          }))
        : [{
            id: `${editingId}-v1`,
            title: 'Default',
            price_in_cents: form.price_in_cents,
            price_formatted: `$${(form.price_in_cents/100).toFixed(2)}`,
            inventory_quantity: form.inventory_quantity
          }];
      
      const updated = await updateProduct(editingId, {
        title: form.title,
        description: form.description,
        image: form.image,
        category: form.category,
        variants: variantsToSave
      });
      
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...updated } : p));
      toast({ title: 'Product updated' });
    } else {
      // Create new product
      const created = await createProduct(vendor.id, { ...form, variants: variantsToSave });
      setProducts(prev => [created, ...prev]);
      toast({ title: 'Product created' });
    }
    setOpen(false);
  } catch (err) {
    toast({ 
      title: 'Save failed', 
      description: String(err), 
      variant: 'destructive' 
    });
  }
};
```

**Validation Rules:**
- Title must be ≥ 3 characters
- Price and inventory converted to numbers
- Variants normalized (with generated IDs if missing)
- Price formatted for display

### API Error Handling

**PayPal Order Creation Example:**
```javascript
export async function createPayPalOrder(cartItems) {
  try {
    // Validate cart items before sending
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Ensure each item has required fields
    cartItems.forEach(item => {
      if (!item?.variant?.price_in_cents && !item?.product?.base_price) {
        throw new Error('Invalid item in cart - missing price');
      }
    });

    const response = await fetch(`/api/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cartItems })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend create-order failed:', { status: response.status, body: data });
      throw new Error(data?.error || data?.message || 'Failed to create PayPal order');
    }

    if (!data.id) {
      console.error('Missing order ID in response:', data);
      throw new Error('Invalid order response - missing order ID');
    }

    console.log('PayPal order created successfully through backend:', data.id);
    return data.id;
  } catch (error) {
    console.error("Failed to create PayPal order:", error);
    throw error;
  }
}
```

**Error Handling Patterns:**
1. **Pre-validation** - Check data before API call
2. **Response validation** - Check status and required fields
3. **Detailed error messages** - Use data.error or HTTP status
4. **Logging** - Console logs for debugging
5. **Re-throwing** - Let caller handle final error display

---

## Loading States & Optimistic Updates

### ProductsList Loading States

```javascript
if (loading) {
  return (
    <div className="space-y-6">
      <SkeletonGrid count={viewMode === 'list' ? 6 : 8} />
    </div>
  );
}

if (error) {
  return (
    <div className="text-center p-12 bg-destructive/5 rounded-xl border border-destructive/20">
      <div className="text-destructive bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-destructive mb-2">Unable to Load Products</h3>
      <p className="text-destructive/80 mb-6">{error}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => window.location.reload()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button onClick={() => window.history.back()} variant="ghost">
          Go Back
        </Button>
      </div>
    </div>
  );
}

if (products.length === 0) {
  const hasFilters = searchQuery || priceRange !== 'all';
  return (
    <div className="text-center p-12 bg-muted/30 rounded-xl border border-border">
      <h3 className="text-xl font-bold text-foreground mb-3">
        {hasFilters ? 'No Products Match Your Filters' : 'No Products Available Yet'}
      </h3>
      <p className="text-muted-foreground mb-6">
        {hasFilters
          ? 'Try adjusting your search criteria or clearing some filters to discover more products.'
          : 'Our sellers are actively adding new products. Check back soon for the latest items!'
        }
      </p>
      {hasFilters && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.location.href = '/marketplace'}>View All Products</Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
```

### Optimistic Updates (Product Management)

```javascript
const updated = await updateProduct(editingId, updates);

// Immediately update local state before API confirmation
setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...updated } : p));

toast({ title: 'Product updated' });
setOpen(false);
```

**Benefits:**
- Instant UI feedback
- Smoother user experience
- API response confirms the update

### Loading State Management Pattern

```javascript
try {
  setLoading(true);
  setError(null);
  
  // Fetch data
  const resp = await getProducts({ /* filters */ });
  
  if (!resp.products || resp.products.length === 0) {
    setProducts([]);
    setTotal(resp.total || 0);
    return;
  }
  
  setProducts(resp.products);
  setTotal(resp.total ?? null);
} catch (err) {
  setError(err.message || 'Failed to load products');
} finally {
  setLoading(false);  // Always reset loading state
}
```

---

## Implementation Recommendations for Standalone Version

### 1. Ensure API Compatibility
- Verify `getProducts()` function matches the filtering logic (price normalization, search, category)
- Ensure `updateProduct()` calls correct backend endpoint with auth token
- Test `updateVendor()` with RLS policies in place

### 2. Component Structure
- Keep filter state in parent component (MarketplacePage)
- Pass filters as props to ProductsList
- Use controlled inputs for all filter controls

### 3. State Management
- Use `useState` for filter values
- Implement proper cleanup in `useEffect` (mounted flag pattern)
- Debounce search if needed for performance

### 4. Error Handling
- Always validate data before API calls
- Check response status and required fields
- Provide user-friendly error messages
- Log errors for debugging

### 5. User Experience
- Show loading states during fetches
- Use optimistic updates for form submissions
- Provide clear empty states
- Include "Clear All Filters" button
- Show active filter indicators

### 6. Performance
- Implement pagination (24 items per page)
- Use memoization for filtered options (as in Autocomplete)
- Defer client-side sorting to after fetch
- Cache categories on initial load
- Use sticky sidebar on desktop

### 7. Accessibility
- Add ARIA attributes to filters
- Use semantic HTML (label, select, etc.)
- Implement keyboard navigation
- Provide help text for autocomplete

### 8. Price Filtering Details
- Always convert dollars to cents (×100)
- Support both base_price and variant prices
- Union results from base price and variant queries
- Handle "under" and "over" price tokens correctly


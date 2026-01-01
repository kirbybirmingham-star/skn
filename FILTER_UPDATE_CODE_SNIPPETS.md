# Filter & Update Implementation Code Snippets

## Complete getProducts Filter Implementation

This is how filters are applied in the API layer:

```javascript
export async function getProducts(options = {}) {
  if (!supabase) {
    console.warn('Supabase not initialized, returning empty products array');
    return { products: [], total: 0 };
  }

  const { 
    sellerId, 
    categoryId, 
    searchQuery, 
    priceRange, 
    page = 1, 
    perPage = 24, 
    sortBy = 'newest' 
  } = options;

  const per = Number.isInteger(perPage) ? perPage : 24;
  const pg = Math.max(1, parseInt(page, 10) || 1);
  const start = (pg - 1) * per;
  const end = pg * per - 1;

  // Determine if we need client-side sorting
  const sb = String(sortBy || 'newest').toLowerCase();
  const isClientSideSort = sb === 'price_asc' || sb === 'price_desc' || 
                           sb === 'rating_asc' || sb === 'rating_desc';

  // Build base query
  let query = supabase
    .from('vendor_products')
    .select('*', { count: 'exact' });

  // Apply pagination only for server-side sorting
  if (!isClientSideSort) {
    query = query.range(start, end);
  }

  // Apply server-side sorting
  if (!isClientSideSort) {
    switch (sb) {
      case 'oldest': 
        query = query.order('created_at', { ascending: true }); 
        break;
      case 'title_asc': 
        query = query.order('title', { ascending: true }); 
        break;
      case 'title_desc': 
        query = query.order('title', { ascending: false }); 
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }
  }

  // Apply seller filter
  if (sellerId) {
    query = query.eq('vendor_id', sellerId);
  }

  // Apply category filter (supports both ID and slug)
  if (categoryId) {
    const cid = Number.isInteger(Number(categoryId)) ? Number(categoryId) : categoryId;
    query = query.eq('category_id', cid);
  } else if (options.categorySlug) {
    const slug = String(options.categorySlug).trim();
    query = query.or(`metadata->>category.ilike.%${slug}%,title.ilike.%${slug}%`);
  }
  
  // Apply search query filter (title + description)
  if (searchQuery && String(searchQuery).trim().length > 0) {
    const searchQueryStr = String(searchQuery).trim();
    query = query.or(`title.ilike.%${searchQueryStr}%,description.ilike.%${searchQueryStr}%`);
  }
  
  // Apply price range filter - sophisticated variant matching
  const parsePriceRange = (prToken) => {
    if (!prToken) return { min: null, max: null };
    const pr = String(prToken).toLowerCase();
    let min = null, max = null;
    
    if (pr.startsWith('under')) {
      const num = parseInt(pr.replace(/[^0-9]/g, ''), 10);
      max = isNaN(num) ? null : num * 100;  // Convert dollars to cents
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

  const parsedRange = parsePriceRange(priceRange);
  let variantMatchedIds = [];
  
  if (priceRange && priceRange !== 'all') {
    const pr = String(priceRange).toLowerCase();
    try {
      let variantIds = [];
      const pfs = [];
      
      // Build price filters for variants
      if (parsedRange.min != null && parsedRange.max != null) {
        pfs.push(`price_in_cents.gte.${parsedRange.min}`);
        pfs.push(`price_in_cents.lte.${parsedRange.max}`);
        pfs.push(`price.gte.${(parsedRange.min / 100)}`);
        pfs.push(`price.lte.${(parsedRange.max / 100)}`);
      } else if (parsedRange.min != null) {
        pfs.push(`price_in_cents.gte.${parsedRange.min}`);
        pfs.push(`price.gte.${(parsedRange.min / 100)}`);
      } else if (parsedRange.max != null) {
        pfs.push(`price_in_cents.lte.${parsedRange.max}`);
        pfs.push(`price.lte.${(parsedRange.max / 100)}`);
      }
      
      // Query variants for matching prices
      if (pfs.length > 0) {
        const orExpr = pfs.join(',');
        const vr = await supabase.from('product_variants').select('product_id').or(orExpr);
        if (!vr.error && Array.isArray(vr.data)) {
          variantIds = Array.from(new Set(vr.data.map(r => r.product_id).filter(Boolean)));
        }
      }

      // Apply base price constraints
      if (parsedRange.max != null && parsedRange.min == null) {
        query = query.lte('base_price', parsedRange.max);
      } else if (parsedRange.min != null && parsedRange.max == null) {
        query = query.gte('base_price', parsedRange.min);
      } else if (parsedRange.min != null && parsedRange.max != null) {
        query = query.gte('base_price', parsedRange.min);
        query = query.lte('base_price', parsedRange.max);
      }

      if (variantIds.length > 0) {
        variantMatchedIds = variantIds;
      }
    } catch (e) {
      console.warn('Failed to apply variant-based price filtering', e?.message || e);
    }
  }

  // Execute query and handle variant union
  let data, error, count;
  if (variantMatchedIds && variantMatchedIds.length > 0) {
    try {
      const baseRes = await query;
      const baseData = baseRes.error ? [] : (baseRes.data || []);
      
      // Build variant query with same filters
      let variantQ = supabase.from('vendor_products').select('*', { count: 'exact' });
      if (sellerId) variantQ = variantQ.eq('vendor_id', sellerId);
      if (categoryId) variantQ = variantQ.eq('category_id', Number.isInteger(Number(categoryId)) ? Number(categoryId) : categoryId);
      else if (options.categorySlug) {
        const slug = String(options.categorySlug).trim();
        variantQ = variantQ.or(`metadata->>category.ilike.%${slug}%,title.ilike.%${slug}%`);
      }
      if (searchQuery && String(searchQuery).trim().length > 0) {
        const searchQueryStr = String(searchQuery).trim();
        variantQ = variantQ.or(`title.ilike.%${searchQueryStr}%,description.ilike.%${searchQueryStr}%`);
      }
      variantQ = variantQ.in('id', variantMatchedIds);
      
      const variantRes = await variantQ;
      const variantData = variantRes.error ? [] : (variantRes.data || []);
      
      // Combine results (union)
      const combined = [...baseData];
      const ids = new Set(baseData.map(p => p.id));
      variantData.forEach(p => {
        if (!ids.has(p.id)) {
          combined.push(p);
          ids.add(p.id);
        }
      });
      
      data = combined.slice(start, end + 1);
      count = combined.length;
    } catch (e) {
      console.error('Union query failed:', e);
      const baseRes = await query;
      data = baseRes.data || [];
      error = baseRes.error;
      count = baseRes.count;
    }
  } else {
    const res = await query;
    data = res.data;
    error = res.error;
    count = res.count;
  }

  if (error) {
    console.error('Query error:', error);
    return { products: [], total: 0 };
  }

  return {
    products: data || [],
    total: count ?? null
  };
}
```

---

## ProductsList Implementation Pattern

```javascript
import React, { useState, useEffect } from 'react';
import { getProducts, formatCurrency } from '@/api/EcommerceApi';

const ProductsList = ({ 
  sellerId = null, 
  categoryId = null, 
  searchQuery = '', 
  priceRange = 'all', 
  sortBy = 'newest', 
  viewMode = 'grid' 
}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(24);
  const [total, setTotal] = useState(null);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Normalize price range into standard tokens
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
        
        // Call API with all filters
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
  }, [sellerId, categoryId, searchQuery, priceRange, sortBy, page, perPage]);

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Show skeleton loaders */}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center p-12 bg-destructive/5 rounded-xl">
        <p className="text-destructive mb-4">{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Empty state
  if (products.length === 0) {
    const hasFilters = searchQuery || priceRange !== 'all';
    return (
      <div className="text-center p-12">
        <h3 className="text-xl font-bold mb-2">
          {hasFilters ? 'No Products Match Your Filters' : 'No Products Available'}
        </h3>
        <p className="text-muted-foreground">
          {hasFilters
            ? 'Try adjusting your filters to find more products.'
            : 'Check back soon for new products!'}
        </p>
      </div>
    );
  }

  // Success state - render products
  return (
    <div>
      <div className={
        viewMode === 'list'
          ? 'space-y-4'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
      }>
        {products.map((product) => (
          <div key={product.id}>
            {/* ProductCard component */}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > perPage && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          
          {/* Page numbers */}
          {Array.from({ length: Math.ceil(total / perPage) }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={page === p ? 'font-bold' : ''}
            >
              {p}
            </button>
          ))}
          
          <button 
            onClick={() => setPage(p => p + 1)}
            disabled={page >= Math.ceil(total / perPage)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductsList;
```

---

## Update Product Implementation

```javascript
// In your product form or edit modal:

const handleSaveProduct = async (formData) => {
  try {
    // Step 1: Validate form
    if (!formData.title || formData.title.length < 3) {
      toast({ 
        title: 'Validation Error', 
        description: 'Title must be at least 3 characters',
        variant: 'destructive'
      });
      return;
    }

    // Step 2: Show loading state
    setLoading(true);

    // Step 3: Prepare data for API
    const updatePayload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      image: formData.imageUrl,
      variants: formData.variants.map((v, i) => ({
        id: v.id || `${Date.now()}-v${i}`,
        title: v.title || `Variant ${i + 1}`,
        price_in_cents: Math.round(parseFloat(v.price || 0) * 100), // Convert dollars to cents
        inventory_quantity: parseInt(v.quantity || 0),
        price_formatted: `$${(parseFloat(v.price || 0)).toFixed(2)}`
      }))
    };

    // Step 4: Call API
    const updated = await updateProduct(productId, updatePayload);

    // Step 5: Optimistic update - refresh local state immediately
    setProducts(prev => 
      prev.map(p => p.id === productId ? { ...p, ...updated } : p)
    );

    // Step 6: User feedback
    toast({ 
      title: 'Success',
      description: 'Product updated successfully'
    });

    // Step 7: Close form
    setEditDialogOpen(false);

  } catch (err) {
    // Handle error
    console.error('Update failed:', err);
    toast({ 
      title: 'Error',
      description: err.message || 'Failed to update product',
      variant: 'destructive'
    });
  } finally {
    // Step 8: Clear loading state
    setLoading(false);
  }
};
```

---

## Autocomplete with Category Selection

```javascript
import { Autocomplete } from '@/components/ui/autocomplete';

// In MarketplacePage component:

const [searchQuery, setSearchQuery] = useState('');
const [suggestedSearches, setSuggestedSearches] = useState([]);
const [categories, setCategories] = useState([]);
const [selectedCategory, setSelectedCategory] = useState('all');
const [selectedCategoryId, setSelectedCategoryId] = useState(null);
const [priceRange, setPriceRange] = useState('all');

// Load suggestions on mount
useEffect(() => {
  const loadSuggestions = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats || []);
      
      // Create category suggestions
      const categorySuggestions = (cats || []).map(cat => ({
        label: cat.name,
        value: cat.name.toLowerCase(),
        type: 'category'
      }));

      // Add popular searches
      const popularSuggestions = [
        { label: 'Electronics', value: 'electronics', type: 'popular' },
        { label: 'Clothing', value: 'clothing', type: 'popular' },
        { label: 'Home & Garden', value: 'home-garden', type: 'popular' },
        { label: 'Under $50', value: 'under-50', type: 'price' },
        { label: 'Free Shipping', value: 'free-shipping', type: 'feature' },
      ];

      const combined = [...popularSuggestions, ...categorySuggestions].slice(0, 10);
      setSuggestedSearches(combined);
    } catch (err) {
      console.warn('Failed to load suggestions:', err);
      // Set fallback suggestions
      setSuggestedSearches([
        { label: 'Electronics', value: 'electronics', type: 'popular' },
        { label: 'Clothing', value: 'clothing', type: 'popular' },
      ]);
    }
  };
  
  loadSuggestions();
}, []);

// Render autocomplete
<Autocomplete
  options={suggestedSearches}
  value={searchQuery}
  onChange={setSearchQuery}
  onSelect={(option) => {
    // Handle different suggestion types
    if (option.type === 'category') {
      // Find the full category object
      const cat = categories.find(c => c.name.toLowerCase() === option.value);
      if (cat) {
        // Set both slug (for display) and ID (for API)
        setSelectedCategory(cat.slug || cat.name.toLowerCase());
        setSelectedCategoryId(cat.id);
        // Reset price when changing category
        setPriceRange('all');
      }
    } else if (option.type === 'price') {
      // Set price range
      setPriceRange(option.value);
    }
    
    // Update search display
    setSearchQuery(option.label);
  }}
  placeholder="Search for items, categories, or brands..."
  showSuggestions={true}
  maxSuggestions={10}
  highlightMatches={true}
/>
```

---

## Form Validation Pattern

```javascript
// Validation rules
const validateProductForm = (form) => {
  const errors = {};

  // Title validation
  if (!form.title || form.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (form.title.length < 3) {
    errors.title = 'Title must be at least 3 characters';
  } else if (form.title.length > 255) {
    errors.title = 'Title cannot exceed 255 characters';
  }

  // Description validation (optional but recommended)
  if (form.description && form.description.length > 2000) {
    errors.description = 'Description cannot exceed 2000 characters';
  }

  // Price validation
  if (form.price_in_cents !== undefined) {
    const price = form.price_in_cents / 100;
    if (price < 0) {
      errors.price = 'Price cannot be negative';
    } else if (price > 999999.99) {
      errors.price = 'Price is too high';
    }
  }

  // Inventory validation
  if (form.inventory_quantity !== undefined) {
    const qty = form.inventory_quantity;
    if (qty < 0) {
      errors.inventory = 'Quantity cannot be negative';
    } else if (!Number.isInteger(qty)) {
      errors.inventory = 'Quantity must be a whole number';
    }
  }

  // Variants validation
  if (form.variants && Array.isArray(form.variants)) {
    form.variants.forEach((v, i) => {
      if (!v.title || v.title.trim().length === 0) {
        errors[`variant_${i}_title`] = 'Variant title is required';
      }
      if (v.price_in_cents < 0) {
        errors[`variant_${i}_price`] = 'Price cannot be negative';
      }
    });
  }

  return errors;
};

// Usage in form submission
const handleSubmit = async (e) => {
  e.preventDefault();

  // Validate
  const errors = validateProductForm(form);
  if (Object.keys(errors).length > 0) {
    toast({
      title: 'Validation Error',
      description: Object.values(errors)[0],
      variant: 'destructive'
    });
    return;
  }

  // If validation passes, submit
  await handleSaveProduct(form);
};
```

---

## Error Handling Pattern

```javascript
// Generic error handler for API calls
const handleApiError = (error) => {
  console.error('API Error:', error);

  let message = 'An unexpected error occurred';

  if (error.message) {
    if (error.message.includes('not logged in')) {
      message = 'Please log in to perform this action';
      // Redirect to login
      window.location.href = '/login';
    } else if (error.message.includes('unauthorized')) {
      message = 'You do not have permission to perform this action';
    } else if (error.message.includes('not found')) {
      message = 'The requested item was not found';
    } else if (error.message.includes('validation')) {
      message = `Validation Error: ${error.message}`;
    } else {
      message = error.message;
    }
  }

  toast({
    title: 'Error',
    description: message,
    variant: 'destructive'
  });
};

// Usage
try {
  const result = await updateProduct(productId, updates);
} catch (err) {
  handleApiError(err);
}
```


# Visual Implementation Guide

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MARKETPLACE PAGE (React)                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ State Management                                         │   │
│  │ ├─ searchQuery                                           │   │
│  │ ├─ selectedCategory / selectedCategoryId               │   │
│  │ ├─ priceRange                                           │   │
│  │ ├─ sortBy                                               │   │
│  │ ├─ viewMode (grid/list)                                │   │
│  │ ├─ suggestedSearches                                   │   │
│  │ └─ categories                                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ UI Components                                            │   │
│  │ ├─ Autocomplete (with suggestions)                     │   │
│  │ ├─ Filter Dropdowns (sort, category, price)           │   │
│  │ ├─ View Toggle (grid/list)                            │   │
│  │ ├─ Desktop Sidebar (sticky)                           │   │
│  │ └─ Mobile Drawer (collapsible)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ↓                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ProductsList Component                                   │   │
│  │ ├─ Props: categoryId, searchQuery, priceRange, sortBy  │   │
│  │ ├─ State: products, loading, error, page, total        │   │
│  │ └─ Effect: Triggered on any filter change             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│                              ↓                                    │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ↓
        ┌──────────────────────────────────────────┐
        │   EcommerceApi.js - getProducts()       │
        │                                          │
        │  ┌───────────────────────────────────┐  │
        │  │ Normalize Inputs                  │  │
        │  │ ├─ Price range token              │  │
        │  │ ├─ Category ID                    │  │
        │  │ └─ Sort option value              │  │
        │  └───────────────────────────────────┘  │
        │                │                         │
        │                ↓                         │
        │  ┌───────────────────────────────────┐  │
        │  │ Build Supabase Query              │  │
        │  │ ├─ Start: SELECT * FROM vendor..  │  │
        │  │ ├─ Apply: category_id =           │  │
        │  │ ├─ Apply: title ILIKE / desc ILIKE│  │
        │  │ ├─ Apply: base_price >= / <=      │  │
        │  │ └─ Order: created_at DESC etc     │  │
        │  └───────────────────────────────────┘  │
        │                │                         │
        │                ↓                         │
        │  ┌───────────────────────────────────┐  │
        │  │ Price: Handle Variants            │  │
        │  │ ├─ Query product_variants table   │  │
        │  │ ├─ Find products in price range   │  │
        │  │ └─ Union with base price results  │  │
        │  └───────────────────────────────────┘  │
        │                │                         │
        │                ↓                         │
        │  ┌───────────────────────────────────┐  │
        │  │ Execute Query                     │  │
        │  │ ├─ Run Supabase query             │  │
        │  │ ├─ Get count (total)              │  │
        │  │ └─ Get paginated results          │  │
        │  └───────────────────────────────────┘  │
        │                │                         │
        │                ↓                         │
        │  ┌───────────────────────────────────┐  │
        │  │ Return Results                    │  │
        │  │ ├─ products: []                   │  │
        │  │ └─ total: number                  │  │
        │  └───────────────────────────────────┘  │
        │                                          │
        └──────────────────────────────────────────┘
                               │
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE DATABASE                              │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  categories      │  │  vendor_products │                    │
│  │ ├─ id (int)      │  │ ├─ id            │                    │
│  │ ├─ name          │  │ ├─ title         │                    │
│  │ └─ slug          │  │ ├─ description   │                    │
│  └──────────────────┘  │ ├─ base_price    │                    │
│                        │ ├─ category_id   │                    │
│  ┌──────────────────┐  │ ├─ vendor_id     │                    │
│  │ product_variants │  │ ├─ created_at    │                    │
│  │ ├─ id            │  │ └─ image_url     │                    │
│  │ ├─ product_id    │  └──────────────────┘                    │
│  │ ├─ price_in_cents│                                          │
│  │ ├─ price         │  ┌──────────────────┐                    │
│  │ └─ inventory_qty │  │  vendors         │                    │
│  └──────────────────┘  │ ├─ id            │                    │
│                        │ ├─ name          │                    │
│                        │ ├─ owner_id      │                    │
│                        │ └─ slug          │                    │
│                        └──────────────────┘                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Filter Flow Diagram

```
USER INTERACTION
    │
    ├─→ Type in search box
    │   └─→ setSearchQuery(value)
    │
    ├─→ Select category dropdown
    │   └─→ setSelectedCategory(slug)
    │   └─→ setSelectedCategoryId(id)
    │
    ├─→ Select price range dropdown
    │   └─→ setPriceRange(value)
    │
    ├─→ Select sort option
    │   └─→ setSortBy(value)
    │
    ├─→ Toggle grid/list view
    │   └─→ setViewMode('grid' | 'list')
    │
    └─→ Click "Clear All Filters"
        └─→ Reset all state to defaults
            │
            └─→ REACT COMPONENT RE-RENDERS
                │
                └─→ useEffect [dependencies] fires
                    │
                    ├─→ setLoading(true)
                    ├─→ setError(null)
                    │
                    └─→ Call getProducts({
                        categoryId,
                        searchQuery,
                        priceRange: normalized,
                        sortBy,
                        page: 1,
                        perPage: 24
                    })
                        │
                        └─→ SUPABASE QUERIES EXECUTE
                            │
                            ├─→ Base query construction
                            ├─→ Apply filters
                            ├─→ Check variants (if price filter)
                            ├─→ Union results
                            └─→ Execute and return
                                │
                                └─→ RESPONSE RECEIVED
                                    │
                                    ├─→ setProducts(results)
                                    ├─→ setTotal(count)
                                    └─→ setLoading(false)
                                        │
                                        └─→ RENDER NEW PRODUCTS
                                            │
                                            ├─→ If loading: show skeleton
                                            ├─→ If error: show error with retry
                                            ├─→ If empty: show "no results"
                                            └─→ If success: show products
                                                ├─→ Grid: 3-4 columns (desktop)
                                                ├─→ List: Full width rows
                                                └─→ With pagination controls
```

---

## Price Range Transformation

```
INPUT                          NORMALIZED TOKEN              SUPABASE QUERY

User Selects:
"All"                       →   "all"                    →   No price filter
"Under $50"                 →   "under-50"               →   base_price ≤ 5000
                                                         +    AND product_variants
                                                              price_in_cents ≤ 5000
                                                         
"$50-$200"                  →   "50-200"                 →   base_price >= 5000
                                                         AND base_price ≤ 20000
                                                         + Union with variants
                                                         
"Over $500"                 →   "over-500"               →   base_price >= 50000
                                                         + Union with variants
                                                         
[Display: "$50-$200"]       →   "50-200"                 →   Numeric range query
```

---

## Category Selection Flow

```
User selects "Electronics" from dropdown
    │
    ├─→ Find category in categories array:
    │   categories.find(c => c.slug === 'electronics')
    │   Result: { id: 1, name: 'Electronics', slug: 'electronics' }
    │
    ├─→ setSelectedCategory('electronics')          // For display/URL
    │
    ├─→ setSelectedCategoryId(1)                    // For API query
    │
    └─→ ProductsList receives: categoryId={1}
        │
        └─→ getProducts() query:
            .eq('category_id', 1)
```

---

## Search Suggestion Flow

```
                    ON COMPONENT MOUNT
                           │
                           ↓
                    await getCategories()
                           │
    ┌──────────────────────┼──────────────────────┐
    │                      │                      │
    ↓                      ↓                      ↓
Popular Searches    Category Suggestions   Price Suggestions
├─ Electronics       ├─ [cat1.name, ...]    ├─ Under $50
├─ Clothing         ├─ [cat2.name, ...]    ├─ $50-$200
├─ Home & Garden    └─ [catN.name, ...]    └─ etc.
└─ etc.
    │                      │                      │
    └──────────────────────┴──────────────────────┘
                           │
                           ↓
                    Combine & limit to 10
                           │
                  setSuggestedSearches([
                    { label: 'Electronics', value: 'electronics', type: 'popular' },
                    { label: 'Clothing', value: 'clothing', type: 'popular' },
                    { label: 'Home & Garden', value: 'home-garden', type: 'popular' },
                    { label: 'Electronics', value: 'electronics', type: 'category' },
                    { label: 'Clothing', value: 'clothing', type: 'category' },
                    { label: 'Under $50', value: 'under-50', type: 'price' },
                    ...
                  ])
                           │
                           ↓
                    USER TYPES IN SEARCH
                           │
                           ↓
                    Autocomplete filters by:
                    1. Exact match       → "electronics" === "electronics"
                    2. Prefix match      → "elec..." starts with "e"
                    3. Contains match    → "electron..." contains "e"
                    Sorted by relevance (shorter = more relevant)
                           │
                           ↓
                    Shows max 8 suggestions
                           │
                    USER CLICKS SUGGESTION
                           │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ↓                   ↓                   ↓
    type: 'category'  type: 'price'      type: 'popular'
        │                   │                   │
        ├─ Find category    ├─ setPriceRange   └─ setSearchQuery
        ├─ setCategory      │   (option.value)    (option.label)
        └─ setSearchQuery   │
           (option.label)   └─ setSearchQuery
                               (option.label)
```

---

## Responsive Layout Breakdown

### DESKTOP (lg+)
```
┌─────────────────────────────────────────────────────────────┐
│  Logo                           Search & Filters            │
├───────────────────────┬─────────────────────────────────────┤
│                       │                                     │
│   Sidebar             │      Main Content                   │
│  (sticky top-28)      │                                     │
│                       │  ┌─────────────────────────────────┐│
│  ┌─────────────────┐  │  │ Search Bar (full width)        ││
│  │ Active Filters  │  │  ├─────────────────────────────────┤│
│  │ ├─ Sort         │  │  │ Advanced Filters (expanded)    ││
│  │ ├─ Category     │  │  ├─────────────────────────────────┤│
│  │ ├─ Price        │  │  │ All Items (h3)                 ││
│  │ └─ Clear All    │  │  ├─────────────────────────────────┤│
│  └─────────────────┘  │  │                                 ││
│                       │  │ Products Grid (3-4 cols)        ││
│  ┌─────────────────┐  │  │ ┌──────────┐ ┌──────────┐ ...  ││
│  │ Quick Links     │  │  │ │ Product  │ │ Product  │      ││
│  │ ├─ Electronics  │  │  │ │ Card     │ │ Card     │      ││
│  │ ├─ Clothing     │  │  │ └──────────┘ └──────────┘      ││
│  │ ├─ Under $50    │  │  │ ┌──────────┐ ┌──────────┐ ...  ││
│  │ └─ etc.         │  │  │ │ Product  │ │ Product  │      ││
│  └─────────────────┘  │  │ │ Card     │ │ Card     │      ││
│                       │  │ └──────────┘ └──────────┘      ││
│                       │  │                                 ││
│                       │  │ Pagination: 1 2 3 4 5 ...      ││
│                       │  └─────────────────────────────────┘│
│                       │                                     │
└───────────────────────┴─────────────────────────────────────┘
```

### TABLET (md)
```
┌──────────────────────────────────────┐
│  Logo          Search & Filters      │
├──────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Search Bar (full width)        │  │
│  └────────────────────────────────┘  │
│                                      │
│  [Show/Hide Filters & Quick Links]   │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ Products Grid (2 cols)         │  │
│  │ ┌──────────┐ ┌──────────┐      │  │
│  │ │ Product  │ │ Product  │      │  │
│  │ │ Card     │ │ Card     │      │  │
│  │ └──────────┘ └──────────┘      │  │
│  │ ┌──────────┐ ┌──────────┐      │  │
│  │ │ Product  │ │ Product  │      │  │
│  │ │ Card     │ │ Card     │      │  │
│  │ └──────────┘ └──────────┘      │  │
│  └────────────────────────────────┘  │
│                                      │
│  Pagination controls                 │
└──────────────────────────────────────┘
```

### MOBILE (below md)
```
┌──────────────────────┐
│  Logo                │
│  Search & Menu       │
├──────────────────────┤
│                      │
│  ┌────────────────┐  │
│  │ Search Bar     │  │
│  └────────────────┘  │
│                      │
│  [Show/Hide Filters] │
│                      │
│  ┌────────────────┐  │
│  │ Filters Drawer │  │
│  │ (if visible)   │  │
│  │ ├─ Sort        │  │
│  │ ├─ Category    │  │
│  │ ├─ Price       │  │
│  │ └─ Clear       │  │
│  │ Quick Links    │  │
│  │ (grid 2 cols)  │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ Products (1)   │  │
│  │ ┌────────────┐ │  │
│  │ │ Product    │ │  │
│  │ │ Card       │ │  │
│  │ └────────────┘ │  │
│  │ ┌────────────┐ │  │
│  │ │ Product    │ │  │
│  │ │ Card       │ │  │
│  │ └────────────┘ │  │
│  └────────────────┘  │
│                      │
│  Pagination          │
│  [Previous] [Next]   │
└──────────────────────┘
```

---

## Data Update Flow

```
USER SUBMITS FORM
    │
    ├─→ setLoading(true)
    │
    └─→ VALIDATION
        ├─ Title length ≥ 3?
        ├─ Price is number?
        ├─ Inventory is integer?
        └─ All variants valid?
            │
            No ├─→ toast('Validation Error')
            │  └─→ Return (don't submit)
            │
            Yes
            │
            └─→ PREPARE DATA
                ├─ Trim strings
                ├─ Convert $ to cents
                ├─ Generate variant IDs
                └─ Normalize structure
                    │
                    └─→ GET AUTH SESSION
                        ├─ Get current session
                        ├─ Extract access_token
                        └─ Check not expired
                            │
                            └─→ API CALL
                                PATCH /vendor/products/{id}
                                Headers:
                                ├─ Authorization: Bearer {token}
                                ├─ Content-Type: application/json
                                │
                                Body: {
                                ├─ title
                                ├─ description
                                ├─ category
                                ├─ image
                                └─ variants: [...]
                                }
                                    │
                                    └─→ RESPONSE
                                        │
                                        ├─ Success (200)
                                        │   ├─ Optimistic update: 
                                        │   │  setProducts(prev => 
                                        │   │    prev.map(p => p.id === id ? response : p))
                                        │   ├─ toast('Product updated')
                                        │   ├─ setOpen(false)
                                        │   └─ setLoading(false)
                                        │
                                        └─ Error
                                            ├─ toast('Error: ' + message)
                                            ├─ Console log details
                                            └─ setLoading(false)
```

---

## Pagination Logic

```
Total Products: 147
Per Page: 24
Total Pages: ⌈147/24⌉ = 7

PAGE 1              PAGE 2              PAGE 3              PAGE 7
Items 1-24         Items 25-48         Items 49-72        Items 145-147
                                                           (3 items)

Display:           Display:            Display:            Display:
[1] 2 3 4 5 ... 7  1 [2] 3 4 5 ... 7   1 2 [3] 4 5 ... 7  1 2 ... 5 6 [7]

Buttons:           Buttons:            Buttons:            Buttons:
[Disabled] Next    Previous [Next]     Previous [Next]     Previous [Disabled]
```

---

## State Dependencies Matrix

```
         │  search │ category │ price │ sort │ page │ perPage
─────────┼─────────┼──────────┼───────┼──────┼──────┼─────────
Triggers │    ✓    │    ✓     │   ✓   │  ✓   │  ✓   │    ✓
fetch    │         │          │       │      │      │
─────────┼─────────┼──────────┼───────┼──────┼──────┼─────────
Resets   │    N    │    N     │   N   │  N   │  ✓   │    N
page to 1│         │          │       │      │      │
─────────┴─────────┴──────────┴───────┴──────┴──────┴─────────

Note: Changing any filter should ideally reset page to 1,
but current implementation doesn't do this automatically.
```

---

## Error State Decision Tree

```
Response received?
    │
    ├─ No (network error)
    │   └─ setError("Network error")
    │
    └─ Yes
        │
        ├─ Status 200?
        │   │
        │   ├─ No (4xx/5xx)
        │   │   ├─ 401?
        │   │   │   └─ setError("Not logged in")
        │   │   ├─ 403?
        │   │   │   └─ setError("Permission denied")
        │   │   ├─ 404?
        │   │   │   └─ setError("Item not found")
        │   │   └─ Other?
        │   │       └─ setError("Server error: " + status)
        │   │
        │   └─ Yes (2xx)
        │       │
        │       ├─ data is null/empty?
        │       │   └─ setProducts([])
        │       │
        │       └─ data.products exists?
        │           ├─ Yes
        │           │   └─ setProducts(data.products)
        │           │
        │           └─ No
        │               └─ Unexpected format error
        │
        └─ Finally: setLoading(false)
```

---

This visual guide should help you understand the system at a glance!

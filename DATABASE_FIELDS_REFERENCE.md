# 📊 Database Fields Reference - Product Data

## Products Table - Fields Being Pulled

### Current API Query (EcommerceApi.jsx Line 136)
```javascript
const baseSelect = 'id, title, slug, vendor_id, base_price, currency, description, ribbon_text, image_url, gallery_images, is_published, created_at';
```

---

## Field Definitions

| Field | Type | Purpose | Format |
|-------|------|---------|--------|
| **id** | UUID | Unique product identifier | UUID |
| **title** | TEXT | Product name | String |
| **slug** | TEXT | URL-friendly identifier | String (lowercase, no spaces) |
| **vendor_id** | UUID | Foreign key to vendors | UUID |
| **base_price** | INTEGER | Product price | Cents (e.g., 2999 = $29.99) |
| **currency** | TEXT | Currency code | ISO code (e.g., "USD") |
| **description** | TEXT | Product description | String (used in list view) |
| **ribbon_text** | TEXT | Special badge/ribbon | String (e.g., "Sale", "New", "Limited") |
| **image_url** | TEXT | Main product image | Full URL to image in storage |
| **gallery_images** | JSON ARRAY | Additional product images | Array of URLs |
| **is_published** | BOOLEAN | Publication status | true/false |
| **created_at** | TIMESTAMP | Creation timestamp | ISO timestamp |

---

## Price Data Processing

### Raw Data Storage
- **Stored in cents** (e.g., 2999 = $29.99)
- Prevents floating-point precision issues
- Supports all currencies uniformly

### Conversion in Code
**File**: [src/lib/productUtils.js](src/lib/productUtils.js)

```javascript
// Function: formatProductPrice(amount, currency)
// Input: amount in cents, currency object
// Example: formatProductPrice(2999, { code: 'USD', symbol: '$' })
// Output: "$29.99"
```

---

## Data Flow: Database → Display

```
┌─────────────────────────────────────────────────────────┐
│ Database (products table)                               │
├─────────────────────────────────────────────────────────┤
│ base_price: 2999                                        │
│ currency: "USD"                                         │
│ title: "Product Name"                                   │
│ image_url: ".../img_abc123.jpg"                         │
│ gallery_images: [".../img_xyz.jpg", ...]               │
│ description: "Product details"                          │
│ ribbon_text: "Sale"                                     │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ API Query (EcommerceApi.js)                             │
├─────────────────────────────────────────────────────────┤
│ ✅ Selects: All 12 fields defined above                │
│ ✅ Filters: By vendor, category, search, price range   │
│ ✅ Orders: By creation date (newest first)             │
│ ✅ Paginates: 24 products per page                      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ Product Utilities (productUtils.js)                     │
├─────────────────────────────────────────────────────────┤
│ normalizeProduct()  → Validates all fields             │
│ getProductPrice()   → Converts cents to "$29.99"       │
│ getProductImageUrl() → Fallback chain for images       │
│ validateProductForDisplay() → Pre-render check          │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│ React Components (MarketplaceProductCard.jsx)           │
├─────────────────────────────────────────────────────────┤
│ Displays: Title, Price, Image, Description, Ribbon    │
│ Uses: Safe utilities for all data access               │
│ Fallbacks: Placeholders for missing data                │
└─────────────────────────────────────────────────────────┘
```

---

## Key Features

### ✅ Complete Price Data
- **base_price**: Main product price (in cents)
- **currency**: Ensures correct formatting and symbol
- **Conversion**: Handled by `formatProductPrice()` utility

### ✅ Rich Product Information
- **title**: What users see on product cards
- **description**: Additional context in list view
- **ribbon_text**: Eye-catching special promotions/badges

### ✅ Image Management
- **image_url**: Primary image for card display
- **gallery_images**: Additional product images for browsing

### ✅ Metadata
- **is_published**: Only published products show on marketplace
- **created_at**: Sorting and display
- **vendor_id**: Link to product seller

---

## Safe Data Access

All components use defensive utilities:

```javascript
// ❌ UNSAFE (direct access)
const price = product.base_price / 100;

// ✅ SAFE (using utilities)
import { getProductPrice } from '@/lib/productUtils';
const price = getProductPrice(product);
```

---

## Validation

Before rendering, all products pass through:

```javascript
const validation = validateProductForDisplay(product);
if (!validation.isDisplayable) return null; // Skip rendering

// validation object includes:
{
  isDisplayable: boolean,
  missingFields: string[],
  errors: string[]
}
```

---

## Related References

- [productUtils.js](src/lib/productUtils.js) - Data handling utilities
- [EcommerceApi.jsx](src/api/EcommerceApi.jsx#L136) - API query definition
- [MarketplaceProductCard.jsx](src/components/products/MarketplaceProductCard.jsx) - Component using data
- [Supabase Database](https://tmyxjsqhtxnuchmekbpt.supabase.co) - Production database

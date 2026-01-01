# Dual-Approach Category Management System

## Overview

The platform now uses a sophisticated **dual-approach** category system that leverages both the `categories` table and product `metadata` field to handle both standard and custom categories.

## Architecture

### 1. **Categories Table (Standard Categories)**
- Stores predefined, admin-approved categories
- Each category has: `id`, `name`, `slug`, `metadata`
- Products link via `category_id` foreign key
- Provides structured, searchable categories

### 2. **Metadata Field (Custom Categories)**
- Stores fallback category information when standard category doesn't exist
- Lives in `products.metadata` JSONB field
- Fields:
  - `category_name`: The custom category name entered by vendor
  - `category_updated_at`: Timestamp of last update
  - `needs_category_review`: Boolean flag indicating admin review needed

## Data Flow

### When Saving a Product with Category

1. **Frontend** → sends `{ category: "Electronics" }` to backend
2. **Backend** searches `categories` table for matching name
   - **IF FOUND**: Updates `products.category_id`
   - **IF NOT FOUND**: 
     - Stores category name in `metadata.category_name`
     - Sets `metadata.needs_category_review = true`
     - Creates `admin_alert` of type `category_review`

```javascript
// Backend: server/vendor.js PATCH endpoint
if (updates.category !== undefined) {
  // Try to find category by name
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', updates.category)
    .single();

  if (category?.id) {
    // Standard category → use category_id
    dbUpdates.category_id = category.id;
  } else {
    // Custom category → store in metadata + flag for review
    dbUpdates.metadata = {
      ...currentMetadata,
      category_name: updates.category,
      category_updated_at: new Date().toISOString(),
      needs_category_review: true
    };
    // Create admin alert
    await supabase.from('admin_alerts').insert({
      type: 'category_review',
      title: `Category Review: "${updates.category}"`,
      description: `Product ${productId} uses custom category...`,
      metadata: { product_id: productId, category_name },
      status: 'open'
    });
  }
}
```

### When Loading Products

**Query**: `listProductsByVendor()` selects:
- `category_id` - FK to categories table
- `metadata` - JSONB with category_name (if custom)
- `product_variants` - Related pricing/inventory

**Display Logic**:
```javascript
// Frontend: Products.jsx openEdit()
let categoryName = 'Uncategorized';
if (p.metadata?.category_name) {
  categoryName = p.metadata.category_name;  // Use custom name
} else if (p.category_id) {
  categoryName = `Category ${p.category_id}`; // Use ID as fallback
}
```

## Benefits

### 1. **Flexibility**
- Vendors can immediately use custom categories without admin intervention
- Products never fail to save due to missing category

### 2. **Quality Control**
- Admin reviews flagged categories and creates them if needed
- `admin_alerts` table tracks which custom categories need standardization
- Prevents category proliferation while allowing vendor autonomy

### 3. **Data Consistency**
- Standard categories (via FK) enforce referential integrity
- Metadata approach provides graceful fallback
- Dual storage allows gradual migration of custom → standard categories

### 4. **Searchability**
- Products with `category_id` can be searched via proper JOINs
- Custom categories (in metadata) remain searchable via JSONB queries
- Both paths contribute to overall product discovery

## Admin Workflow

1. **Alert Created**: When vendor saves product with unknown category
   - Type: `category_review`
   - Status: `open`
   - Contains: product_id, vendor_id, category_name

2. **Admin Reviews**: Dashboard shows pending category reviews
   - Option 1: Create new category in categories table
   - Option 2: Ask vendor to use existing category
   - Option 3: Decline if category inappropriate

3. **Resolution**: 
   - If category created → Admin can bulk-migrate products
   - Product's `category_id` gets updated
   - `metadata.needs_category_review` cleared
   - Alert marked as `closed`

## Database Schema

### products table
```
- category_id (UUID, FK to categories.id, nullable)
- metadata (JSONB)
  - category_name (string, custom category if category_id null)
  - category_updated_at (timestamp)
  - needs_category_review (boolean, flags for admin)
```

### admin_alerts table
```
- type: 'category_review'
- title: 'Category Review: "Electronics"'
- description: 'Product X uses custom category...'
- metadata.product_id
- metadata.category_name
- metadata.vendor_id
- status: 'open' | 'resolved'
```

## API Endpoint

### PATCH /api/vendor/products/:productId

**Request**:
```json
{
  "title": "Product Name",
  "category": "Custom Electronics",
  ...other fields
}
```

**Response** (Category Mapped):
```json
{
  "success": true,
  "product": {
    "id": "...",
    "category_id": "uuid-if-standard-or-null",
    "metadata": {
      "category_name": "Custom Electronics",
      "needs_category_review": true,
      ...other metadata
    }
  }
}
```

**Console Output**:
- If standard: `📋 Product XXX: Category "Electronics" → ID <uuid>`
- If custom: `⚠️ Product XXX: Category "Custom Electronics" flagged for admin review`

## Migration Path: Custom → Standard

When admin creates a standard category for previously-custom categories:

1. Admin creates category in categories table
2. System can bulk-update all products with matching `metadata.category_name`
3. Updates products to set `category_id` and clear metadata flags
4. Improves data consistency over time

## Error Handling

- **Category lookup fails**: Falls back to metadata storage
- **Admin alert creation fails**: Logs warning but doesn't block product save
- **No category provided**: Uses 'Uncategorized' placeholder
- **Invalid category name**: Accepts any non-empty string, flags for review

## Monitoring

Track these metrics:
- `admin_alerts` count by type: how many categories pending review
- Products with `needs_category_review = true`: custom category adoption
- Migration progress: ratio of category_id filled vs empty
- Vendor feedback: which custom categories are frequently used

## Testing Checklist

- [ ] Save product with existing category → category_id updated
- [ ] Save product with new category → metadata.category_name set + alert created
- [ ] Load product → displays correct category name
- [ ] Edit product → form shows correct category
- [ ] Admin reviews pending categories
- [ ] Category resolved → product.metadata.needs_category_review cleared
- [ ] Delete category → products with category_id remain valid (ON DELETE RESTRICT or CASCADE)

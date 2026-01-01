# Quick Testing Guide - Product Updates & Account Settings

## 🚀 Quick Test Checklist

### 1. Product Update Persistence ✓
**Test: Edit and save a product**

Steps:
1. Login as a vendor user
2. Go to `/dashboard/vendor/products`
3. Click "Edit" on any product
4. Verify form fields populate:
   - Title, Description, Price, Inventory, Category, Image
5. Change at least 3 fields
6. Click "Save"
7. See success toast: "Product updated successfully"
8. Refresh the page (F5)
9. Click "Edit" again
10. ✅ Verify all changes persisted

What's fixed:
- Product data now loads correctly from database schema
- Updates map to correct database columns (base_price, image_url, metadata.category)
- Variants properly handled
- Complete data returned and refreshed

---

### 2. Authorization Check ✓
**Test: Verify only owner can edit**

Steps:
1. Note down ProductID_A (owned by Vendor_A) and ProductID_B (owned by Vendor_B)
2. Login as Vendor_A
3. Try to edit ProductID_B via direct API call:
   ```javascript
   // In browser console:
   const api = await import('/src/api/EcommerceApi.jsx');
   api.updateProduct('ProductID_B', { title: 'Hacked' });
   ```
4. ✅ Should see error: "You do not have permission to edit this product"
5. Try editing your own product (ProductID_A)
6. ✅ Should work successfully

What's implemented:
- Authorization check verifies product ownership
- User must be logged in
- Vendor ownership verified against database
- Clear error messages on unauthorized attempts

---

### 3. Account Settings Page ✓
**Test: Full account management**

Steps:
1. Login as any user
2. Click user avatar in header → "Account Settings"
   OR navigate to `/account-settings`
3. ✅ Should see three tabs: Profile, Vendor Settings, Security

#### Profile Tab
4. Update Username, Full Name, or Avatar URL
5. Click "Save Changes"
6. ✅ See success message
7. Refresh page
8. ✅ Changes still there
9. Check database: `profiles` table should have new values

#### Vendor Settings Tab (if vendor user)
10. Update Store Name, Description, Website, Location
11. Click "Save Vendor Settings"
12. ✅ See success message
13. Refresh page
14. ✅ Changes persist in vendors table

#### Security Tab
15. Enter new password (min 8 chars)
16. Confirm password
17. Click "Change Password"
18. ✅ See success message
19. ✅ Try logging out and back in with new password

---

### 4. Navigation Verification ✓
**Test: All navigation links work**

#### Desktop Header (Logged In)
1. Click user avatar
2. ✅ See "Account Settings" option
3. Click it
4. ✅ Navigate to `/account-settings`
5. Click "Dashboard" option
6. ✅ Navigate to dashboard

#### Mobile Header (Logged In)
1. Click hamburger menu
2. ✅ See "My Account" button
3. Click it
4. ✅ Navigate to `/account-settings`

#### Sidebar Navigation (Vendor Dashboard)
1. Go to `/dashboard/vendor`
2. ✅ See sidebar with:
   - Overview
   - Products
   - Orders
   - Edit Store
3. Click each link
4. ✅ All routes load correctly

#### Key Routes Test
- `/` → HomePage ✓
- `/marketplace` → MarketplacePage ✓
- `/dashboard` → DashboardPage ✓
- `/dashboard/vendor` → VendorDashboardPage ✓
- `/dashboard/vendor/products` → VendorProducts ✓
- `/account-settings` → AccountSettings ✓

---

## 📊 Database Verification

### Check Product Updates Persisted

Run in database client:
```sql
-- Check if product data was updated
SELECT id, title, description, base_price, image_url, 
       metadata->>'category' as category, 
       updated_at
FROM products
WHERE id = 'YOUR_PRODUCT_ID'
ORDER BY updated_at DESC
LIMIT 1;

-- Check variants were updated
SELECT id, product_id, price_in_cents, inventory_quantity, 
       attributes->>'title' as variant_title,
       updated_at
FROM product_variants
WHERE product_id = 'YOUR_PRODUCT_ID'
ORDER BY updated_at DESC;
```

### Check Profile Updates Persisted

```sql
-- Check if profile data was updated
SELECT id, email, username, full_name, avatar_url, updated_at
FROM profiles
WHERE id = 'YOUR_USER_ID'
ORDER BY updated_at DESC
LIMIT 1;
```

### Check Vendor Updates Persisted

```sql
-- Check if vendor data was updated
SELECT id, owner_id, store_name, slug, description, website, location, updated_at
FROM vendors
WHERE id = 'YOUR_VENDOR_ID'
ORDER BY updated_at DESC
LIMIT 1;
```

---

## 🔍 Error Testing

### Authorization Errors
- Try updating product you don't own → "You do not have permission" ✓
- Try without login → "You must be logged in" ✓

### Validation Errors
- Password < 8 chars → "Password must be at least 8 characters" ✓
- Passwords don't match → "Passwords do not match" ✓
- Missing required fields → Appropriate validation ✓

### Form Submission
- Product update with invalid price → Should reject ✓
- Product update with missing title → Should reject ✓

---

## 🎯 Success Criteria

All of the following should work:

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Product updates persist to DB | ✅ | Data in products/product_variants tables |
| Authorization prevents unauthorized edits | ✅ | Error message when not owner |
| Account Settings page accessible | ✅ | Route `/account-settings` works |
| Profile management works | ✅ | Data in profiles table updates |
| Vendor settings management works | ✅ | Data in vendors table updates |
| Password change works | ✅ | Can login with new password |
| All navigation links work | ✅ | No 404 errors |
| Routes properly protected | ✅ | Logged out users redirected to login |
| Vendor routes role-protected | ✅ | Non-vendors cannot access |

---

## 📝 Notes for Testing

1. **Clear browser cache** before first test to avoid stale data
2. **Check browser console** for any errors (should be none)
3. **Network tab** should show POST/PATCH requests succeeding (200-201)
4. **Use incognito window** to test multi-user scenarios
5. **Test on both desktop and mobile** viewports

---

## 🔧 If Testing Fails

### Product updates not persisting
- ✓ Check database schema (all columns exist)
- ✓ Check Supabase RLS policies allow updates
- ✓ Check user is logged in
- ✓ Check user owns the vendor
- ✓ Check browser console for errors

### Account Settings not loading
- ✓ Check user is logged in
- ✓ Check route exists in routerConfig.jsx
- ✓ Check component exports properly
- ✓ Check browser console for errors

### Navigation links not working
- ✓ Check all routes in routerConfig.jsx
- ✓ Check components are imported
- ✓ Check page files exist in src/pages/
- ✓ Check no typos in paths

---

## 📞 Support

All implementation files are documented at:
**[PRODUCT_UPDATE_ACCOUNT_SETTINGS_COMPLETE.md](./PRODUCT_UPDATE_ACCOUNT_SETTINGS_COMPLETE.md)**

For specific details on changes made, see that document.

import { supabase } from '../lib/customSupabaseClient';
import { API_CONFIG } from '../config/environment.js';
import { fetchProductsHandler } from './productsHandler';

// PayPal API Configuration - use centralized config that properly handles dev proxy
// API_CONFIG.baseURL already includes '/api' path
const API_ENDPOINTS = {
  createOrder: `${API_CONFIG.baseURL}/paypal/create-order`,
  captureOrder: `${API_CONFIG.baseURL}/paypal/capture-order`,
  config: `${API_CONFIG.baseURL}/paypal/config`,
  reviews: `${API_CONFIG.baseURL}/reviews`,
};

export function formatCurrency(amountInCents, currencyInfo = { code: 'USD', symbol: '$' }) {
  const amount = typeof amountInCents === 'number' ? amountInCents / 100 : 0;
  const symbol = (currencyInfo && currencyInfo.symbol) || '$';
  return `${symbol}${amount.toFixed(2)}`;
}

// We'll use the backend to handle PayPal authentication
async function checkBackendConfig() {
  try {
    const response = await fetch(API_ENDPOINTS.config);
    if (!response.ok) {
      throw new Error(`Backend config check failed: ${response.status}`);
    }
    const data = await response.json();
    if (!data.clientIdPresent || !data.secretPresent) {
      throw new Error('PayPal configuration is incomplete on the backend');
    }
    return true;
  } catch (error) {
    console.error("Backend config check failed:", error);
    throw error;
  }
}

export async function createPayPalOrder(cartItems) {
  try {
    // Validate cart items before sending
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Ensure each item has required fields
    cartItems.forEach(item => {
      if (!item?.variant?.price) {
        throw new Error('Invalid item in cart');
      }
    });

    // Send the order creation request to our backend
    const response = await fetch(API_ENDPOINTS.createOrder, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cartItems })
    });

    // First get the raw text
    const text = await response.text();
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON response:', text);
      throw new Error('Invalid server response');
    }

    if (!response.ok) {
      console.error('Server create-order failed:', data);
      throw new Error(data.error || 'Failed to create order on server');
    }

    if (!data.id) {
      console.error('Missing order ID in response:', data);
      throw new Error('Invalid order response from server');
    }

    // Return the order id expected by the PayPal buttons
    return data.id;
  } catch (error) {
    console.error("Failed to create PayPal order (client):", error);
    throw error;
  }
}

export async function capturePayPalOrder(orderID) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/paypal/capture-order/${orderID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    // First get the raw text
    const text = await response.text();
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON response:', text);
      throw new Error('Invalid server response');
    }
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data;
  } catch (error) {
    console.error("Failed to capture PayPal order:", error);
    throw error;
  }
}

export async function getProducts(options = {}) {
  // Use the dedicated products handler for complete field data
  console.log('📦 getProducts: Delegating to fetchProductsHandler...');
  return await fetchProductsHandler(options);
}

export async function getVendors() {
  if (!supabase) {
    console.warn('Supabase not initialized, returning empty vendors array');
    return [];
  }
  try {
    // Query vendors with products relation
    let data, error;
    try {
      const res = await supabase
        .from('vendors')
        .select(`
          id,
          owner_id,
          name,
          slug,
          description,
          created_at,
          products!products_vendor_id_fkey(id, title, slug, description, base_price, currency, is_published, image_url, gallery_images),
          vendor_ratings(*)
        `)
        .order('name', { ascending: true });
      data = res.data; error = res.error;
    } catch (err) {
      console.warn('Vendor query with ratings failed, retrying without vendor_ratings:', err?.message || err);
      const res2 = await supabase
        .from('vendors')
        .select(`
          id,
          owner_id,
          name,
          slug,
          description,
          created_at,
          products!products_vendor_id_fkey(id, title, slug, description, base_price, currency, is_published, image_url, gallery_images)
        `)
        .order('name', { ascending: true });
      data = res2.data; error = res2.error;
    }

    if (error) {
      console.error('Error fetching vendors:', error);
      return [];
    }

    const mapped = (data || []).map(v => {
      const prods = v.products || [];
      const published = prods.filter(p => p.is_published !== false);
      const featured = published.length ? published[0] : (prods[0] || null);
      const featured_product = featured ? {
        id: featured.id,
        title: featured.title,
        image: featured.image_url || (featured.gallery_images && featured.gallery_images[0]),
        price: formatCurrency(Number(featured.base_price || 0))
      } : null;
      const rating = v.vendor_ratings?.[0];

      return {
        id: v.id,
        owner_id: v.owner_id,
        name: v.name || v.slug,
        store_name: v.name || v.slug,
        slug: v.slug,
        description: v.description || '',
        avatar: v.profile?.avatar_url,
        cover_url: null,
        website: v.website || null,
        location: v.location || null,
        is_active: true,
        created_at: v.created_at,
        featured_product,
        categories: [],
        rating: rating?.avg_rating,
        total_products: prods.length || 0
      };
    });

    return mapped;
  } catch (err) {
    console.error('Failed to load vendors', err);
    return [];
  }
}

export async function getCategories() {
  if (!supabase) {
    console.warn('Supabase not initialized, returning empty categories array');
    return [];
  }

  const { data, error } = await supabase.from('categories').select('id, name, slug, description').order('name', { ascending: true });
  
  if (error) {
    console.error('❌ Error fetching categories:', error);
    return [];
  }

  console.log('✅ Categories fetched:', data?.length, 'items', data);
  return data || [];
}

export async function getProductQuantities({ product_ids }) {
  if (!supabase) {
    console.warn('Supabase not initialized, returning empty variants array');
    return { variants: [] };
  }
  const { data, error } = await supabase
    .from('product_variants')
    .select('id, inventory_quantity')
    .in('product_id', product_ids);

  if (error) {
    console.error('Error fetching product quantities:', error);
    return { variants: [] };
  }

  return { variants: data };
}

export async function createProduct(vendorId, productData) {
  if (!supabase) throw new Error('Supabase client not available');
  const payload = {
    vendor_id: vendorId,
    title: productData.title,
    description: productData.description,
    category: productData.category,
    image_url: productData.image,
    variants: productData.variants || [],
    created_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('products').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(productId, updates) {
  // Get JWT token from current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('No active session');
  }

  // Call backend API endpoint using service role key (bypasses RLS)
  // Backend handles field mapping: price_in_cents → base_price, image → image_url, etc.
  const response = await fetch(`/api/vendor/products/${productId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.product) {
    return data.product;
  }
  
  throw new Error('Invalid response from product update');
}

export async function deleteProduct(productId) {
  if (!supabase) throw new Error('Supabase client not available');
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
  return true;
}

export async function getProductById(productId) {
  if (!supabase) {
    console.warn('Supabase not initialized, returning null');
    return null;
  }
  
  // Fetch product without embedding variants (multiple relationships issue)
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) {
    console.error(`Error fetching product with id ${productId}:`, error);
    return null;
  }
  
  // Fetch variants separately if needed
  if (data) {
    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId);
    
    if (variants) {
      data.product_variants = variants;
    }
  }

  return data;
}

export async function getVendorById(vendorId) {
  if (!supabase) {
    console.warn('Supabase not initialized, returning null');
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (error) {
      console.error(`Error fetching vendor with id ${vendorId}:`, error);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`Failed to load vendor ${vendorId}`, err);
    return null;
  }
}

export async function uploadImageFile(file) {
  if (!supabase) throw new Error('Supabase client not available');
  if (!file) throw new Error('No file provided');

  try {
    const fileExt = file.name?.split('.').pop() || 'png';
    const fileName = `product-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const bucket = 'product-images';

    const { data, error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
    return publicData.publicUrl;
  } catch (err) {
    console.error('Image upload failed:', err);
    throw err;
  }
}

export async function listProductsByVendor(vendorId) {
  if (!supabase) throw new Error('Supabase client not available');
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/**
 * Upload product image to backend (after product is saved)
 * Backend handles the actual Supabase storage upload
 * @param {string} productId - Product ID
 * @param {File} file - Image file to upload
 * @returns {Promise<{imageUrl: string, product: object}>}
 */
export async function uploadProductImageToBackend(productId, file) {
  if (!productId) throw new Error('Product ID is required');
  if (!file) throw new Error('File is required');

  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`/api/products/${productId}/upload-image`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - the browser will set it with boundary
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (err) {
    console.error('Backend image upload failed:', err);
    throw err;
  }
}


export async function getVendorByOwner(ownerId) {
  if (!ownerId) {
    console.warn('[getVendorByOwner] No owner ID provided');
    return null;
  }
  try {
    console.log(`[getVendorByOwner] Fetching vendor for owner ID: ${ownerId}`);
    
    // Use backend endpoint for reliable vendor lookup
    const response = await fetch(`/api/vendor/by-owner/${ownerId}`);
    
    if (!response.ok) {
      console.error(`[getVendorByOwner] HTTP error ${response.status}`);
      return null;
    }
    
    const result = await response.json();
    const vendor = result.vendor;
    
    if (!vendor) {
      console.log(`[getVendorByOwner] No vendor found for owner ${ownerId}`);
      return null;
    }
    
    console.log(`[getVendorByOwner] Returning vendor:`, vendor);
    return vendor;
  } catch (err) {
    console.error(`[getVendorByOwner] Failed to load vendor with owner ${ownerId}`, err);
    return null;
  }
}

export async function getVendorDashboardData(vendorId) {
  if (!vendorId) {
    console.warn('Vendor ID is required to fetch dashboard data');
    return null;
  }
  try {
    const response = await fetch(`/api/dashboard/vendor/${vendorId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch vendor dashboard data: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching vendor dashboard data:', error);
    throw error;
  }
}

export async function updateVendor(vendorId, updates) {
  // Get JWT token from current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) {
    throw new Error('No active session');
  }

  // Call backend API endpoint
  const response = await fetch(`/api/vendor/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.vendor) {
    console.log('✅ Vendor updated successfully:', data.vendor);
    return data.vendor;
  }
  
  throw new Error('Invalid response from vendor update');
}

export async function getReviews(productId) {
  try {
    const response = await fetch(`${API_ENDPOINTS.reviews}/${productId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch reviews: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
}

export async function createReview(reviewData) {
  try {
    const response = await fetch(API_ENDPOINTS.reviews, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewData),
    });
    if (!response.ok) {
      throw new Error(`Failed to create review: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
}

/**
 * Category Management Functions
 * Handle category lookup, creation, and admin alerts for missing categories
 */

/**
 * Get or create a category by name
 * Looks up existing category or creates new one if not found
 * @param {string} categoryName - Category name to lookup/create
 * @returns {Promise<string|null>} Category UUID or null if creation failed
 */
export async function getOrCreateCategoryByName(categoryName) {
  try {
    if (!supabase || !categoryName || typeof categoryName !== 'string') {
      console.error('❌ Invalid category name:', categoryName);
      return null;
    }

    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      console.error('❌ Category name is empty after trim');
      return null;
    }

    // Check if category exists
    const { data: existingCategory, error: searchError } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', trimmedName)
      .single();

    if (!searchError && existingCategory) {
      console.log(`📋 Found existing category "${trimmedName}": ${existingCategory.id}`);
      return existingCategory.id;
    }

    // Category doesn't exist, create it
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    console.log(`📋 Creating new category "${trimmedName}" with slug "${slug}"`);

    const { data: newCategory, error: createError } = await supabase
      .from('categories')
      .insert([
        {
          name: trimmedName,
          slug: slug,
          metadata: {
            auto_created: true,
            created_at: new Date().toISOString()
          }
        }
      ])
      .select('id')
      .single();

    if (createError) {
      console.error(`❌ Failed to create category "${trimmedName}":`, createError);
      return null;
    }

    console.log(`✅ Created new category "${trimmedName}": ${newCategory.id}`);
    return newCategory.id;
  } catch (error) {
    console.error('❌ Error in getOrCreateCategoryByName:', error);
    return null;
  }
}

/**
 * Ensure default "Uncategorized" category exists
 * @returns {Promise<string|null>} Uncategorized category UUID
 */
export async function ensureDefaultCategory() {
  try {
    if (!supabase) return null;

    const { data: uncategorized, error } = await supabase
      .from('categories')
      .select('id')
      .ilike('name', 'Uncategorized')
      .single();

    if (!error && uncategorized) {
      return uncategorized.id;
    }

    // Create "Uncategorized" category
    const { data: newCategory, error: createError } = await supabase
      .from('categories')
      .insert([
        {
          name: 'Uncategorized',
          slug: 'uncategorized',
          metadata: {
            auto_created: true,
            is_default: true,
            created_at: new Date().toISOString()
          }
        }
      ])
      .select('id')
      .single();

    if (createError) {
      console.error('❌ Failed to create Uncategorized category:', createError);
      return null;
    }

    console.log('✅ Created default Uncategorized category');
    return newCategory.id;
  } catch (error) {
    console.error('❌ Error ensuring default category:', error);
    return null;
  }
}

/**
 * Alert admin when a category is missing
 * Creates an admin alert record for manual review
 * @param {string} productId - Product ID that needs category
 * @param {string} requestedCategoryName - Category name that was requested
 * @param {string} reason - Reason for alert (CREATION_FAILED, AUTO_ASSIGNED, etc.)
 */
export async function alertAdminMissingCategory(productId, requestedCategoryName, reason) {
  try {
    if (!supabase) return null;

    const { data: alert, error } = await supabase
      .from('admin_alerts')
      .insert([
        {
          alert_type: 'missing_category',
          product_id: productId,
          requested_category_name: requestedCategoryName,
          reason: reason,
          status: 'unresolved',
          created_at: new Date().toISOString(),
          metadata: {
            request_timestamp: new Date().toISOString(),
            request_reason: reason
          }
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.warn('⚠️  Could not create admin alert:', error.message);
      return null;
    }

    console.log(`⚠️  Admin alert created for missing category "${requestedCategoryName}": ${alert.id}`);
    return alert.id;
  } catch (error) {
    console.warn('⚠️  Error creating admin alert:', error);
    return null;
  }
}

/**
 * Get unresolved admin alerts for missing categories
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status (unresolved, resolved)
 * @returns {Promise<Array>} Array of admin alerts
 */
export async function getAdminAlerts(options = {}) {
  try {
    if (!supabase) return [];

    const { status = 'unresolved' } = options;

    let query = supabase
      .from('admin_alerts')
      .select('*')
      .eq('alert_type', 'missing_category')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: alerts, error } = await query;

    if (error) {
      console.error('❌ Error fetching admin alerts:', error);
      return [];
    }

    return alerts || [];
  } catch (error) {
    console.error('❌ Error in getAdminAlerts:', error);
    return [];
  }
}

/**
 * Resolve an admin alert and assign a category
 * @param {string} alertId - Admin alert ID
 * @param {string} categoryId - Category UUID to assign
 * @returns {Promise<boolean>} Success status
 */
export async function resolveAdminAlert(alertId, categoryId) {
  try {
    if (!supabase) return false;

    const { error } = await supabase
      .from('admin_alerts')
      .update({
        status: 'resolved',
        resolved_category_id: categoryId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      console.error('❌ Error resolving alert:', error);
      return false;
    }

    console.log(`✅ Alert ${alertId} resolved with category ${categoryId}`);
    return true;
  } catch (error) {
    console.error('❌ Error in resolveAdminAlert:', error);
    return false;
  }
}

/**
 * Bulk migrate products missing categories to Uncategorized
 * @param {Object} options - Migration options
 * @param {boolean} options.dryRun - If true, only preview changes without executing
 * @returns {Promise<Object>} Migration result {total, updated, errors}
 */
export async function migrateMissingCategories(options = {}) {
  try {
    if (!supabase) return { total: 0, updated: 0, errors: [] };

    const { dryRun = true } = options;

    // Get all products without categories
    const { data: productsWithoutCategories, error: queryError } = await supabase
      .from('products')
      .select('id')
      .is('category_id', null);

    if (queryError) {
      console.error('❌ Error querying products:', queryError);
      return { total: 0, updated: 0, errors: [queryError.message] };
    }

    const total = productsWithoutCategories?.length || 0;
    if (total === 0) {
      console.log('✅ No products missing categories');
      return { total: 0, updated: 0, errors: [] };
    }

    if (dryRun) {
      console.log(`📊 DRY RUN: Would migrate ${total} products to Uncategorized`);
      return { total, updated: 0, errors: [] };
    }

    // Get or create Uncategorized category
    const uncategorizedId = await ensureDefaultCategory();
    if (!uncategorizedId) {
      return { total, updated: 0, errors: ['Failed to get Uncategorized category'] };
    }

    // Update all products without categories
    const { error: updateError, count } = await supabase
      .from('products')
      .update({ category_id: uncategorizedId })
      .is('category_id', null);

    if (updateError) {
      console.error('❌ Error updating products:', updateError);
      return { total, updated: 0, errors: [updateError.message] };
    }

    console.log(`✅ Migrated ${count} products to Uncategorized`);
    return { total, updated: count || 0, errors: [] };
  } catch (error) {
    console.error('❌ Error in migrateMissingCategories:', error);
    return { total: 0, updated: 0, errors: [error.message] };
  }
}

/**
 * Get category distribution statistics
 * @returns {Promise<Object>} Category stats {categoryName: {name, count}}
 */
export async function getCategoryStats() {
  try {
    if (!supabase) return {};

    const { data: products, error } = await supabase
      .from('products')
      .select('category_id')
      .not('category_id', 'is', null);

    if (error) {
      console.error('❌ Error fetching products:', error);
      return {};
    }

    // Count by category_id
    const categoryCounts = {};
    (products || []).forEach(p => {
      const catId = p.category_id;
      categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
    });

    // Get category names
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name');

    const stats = {};
    (categories || []).forEach(cat => {
      const count = categoryCounts[cat.id] || 0;
      if (count > 0) {
        stats[cat.id] = {
          name: cat.name,
          count: count
        };
      }
    });

    // Add uncategorized count
    const uncategorizedCount = (products || []).length - Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    if (uncategorizedCount > 0) {
      stats['uncategorized'] = {
        name: 'Uncategorized',
        count: uncategorizedCount
      };
    }

    return stats;
  } catch (error) {
    console.error('❌ Error in getCategoryStats:', error);
    return {};
  }
}






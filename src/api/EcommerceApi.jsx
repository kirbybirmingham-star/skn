import { supabase } from '../lib/customSupabaseClient';
import { selectProductWithVariants, variantSelectCandidates } from '../lib/variantSelectHelper.js';
import { productRatingsExist } from '../lib/ratingsChecker.js';

// PayPal API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// PayPal config will be handled by the backend
const API_ENDPOINTS = {
  createOrder: `${API_BASE_URL}/api/paypal/create-order`,
  captureOrder: `${API_BASE_URL}/api/paypal/capture-order`,
  config: `${API_BASE_URL}/api/paypal/config`,
  reviews: `${API_BASE_URL}/api/reviews`,
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
  if (!supabase) {
    console.warn('Supabase not initialized, returning empty products array');
    return { products: [], total: 0 };
  }

  const { sellerId, categoryId, searchQuery, priceRange, page = 1, perPage = 24, sortBy = 'newest' } = options;

  let total = 0;

  // Try to include product_variants and product_ratings relations if they exist. If the
  // relation/table is missing the query will return an error; in that case we fallback to
  // selecting products without the missing relation so the listings still render.
  // Explicitly request the fields we need to render cards to avoid accidental omission
  // of the `images` field when using '*' with nested relations.
  const baseSelect = 'id, title, slug, vendor_id, base_price, currency, image_url, images, gallery_images, is_published, ribbon_text, created_at';
  // product_variants may use different label columns across schemas (e.g., 'name' or 'title').
  // Try a few variant-select shapes until one succeeds.
  // Use shared `variantSelectCandidates` imported from `variantSelectHelper.js`

  let productsQuery = null;
  let usedVariantSelect = null;
  // We'll prefer to include product_ratings when possible; check once to avoid failing queries
  const ratingsAvailable = await productRatingsExist(supabase).catch(() => false);
  const tryBuildQuery = (variantSelect, includeRatings = true) => {
    const relations = includeRatings ? `${variantSelect}, product_ratings(*)` : `${variantSelect}`;
    // default ordering, may be overridden later with explicit sortBy
    return supabase.from('products').select(`${baseSelect}, ${relations}`).order('created_at', { ascending: false });
  };
  
  // Helper function to apply all filters to a query
  const applyFilters = (query) => {
    if (sellerId) query = query.eq('vendor_id', sellerId);
    if (categoryId) {
      const cid = Number.isInteger(Number(categoryId)) ? Number(categoryId) : categoryId;
      query = query.eq('category_id', cid);
    }
    else if (options.categorySlug) {
      const slug = String(options.categorySlug).trim();
      query = query.or(`metadata->>category.ilike.%${slug}%,title.ilike.%${slug}%`);
    }

    if (searchQuery && String(searchQuery).trim().length > 0) {
      const searchQueryStr = String(searchQuery).trim();
      query = query.or(`title.ilike.%${searchQueryStr}%,description.ilike.%${searchQueryStr}%`);
    }

    if (priceRange && priceRange !== 'all') {
      const pr = String(priceRange).toLowerCase();
      if (pr.startsWith('under')) {
        const max = parseInt(pr.replace(/[^0-9]/g, ''), 10) * 100;
        query = query.lte('base_price', max);
      } else if (pr.startsWith('over')) {
        const min = parseInt(pr.replace(/[^0-9]/g, ''), 10) * 100;
        query = query.gte('base_price', min);
      } else if (pr.includes('-')) {
        const parts = pr.split('-').map(p => parseInt(p.replace(/[^0-9]/g, ''), 10));
        if (parts.length === 2) {
          query = query.gte('base_price', parts[0] * 100);
          query = query.lte('base_price', parts[1] * 100);
        }
      }
    }
    
    // Apply sort-by param (server-side when possible).
    const sb = String(sortBy || 'newest').toLowerCase();
    let serverSortField = null;
    let serverSortAsc = false;
    switch (sb) {
      case 'oldest': serverSortField = 'created_at'; serverSortAsc = true; break;
      case 'title_asc': serverSortField = 'title'; serverSortAsc = true; break;
      case 'title_desc': serverSortField = 'title'; serverSortAsc = false; break;
      case 'newest':
      default:
        serverSortField = 'created_at';
        serverSortAsc = false;
        break;
    }
    if (serverSortField) {
      try {
        query = query.order(serverSortField, { ascending: serverSortAsc });
      } catch (e) {
        console.warn('Applying sort failed', e?.message || e);
      }
    }
    
    return query;
  };
  
  // Initialize with the first candidate; prefer including ratings only if available
  for (const vs of variantSelectCandidates) {
    try {
      productsQuery = tryBuildQuery(vs, ratingsAvailable);
      usedVariantSelect = vs;
      break;
    } catch (e) {
      console.warn('Variant select candidate failed to build:', vs, e?.message || e);
    }
  }
  // If none built above, fall back to selecting products without variant/detail projection
  if (!productsQuery) {
    productsQuery = supabase.from('products').select(`${baseSelect}`).order('created_at', { ascending: false });
    usedVariantSelect = null;
  }

  // Apply all filters to the query
  productsQuery = applyFilters(productsQuery);
  total = null;
  try {
    // Attempt count; if it errors due to unknown column in relation projection, retry with alternative variant selects
    let countAttempt = await productsQuery.select('id', { count: 'exact', head: true });
    let countErr = countAttempt.error;
    let count = countAttempt.count;
    if (countErr && (String(countErr.message).includes('does not exist') || countErr.code === '42703')) {
      // try alternative variant selects
      let succeeded = false;
      for (const vs of variantSelectCandidates) {
        try {
          let altQuery = tryBuildQuery(vs, true);
          altQuery = applyFilters(altQuery);
          const res = await altQuery.select('id', { count: 'exact', head: true });
          if (!res.error) {
            count = res.count; countErr = null; usedVariantSelect = vs; succeeded = true; break;
          }
        } catch (e) {
          // ignore and try next
        }
      }
      if (!succeeded) {
        // try without ratings
        for (const vs of variantSelectCandidates) {
          try {
            let altQuery = tryBuildQuery(vs, false);
            altQuery = applyFilters(altQuery);
            const res = await altQuery.select('id', { count: 'exact', head: true });
            if (!res.error) {
              count = res.count; countErr = null; usedVariantSelect = vs; break;
            }
          } catch (e) {}
        }
      }
      if (countErr) {
        console.warn('Count with variants/ratings failed, and fallback attempts did not succeed', countErr.message || countErr);
      } else {
        total = count || 0;
      }
    } else if (countErr) {
      console.warn('Count query failed', countErr);
    } else {
      total = count || 0;
    }
  } catch (e) {
    console.warn('Count query failed', e);
  }

  const per = Number.isInteger(perPage) ? perPage : 24;
  const pg = Math.max(1, parseInt(page, 10) || 1);
  const start = (pg - 1) * per;
  const end = pg * per - 1;
  productsQuery = productsQuery.range(start, end);

  // Execute the final products query. If it fails due to column mismatch, try alternative variant selects.
  let data, error;
  try {
    const res = await productsQuery;
    data = res.data; error = res.error;
    if (error && (String(error.message).includes('does not exist') || error.code === '42703')) {
      // try alternatives
      let succeeded = false;
      for (const vs of variantSelectCandidates) {
        try {
          let altQuery = tryBuildQuery(vs, true);
          altQuery = applyFilters(altQuery);
          altQuery = altQuery.range(start, end);
          const r2 = await altQuery;
          if (!r2.error) { data = r2.data; error = null; usedVariantSelect = vs; succeeded = true; break; }
        } catch (e) {}
      }
      if (!succeeded) {
        for (const vs of variantSelectCandidates) {
          try {
            let altQuery = tryBuildQuery(vs, false);
            altQuery = applyFilters(altQuery);
            altQuery = altQuery.range(start, end);
            const r2 = await altQuery;
            if (!r2.error) { data = r2.data; error = null; usedVariantSelect = vs; break; }
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    console.error('Error executing products query:', e);
    return { products: [], total: total ?? 0 };
  }

  if (error) {
    console.error('Error fetching products:', error);
    return { products: [], total: total ?? 0 };
  }

  // Post-process: ensure variant images exist so UI can resolve a thumbnail.
  // If a variant has no images but the product has a main image, copy that into the variant
  const products = (data || []).map(p => {
    try {
      if (Array.isArray(p.product_variants) && Array.isArray(p.images) && p.images.length > 0) {
        p.product_variants = p.product_variants.map(v => {
          if (!v) return v;
          if (!v.images || (Array.isArray(v.images) && v.images.length === 0)) {
            return { ...v, images: p.images };
          }
          return v;
        });
      }
    } catch (e) {
      // swallow mapping errors to avoid breaking listings
      console.warn('Variant image mapping failed for product', p?.id, e?.message || e);
    }
    return p;
  });

  if (usedVariantSelect) console.debug('Used variant select:', usedVariantSelect);

  return { products, total: total ?? (Array.isArray(products) ? products.length : 0) };
}

export async function getVendors() {
  console.log('[getVendors] Starting...');
  
  if (!supabase) {
    console.error('[getVendors] Supabase not initialized!');
    return [];
  }
  
  try {
    console.log('[getVendors] Fetching vendors from database...');
    
    // Fetch vendors - simplified query
    const res = await supabase
      .from('vendors')
      .select('id, owner_id, name, store_name, slug, description, created_at')
      .order('name', { ascending: true });
    
    if (res.error) {
      console.error('[getVendors] Error fetching vendors:', res.error);
      return [];
    }

    const vendorsData = res.data || [];
    console.log('[getVendors] Got', vendorsData.length, 'vendors');
    
    if (vendorsData.length === 0) {
      console.warn('[getVendors] No vendors found');
      return [];
    }

    // Fetch products for each vendor
    console.log('[getVendors] Fetching products for vendors...');
    const vendorsWithProducts = await Promise.all(
      vendorsData.map(async (vendor) => {
        try {
          const { data: products, error: prodError } = await supabase
            .from('products')
            .select('id, title, base_price, image_url, gallery_images, is_published')
            .eq('vendor_id', vendor.id);
          
          if (prodError) {
            console.warn(`[getVendors] Error fetching products for vendor ${vendor.id}:`, prodError);
            return { ...vendor, products: [] };
          }
          
          console.log(`[getVendors] Got ${products?.length || 0} products for vendor ${vendor.store_name}`);
          return { ...vendor, products: products || [] };
        } catch (err) {
          console.error(`[getVendors] Exception fetching products for vendor ${vendor.id}:`, err);
          return { ...vendor, products: [] };
        }
      })
    );

    // Fetch avatars
    console.log('[getVendors] Fetching avatars...');
    const ownerIds = vendorsWithProducts.map(v => v.owner_id).filter(Boolean);
    let profilesMap = {};
    
    if (ownerIds.length > 0) {
      try {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', ownerIds);
        
        if (profileError) {
          console.warn('[getVendors] Error fetching profiles:', profileError);
        } else if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p.avatar_url;
            return acc;
          }, {});
          console.log('[getVendors] Got', profiles.length, 'avatars');
        }
      } catch (err) {
        console.warn('[getVendors] Exception fetching avatars:', err);
      }
    }

    // Map vendors to final format
    const mapped = vendorsWithProducts.map(v => {
      const prods = v.products || [];
      const published = prods.filter(p => p.is_published !== false);
      const featured = published.length ? published[0] : (prods[0] || null);
      const featured_product = featured ? {
        id: featured.id,
        title: featured.title,
        image: featured.image_url || (featured.gallery_images && featured.gallery_images[0]),
        price: formatCurrency(Number(featured.base_price || 0))
      } : null;

      return {
        id: v.id,
        owner_id: v.owner_id,
        name: v.store_name || v.name || v.slug,
        store_name: v.store_name || v.name || v.slug,
        slug: v.slug,
        description: v.description || '',
        avatar: profilesMap[v.owner_id] || null,
        cover_url: null,
        website: null,
        location: null,
        is_active: true,
        created_at: v.created_at,
        featured_product,
        categories: [],
        rating: undefined,
        total_products: prods.length || 0
      };
    });

    console.log('[getVendors] Returning', mapped.length, 'vendors');
    return mapped;
  } catch (err) {
    console.error('[getVendors] Exception:', err);
    return [];
  }
}

export async function getCategories() {
  if (!supabase) {
    console.warn('Supabase not initialized, returning empty categories array');
    return [];
  }

  const { data, error } = await supabase.from('categories').select('id, name, slug').order('name', { ascending: true });
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  // If categories table is empty, derive category names from product metadata to avoid a blank dropdown
  if (!data || data.length === 0) {
    try {
      const { data: products } = await supabase.from('products').select('id, title, category_id, metadata');
      if (products && products.length > 0) {
        const names = new Map();
        for (const p of products) {
          // Prefer stored category text, then metadata.category
          let name = (p?.metadata && (p.metadata.category || p.metadata?.category)) || null;
          if (!name) continue;
          name = String(name).trim();
          if (!names.has(name)) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            names.set(name, { id: slug, name, slug });
          }
        }
        if (names.size > 0) {
          return Array.from(names.values());
        }
      }
    } catch (e) {
      console.warn('Deriving categories from products failed', e?.message || e);
    }
  }

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
  if (!supabase) throw new Error('Supabase client not available');
  const { data, error } = await supabase.from('products').update(updates).eq('id', productId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(productId) {
  if (!supabase) throw new Error('Supabase client not available');
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
  return true;
}

export async function getProductById(productIdOrSlug) {
  if (!supabase) {
    console.warn('Supabase not initialized, returning null');
    return null;
  }
  console.debug('[getProductById] param:', productIdOrSlug);
  // Use shared helper to attempt multiple variant-select shapes (handles schema differences)
  let data = null;
  let error = null;

  const resId = await selectProductWithVariants(supabase, 'id', productIdOrSlug);
  if (resId.error) {
    console.warn('[getProductById] variant-select by id failed:', resId.error?.message || resId.error);
    try {
      const r = await supabase.from('products').select('*').eq('id', productIdOrSlug).maybeSingle();
      data = r.data; error = r.error;
    } catch (e) { error = e; }
  } else {
    data = resId.data; if (resId.used) console.debug('[getProductById] used variant select:', resId.used);
  }

  if (!data) {
    console.debug(`[getProductById] Not found by id, trying slug: ${productIdOrSlug}`);
    const resSlug = await selectProductWithVariants(supabase, 'slug', productIdOrSlug);
    if (resSlug.error) {
      console.warn('[getProductById] variant-select by slug failed:', resSlug.error?.message || resSlug.error);
      try {
        const r2 = await supabase.from('products').select('*').eq('slug', productIdOrSlug).maybeSingle();
        data = r2.data; error = r2.error;
      } catch (e) { error = e; }
    } else {
      data = resSlug.data; if (resSlug.used) console.debug('[getProductById] used variant select:', resSlug.used);
    }
  }

  if (error) {
    console.error(`[getProductById] Error fetching product with id/slug ${productIdOrSlug}:`, error);
    return null;
  }

  console.debug('[getProductById] result:', data);
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
  const { data, error } = await supabase.from('products').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}


export async function getVendorByOwner(ownerId) {
  if (!supabase) {
    console.warn('Supabase not initialized, returning null');
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('owner_id', ownerId)
      .single();

    if (error) {
      console.error(`Error fetching vendor with owner id ${ownerId}:`, error);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`Failed to load vendor with owner ${ownerId}`, err);
    return null;
  }
}

export async function getVendorDashboardData(vendorId) {
  if (!vendorId) {
    console.warn('Vendor ID is required to fetch dashboard data');
    return null;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/vendor/${vendorId}`);
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






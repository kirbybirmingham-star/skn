import { supabase } from '../lib/customSupabaseClient.js';
import { selectProductWithVariants } from '../lib/variantSelectHelper.js';

// API Configuration - use relative path for Vite proxy, full URL only if explicitly set in env
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || process.env.VITE_API_URL || '';

// API endpoints (non-PayPal)
const API_ENDPOINTS = {
  reviews: `${API_BASE_URL}/api/reviews`,
};

export function formatCurrency(amountInCents, currencyInfo = { code: 'USD', symbol: '$' }) {
  const amount = typeof amountInCents === 'number' ? amountInCents / 100 : 0;
  const currencyCode = (currencyInfo && currencyInfo.code) || 'USD';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode }).format(amount);
  } catch (e) {
    const symbol = (currencyInfo && currencyInfo.symbol) || '$';
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Create a PayPal order through the backend API
 * This is called from the frontend PayPal button's createOrder callback
 * The backend handles PayPal authentication with Client Secret
 */
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

    // Call our backend endpoint using relative path (Vite proxy will handle routing)
    // During development, Vite proxy routes /api to http://localhost:3001
    // During production, it's the same domain
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

/**
 * Capture a PayPal order through the backend API
 * This is called from the frontend PayPal button's onApprove callback
 * The backend handles PayPal authentication with Client Secret
 */
export async function capturePayPalOrder(orderID) {
  try {
    if (!orderID) {
      throw new Error('Order ID is required');
    }

    // Call our backend endpoint using relative path (Vite proxy will handle routing)
    const response = await fetch(`/api/paypal/capture-order/${orderID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend capture-order failed:', { status: response.status, body: data });
      throw new Error(data?.error || data?.message || 'Failed to capture PayPal order');
    }

    console.log('PayPal order captured successfully through backend:', orderID);
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

  const per = Number.isInteger(perPage) ? perPage : 24;
  const pg = Math.max(1, parseInt(page, 10) || 1);
  const start = (pg - 1) * per;
  const end = pg * per - 1;

  // Determine if we need to do client-side sorting
  // For price_asc/price_desc, we fetch all results then sort and paginate client-side
  const sb = String(sortBy || 'newest').toLowerCase();
  const isClientSideSort = sb === 'price_asc' || sb === 'price_desc' || sb === 'rating_asc' || sb === 'rating_desc';

  // Correctly chain query modifiers after select()
  let query = supabase
    .from('vendor_products')
    .select('*', { count: 'exact' });

  // Apply pagination only if server-side sorting; otherwise defer pagination to after client-side sort
  if (!isClientSideSort) {
    query = query.range(start, end);
  }

  // Apply sort-by param (only server-side sorts that apply here)
  if (!isClientSideSort) {
    switch (sb) {
      case 'oldest': query = query.order('created_at', { ascending: true }); break;
      case 'title_asc': query = query.order('title', { ascending: true }); break;
      case 'title_desc': query = query.order('title', { ascending: false }); break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }
  }

  // Add filters if they are provided
  if (sellerId) {
    query = query.eq('vendor_id', sellerId);
  }
  if (categoryId) {
    const cid = Number.isInteger(Number(categoryId)) ? Number(categoryId) : categoryId;
    query = query.eq('category_id', cid);
  } else if (options.categorySlug) {
    const slug = String(options.categorySlug).trim();
    // metadata->>category is the Postgres JSON extract, use ilike for case-insensitive match
    query = query.or(`metadata->>category.ilike.%${slug}%,title.ilike.%${slug}%`);
  }
  
  // Add search query filter
  if (searchQuery && String(searchQuery).trim().length > 0) {
    const searchQueryStr = String(searchQuery).trim();
    query = query.or(`title.ilike.%${searchQueryStr}%,description.ilike.%${searchQueryStr}%`);
  }
  
  // Add price range filter
  const parsePriceRange = (prToken) => {
    if (!prToken) return { min: null, max: null };
    const pr = String(prToken).toLowerCase();
    let min = null, max = null;
    if (pr.startsWith('under')) {
      const num = parseInt(pr.replace(/[^0-9]/g, ''), 10);
      max = isNaN(num) ? null : num * 100;
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
    // We'll consider priceRange: build variant ids first, then either constrain base price or union with variant-matched products
    let variantMatchedIds = [];
    if (priceRange && priceRange !== 'all') {
    const pr = String(priceRange).toLowerCase();
    // We'll implement server-side variant-based matching similar to products API.
    try {
      let variantIds = [];
      const pfs = [];
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
      if (pfs.length > 0) {
        const orExpr = pfs.join(',');
        const vr = await supabase.from('product_variants').select('product_id').or(orExpr);
        if (!vr.error && Array.isArray(vr.data)) {
          variantIds = Array.from(new Set(vr.data.map(r => r.product_id).filter(Boolean)));
        }
      }

      // Build base price constraints
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
      console.warn('Failed to apply variant-based price filtering for vendor_products', e?.message || e);
    }
  }

    // If we have variantMatchedIds, build union between base price results and variant-matched products
    let data, error, count;
    if (variantMatchedIds && variantMatchedIds.length > 0) {
      // Build base query
      let baseQ = query;
      // baseQ is already restricted by base price above
      try {
        const baseRes = await baseQ;
        const baseData = baseRes.error ? [] : (baseRes.data || []);
        // Build variant query, but re-apply usual non-price filters (sellerId/category/search)
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
        // now restrict to ids
        variantQ = variantQ.in('id', variantMatchedIds);
        const variantRes = await variantQ;
        const variantData = variantRes.error ? [] : (variantRes.data || []);
        const merged = [];
        const seen = new Set();
        for (const p of baseData.concat(variantData)) {
          if (!p || !p.id) continue;
          if (!seen.has(p.id)) { seen.add(p.id); merged.push(p); }
        }
        data = merged;
        // approximate total
        count = merged.length;
        error = null;
      } catch (e) {
        console.error('Error running union vendor_products queries:', e);
        data = []; count = 0; error = e;
      }
    } else {
      const res = await query;
      data = res.data; error = res.error; count = res.count;
    }

  if (error) {
    console.error('Error fetching products:', error);
    return { products: [], total: 0 };
  }

  // Helper: resolve image references (path or full url) to a public URL
  const resolveImageRef = (ref) => {
    if (!ref) return null;
    // If it's already a full URL, return as-is
    if (typeof ref === 'string' && (ref.startsWith('http') || ref.includes('/storage/v1/object/public/'))) return ref;
    // If it's an array of paths/urls, resolve each
    if (Array.isArray(ref)) {
      const buckets = ['skn-bridge-assets', 'listings-images', 'product-images'];
      return ref.map(r => {
        if (!r) return null;
        if (typeof r === 'string' && (r.startsWith('http') || r.includes('/storage/v1/object/public/'))) return r;
        for (const b of buckets) {
          try {
            const res = supabase.storage.from(b).getPublicUrl(r) || {};
            const publicUrl = res?.data?.publicUrl || (res && res.publicUrl);
            if (publicUrl) return publicUrl;
          } catch (e) {
            // ignore and try next
          }
        }
        return r;
      }).filter(Boolean);
    }

    // Single path string: try common buckets
    if (typeof ref === 'string') {
      const buckets = ['skn-bridge-assets', 'listings-images', 'product-images'];
      for (const b of buckets) {
        try {
          const res = supabase.storage.from(b).getPublicUrl(ref) || {};
          const publicUrl = res?.data?.publicUrl || (res && res.publicUrl);
          if (publicUrl) return publicUrl;
        } catch (e) {
          // ignore
        }
      }
    }
    return ref;
  };

  // Post-process: ensure variant images exist so UI can resolve a thumbnail.
  const products = (data || []).map(p => {
    try {
      // Normalize arrays/strings to public URLs when possible
      if (Array.isArray(p.images) && p.images.length > 0) {
        p.images = resolveImageRef(p.images);
      }
      if (Array.isArray(p.gallery_images) && p.gallery_images.length > 0) {
        p.gallery_images = resolveImageRef(p.gallery_images);
      }

      if (Array.isArray(p.product_variants)) {
        p.product_variants = p.product_variants.map(v => {
          if (!v) return v;
          if (!v.images || (Array.isArray(v.images) && v.images.length === 0)) {
            // copy product-level images into variant if missing
            return { ...v, images: p.images || [] };
          }
          return { ...v, images: resolveImageRef(v.images) };
        });
      }

      if (p.image_url && typeof p.image_url === 'string') {
        p.image_url = resolveImageRef(p.image_url) || p.image_url;
      }

      if (!p.image_url) {
        const variantImage = p?.product_variants?.[0]?.images?.[0];
        const imageUrl = variantImage || (p.images && p.images[0]) || (p.gallery_images && p.gallery_images[0]);
        if (imageUrl) {
          p.image_url = imageUrl;
        }
      }
    } catch (e) {
      console.warn('Variant image mapping or image_url population failed for product', p?.id, e?.message || e);
    }
    return p;
  });

  // Ensure every returned product has a normalized __effective_price (in cents)
  const normalizeToCents = (val) => {
    if (val == null) return 0;
    const n = Number(val);
    if (!Number.isFinite(n)) return 0;
    return Number.isInteger(n) ? Math.round(n) : Math.round(n * 100);
  };

  const productsWithEffective = products.map(p => {
    try {
      const base = normalizeToCents(p.base_price ?? p.base_price_in_cents ?? 0);
      let minVariant = null;
      if (Array.isArray(p.product_variants)) {
        for (const v of p.product_variants) {
          const vpRaw = v?.price_in_cents ?? v?.price ?? v?.price_cents ?? 0;
          const vPrice = normalizeToCents(vpRaw);
          if (vPrice > 0 && (minVariant === null || vPrice < minVariant)) minVariant = vPrice;
        }
      }
      const effective = (minVariant !== null && minVariant > 0) ? minVariant : base;
      return { ...p, __effective_price: Number(effective || 0) };
    } catch (e) {
      return { ...p, __effective_price: 0 };
    }
  });

  // Apply client-side sorting and pagination for price/rating sorts
  let finalProducts = productsWithEffective;
  let finalCount = count || productsWithEffective.length;
  
  if (isClientSideSort) {
    // For price/rating sorts, sort all results then paginate
    if (sb === 'price_asc' || sb === 'price_desc') {
      finalProducts.sort((a, b) => {
        const diff = (a.__effective_price || 0) - (b.__effective_price || 0);
        return sb === 'price_asc' ? diff : -diff;
      });
    } else if (sb === 'rating_asc' || sb === 'rating_desc') {
      finalProducts = finalProducts.map(p => {
        const ratings = p.product_ratings || [];
        const avg = ratings.length ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length) : 0;
        return { ...p, __avg_rating: avg };
      });
      finalProducts.sort((a, b) => {
        const diff = (b.__avg_rating || 0) - (a.__avg_rating || 0);
        return sb === 'rating_desc' ? diff : -diff;
      });
    }
    
    // Now apply pagination
    finalCount = finalProducts.length;
    finalProducts = finalProducts.slice(start, end + 1);
  }

  return { products: finalProducts, total: finalCount };
}

export async function getVendors() {
  if (!supabase) {
    console.warn('Supabase not initialized, returning empty vendors array');
    return [];
  }
  try {
    // Try vendor query including vendor_ratings relation. If the relation/table is missing
    // we retry without it so the vendor listing still works.
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
          products!products_vendor_id_fkey(id, title, slug, description, base_price, is_published, image_url, gallery_images),
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
          products!products_vendor_id_fkey(id, title, slug, description, base_price, is_published, image_url, gallery_images)
        `)
        .order('name', { ascending: true });
      data = res2.data; error = res2.error;
    }

    if (error) {
      console.error('Error fetching vendors:', error);
      return [];
    }

    // Fetch profile avatars separately by owner_id to avoid relying on foreign key relationships
    const ownerIds = (data || []).map(v => v.owner_id).filter(Boolean);
    let profilesMap = {};
    if (ownerIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, avatar_url')
          .in('id', ownerIds);
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = p.avatar_url;
            return acc;
          }, {});
        }
      } catch (err) {
        console.warn('Failed to fetch profile avatars:', err?.message || err);
      }
    }

    const mapped = (data || []).map(v => {
      const prods = v.products || [];
      const published = prods.filter(p => p.is_published !== false);
      const featured = published.length ? published[0] : (prods[0] || null);
      const featured_product = featured ? {
        id: featured.id,
        title: featured.title,
        image: featured.image_url || (featured.images && featured.images[0]) || (featured.gallery_images && featured.gallery_images[0]),
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
        avatar: profilesMap[v.owner_id] || null,
        cover_url: null,
        website: null,
        location: null,
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

  const { data, error } = await supabase.from('categories').select('id, name, slug').order('name', { ascending: true });
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  if (!data || data.length === 0) {
    try {
      const { data: products } = await supabase.from('products').select('id, title, category_id, metadata');
      if (products && products.length > 0) {
        const names = new Map();
        for (const p of products) {
          let name = (p && p.metadata && (p.metadata.category || p.metadata?.category)) || null;
          if (!name) continue;
          name = String(name).trim();
          const titleCased = name.split(/[-_\s]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
          if (!names.has(name)) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            names.set(name, { id: slug, name: titleCased, slug });
          }
        }
        if (names.size > 0) return Array.from(names.values());
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
  // Use helper to try multiple variant-select shapes and include ratings when possible
  let data = null;
  let error = null;

  const resId = await selectProductWithVariants(supabase, 'id', productIdOrSlug);
  if (resId.error) {
    // Fallback to product-only select if helper failed due to relation/column problems
    console.warn('[getProductById] variant-select by id failed:', resId.error?.message || resId.error);
    try {
      const r = await supabase.from('products').select('*').eq('id', productIdOrSlug).maybeSingle();
      data = r.data; error = r.error;
    } catch (e) { error = e; }
  } else {
    data = resId.data; if (resId.used) console.debug('[getProductById] used variant select:', resId.used);
  }

  // If not found by id, try by slug with same approach
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
      .select('id, owner_id, name, slug, description, created_at')
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
      .select('id, owner_id, name, slug, description, created_at')
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

/**
 * Create an order in the database after successful PayPal payment
 * @param {Object} paymentData - Data from PayPal capture response
 * @param {Array} cartItems - Items in the cart
 * @param {string} userId - User ID of the buyer
 * @returns {Object} Created order with id and status
 */
export async function createOrderFromPayPalPayment(paymentData, cartItems, userId) {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('Cart items are required');
    }

    // Calculate order total - PayPal returns dollars, but database stores as integer (cents)
    const totalAmountDollars = parseFloat(paymentData.purchase_units?.[0]?.amount?.value) || 0;
    const totalAmountCents = Math.round(totalAmountDollars * 100);

    // Prepare order data matching the actual database schema
    // total_amount is stored as INTEGER in CENTS (e.g., 9999 = $99.99)
    const orderData = {
      user_id: userId,
      status: 'paid', // PayPal payment is captured
      total_amount: totalAmountCents, // INTEGER - amount in cents
      currency: 'USD',
      shipping_address: paymentData.payer?.address || null,
      billing_address: paymentData.payer?.address || null,
      metadata: {
        paypal_order_id: paymentData.id,
        payment_status: paymentData.status,
        payer_email: paymentData.payer?.email_address,
        payment_source: 'paypal'
      }
    };

    console.log('Creating order with data:', orderData);

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create order:', orderError);
      throw orderError;
    }

    if (!order) {
      throw new Error('Order was created but not returned');
    }

    console.log('Order created successfully:', order.id);

    // Create order items
    const orderItems = cartItems.map(item => {
      // Price is in cents in cart, keep as cents for database storage
      const priceInCents = item.variant?.sale_price_in_cents ?? item.variant?.price_in_cents ?? item.product?.base_price ?? 0;
      const quantity = item.quantity || 1;
      const totalPrice = priceInCents * quantity; // Total price in cents

      return {
        order_id: order.id,
        product_id: item.product?.id,
        variant_id: item.variant?.id,
        vendor_id: item.product?.vendor_id,
        quantity: quantity,
        unit_price: priceInCents, // INTEGER - price in cents
        total_price: totalPrice, // INTEGER - total in cents
        metadata: {
          product_name: item.product?.title,
          variant_name: item.variant?.title
        }
      };
    });

    console.log('Creating order items:', orderItems);

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      console.error('Failed to create order items:', itemsError);
      throw itemsError;
    }

    console.log('Order items created successfully:', items?.length || 0);

    // Create payment record if the payments table exists
    try {
      const paymentRecord = {
        order_id: order.id,
        provider: 'paypal',
        provider_payment_id: paymentData.id,
        amount: totalAmountCents, // INTEGER - amount in cents
        currency: 'USD',
        status: paymentData.status,
        raw_response: paymentData
      };

      console.log('Creating payment record:', paymentRecord);

      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert([paymentRecord])
        .select()
        .single();

      if (paymentError) {
        console.error('Failed to create payment record:', paymentError);
        // Don't throw here - order is already created
      } else {
        console.log('Payment record created successfully:', payment?.id);
      }
    } catch (paymentErr) {
      console.warn('Could not create payment record:', paymentErr.message);
      // Non-critical error, don't fail the whole flow
    }

    return {
      orderId: order.id,
      status: order.status,
      totalAmount: order.total_amount / 100, // Convert from cents to dollars for display
      itemsCount: orderItems.length
    };
  } catch (error) {
    console.error('Error creating order from PayPal payment:', error);
    throw error;
  }
}






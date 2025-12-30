import { supabase } from '../lib/customSupabaseClient';
import { selectProductWithVariants, variantSelectCandidates } from '../lib/variantSelectHelper.js';
import { productRatingsExist } from '../lib/ratingsChecker.js';
import { API_CONFIG } from '../config/environment.js';
import { logDatabaseOperation } from '../lib/databaseDebugHelper.js';

// API endpoints (non-PayPal)
// In dev: API_CONFIG.baseURL = '/api', so this becomes '/api/reviews'
// In prod (deployed): API_CONFIG.baseURL = 'https://backend-api.onrender.com/api', so this becomes 'https://backend-api.onrender.com/api/reviews'
const API_ENDPOINTS = {
  reviews: `${API_CONFIG.baseURL}/reviews`,
};

/**
 * Check if current user can edit a product
 * Returns true if user is product owner or admin
 */
export async function canEditProduct(productId, userId) {
  if (!supabase || !userId) return false;
  
  try {
    // Fetch the product to get its vendor
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', productId)
      .single();
    
    if (productError || !product) {
      console.warn('Product not found:', productError);
      return false;
    }
    
    // Get vendor info to check if user is owner
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('owner_id')
      .eq('id', product.vendor_id)
      .single();
    
    if (vendorError || !vendor) {
      console.warn('Vendor not found:', vendorError);
      return false;
    }
    
    // Check if current user is the vendor owner
    const isOwner = vendor.owner_id === userId;
    
    // Check if user is admin (would require admin role in profiles table)
    // For now, we just check if they're the owner
    return isOwner;
  } catch (err) {
    console.error('Authorization check failed:', err);
    return false;
  }
}

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
 * Create a PayPal order using the PayPal Orders API
 * This is called from the frontend PayPal button's createOrder callback
 * Uses the PayPal Client ID (public) with the Orders API
 */
export async function createPayPalOrder(cartItems) {
  try {
    // Validate cart items before sending
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Ensure each item has required fields (allow products without variants using base_price)
    cartItems.forEach(item => {
      const hasPrice = (item?.variant?.price_in_cents ?? item?.product?.base_price) != null;
      if (!hasPrice) {
        throw new Error('Invalid item in cart');
      }
    });

    // Calculate order total for validation
    const orderTotal = cartItems.reduce((total, item) => {
      const priceCents = item.variant?.sale_price_in_cents ?? item.variant?.price_in_cents ?? item.product?.base_price ?? 0;
      const price = Number(priceCents) / 100;
      return total + (price * (item.quantity || 0));
    }, 0);

    if (orderTotal <= 0) {
      throw new Error('Invalid order total');
    }

    // Call our backend to create the PayPal order securely
    // Backend will use Client ID and Secret to authenticate with PayPal
    const response = await fetch(`${API_CONFIG.baseURL}/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
      throw new Error('Invalid order response');
    }

    console.log('PayPal order created successfully:', data.id);
    return data.id;
  } catch (error) {
    console.error("Failed to create PayPal order:", error);
    throw error;
  }
}

/**
 * Capture a PayPal order using the backend server
 * This is called from the frontend PayPal button's onApprove callback
 */
export async function capturePayPalOrder(orderID) {
  try {
    if (!orderID) {
      throw new Error('Order ID is required');
    }

    // Call our backend to capture the payment securely
    // Backend will use Client ID and Secret to authenticate with PayPal
    const response = await fetch(`${API_CONFIG.baseURL}/paypal/capture-order/${orderID}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Backend capture-order failed:', { status: response.status, body: data });
      throw new Error(data?.error || data?.message || 'Failed to capture payment');
    }

    console.log('PayPal order captured successfully:', data.id);
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
  const baseSelect = 'id, title, slug, vendor_id, base_price, currency, image_url, images, gallery_images, is_published, ribbon_text, inventory_quantity, created_at';
  // product_variants may use different label columns across schemas (e.g., 'name' or 'title').
  // Try a few variant-select shapes until one succeeds.
  // Use shared `variantSelectCandidates` imported from `variantSelectHelper.js`

  let productsQuery = null;
  let usedVariantSelect = null;
  // We'll prefer to include product_ratings when possible; check once to avoid failing queries
  const ratingsAvailable = await productRatingsExist(supabase).catch(() => false);
  const tryBuildQuery = (variantSelect, includeRatings = true) => {
    const relations = includeRatings ? `${variantSelect}, product_ratings` : `${variantSelect}`;
    // default ordering, may be overridden later with explicit sortBy
    return supabase.from('products').select(`${baseSelect}, ${relations}`).order('created_at', { ascending: false });
  };
  
  // Helper function to apply all filters to a query
  const applyFilters = (query, opts = { applyPrice: true }) => {
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

    if (opts.applyPrice && priceRange && priceRange !== 'all') {
      // We need to ensure we include products that either have a matching base_price
      // or have variants where the variant price falls within the requested range.
      const pr = String(priceRange).toLowerCase();
      const parseRange = () => {
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
      const range = parseRange();

      // Build a list of product ids from product_variants that match the price range
      // to ensure products whose pricing lives in variants are included.
      const buildVariantProducts = async () => {
        try {
          let vQuery = supabase.from('product_variants').select('product_id');
          // Filter by variant price fields that we support
          const priceFilters = [];
          if (range.min != null && range.max != null) {
            // price_in_cents in range OR numeric price in dollars in range
            priceFilters.push(`price_in_cents.gte.${range.min}`);
            priceFilters.push(`price_in_cents.lte.${range.max}`);
            priceFilters.push(`price.gte.${(range.min / 100)}`);
            priceFilters.push(`price.lte.${(range.max / 100)}`);
          } else if (range.min != null) {
            priceFilters.push(`price_in_cents.gte.${range.min}`);
            priceFilters.push(`price.gte.${(range.min / 100)}`);
          } else if (range.max != null) {
            priceFilters.push(`price_in_cents.lte.${range.max}`);
            priceFilters.push(`price.lte.${(range.max / 100)}`);
          }

          if (priceFilters.length === 0) return [];

          // join filters using OR: we can pass the or() syntax to PostgREST-like API
          // which Supabase uses. Use comma to separate expressions.
          const orExpr = priceFilters.join(',');
          const res = await vQuery.or(orExpr);
          if (res.error) return [];
          // unique product ids
          const ids = Array.from(new Set((res.data || []).map(r => r.product_id).filter(Boolean)));
          return ids;
        } catch (e) {
          console.warn('Variant price lookup failed:', e?.message || e);
          return [];
        }
      };

      // We'll precompute variant product ids here and then if any are found, add an "id.in" constraint.
      // Note: applyFilters can be used by both count and normal query builders; it's safe to run an async step here
      // but it means productsQuery building needs to handle that case. We'll instead attach a marker property
      // to the query to be replaced later. To keep it straightforward, if we are already inside an async function
      // building the query, we can compute these ids synchronously via awaiting here.
      // This function is called where supabase is available (top-level of file), so it's safe.
      (async () => {
        const variantIds = await buildVariantProducts();
        if (variantIds && variantIds.length > 0) {
          try {
            // Combine the variantIds into the existing base_price filter logic by requiring the returned product id
            // to be either within the base_price constraints (if specified) or present in variantIds.
            // If base_price filters already applied above, additional 'or' statements would be required, but
            // Supabase doesn't support mixing 'in' inside or expressions easily. So we just ensure we restrict
            // the query to any products whose id is among variantIds OR match existing filters.
            // Here we add a supplemental constraint: include products in variantIds, the final query will be
            // intersection of previously applied constraints and this id set which may be more strict than desired.
            // To avoid excluding base_price matches, if base price filters are present, perform a separate base query,
            // but for simplicity we in this pass will add an `or` clause with `id.in` to include these variant matches.
            const idStr = variantIds.map(id => String(id)).join(',');
            const orExpr = `id.in.(${idStr})`;
            try {
              query = query.or(orExpr);
            } catch (e) {
              // Some Supabase clients accept or(...), but to be defensive, if this fails, fall back to in()
              query = query.in('id', variantIds);
            }
          } catch (e) {
            // ignore failures here; we'll still have base_price filter
            console.warn('Failed to add variant id filter to products query', e?.message || e);
          }
        }
      })();

      // Apply the base_price constraints as before. This ensures products with base_price match are included.
      if (range.max != null && range.min == null) {
        query = query.lte('base_price', range.max);
      } else if (range.min != null && range.max == null) {
        query = query.gte('base_price', range.min);
      } else if (range.min != null && range.max != null) {
        query = query.gte('base_price', range.min);
        query = query.lte('base_price', range.max);
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

  // If priceRange is supplied, we'll build two queries so we can include products
  // matched by base_price or matched by variant prices. Otherwise apply filters normally.
  let variantMatchedIds = [];
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
  if (priceRange && priceRange !== 'all') {
    try {
      // Query product_variants for product_id matches for this range
      let vq = supabase.from('product_variants').select('product_id');
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
        try {
          const orExpr = pfs.join(',');
          const vr = await vq.or(orExpr);
          if (!vr.error && Array.isArray(vr.data)) {
            variantMatchedIds = Array.from(new Set(vr.data.map(r => r.product_id).filter(Boolean)));
          }
        } catch (e) {
          console.warn('Variant price product_id lookup failed:', e?.message || e);
        }
      }
    } catch (e) {
      console.warn('Error fetching variant product ids for priceRange:', e?.message || e);
    }
  }

  // If we have a price range and variantMatchedIds, we'll build base and variant queries separately
  if (priceRange && priceRange !== 'all' && variantMatchedIds && variantMatchedIds.length > 0) {
    // Build base_price query with price filter
    const baseProductsQuery = applyFilters(tryBuildQuery(usedVariantSelect, ratingsAvailable), { applyPrice: true });
    // Build variant products query; apply other filters but do not apply base_price here
    const variantProductsQuery = applyFilters(tryBuildQuery(usedVariantSelect, ratingsAvailable), { applyPrice: false }).in('id', variantMatchedIds);
    // We'll set productsQuery to a union placeholder; final execution will fetch both
    productsQuery = { baseQuery: baseProductsQuery, variantQuery: variantProductsQuery, isUnion: true };
  } else {
    productsQuery = applyFilters(productsQuery);
  }
  total = null;
  try {
    // Attempt count; if it errors due to unknown column in relation projection, retry with alternative variant selects
    let countAttempt = null;
    if (productsQuery && productsQuery.isUnion) {
      const baseCount = await productsQuery.baseQuery.select('id', { count: 'exact', head: true });
      const variantCount = await productsQuery.variantQuery.select('id', { count: 'exact', head: true });
      // Combine unique ids across both queries to estimate total
      const bIdsRes = await productsQuery.baseQuery.select('id');
      const vIdsRes = await productsQuery.variantQuery.select('id');
      const bIds = (bIdsRes.data || []).map(r => r.id).filter(Boolean);
      const vIds = (vIdsRes.data || []).map(r => r.id).filter(Boolean);
      const unionIds = Array.from(new Set([...bIds, ...vIds]));
      countAttempt = { count: unionIds.length, error: null };
    } else {
      countAttempt = await productsQuery.select('id', { count: 'exact', head: true });
    }
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
  if (productsQuery && productsQuery.isUnion) {
    productsQuery.baseQuery = productsQuery.baseQuery.range(start, end);
    productsQuery.variantQuery = productsQuery.variantQuery.range(start, end);
  } else {
    productsQuery = productsQuery.range(start, end);
  }

  // Execute the final products query. If it fails due to column mismatch, try alternative variant selects.
  let data, error;
  try {
    let res;
    if (productsQuery && productsQuery.isUnion) {
      // execute both
      const [rBase, rVariant] = await Promise.all([productsQuery.baseQuery, productsQuery.variantQuery]);
      const baseErr = rBase.error;
      const variantErr = rVariant.error;
      if (baseErr && variantErr && (String(baseErr.message).includes('does not exist') || baseErr.code === '42703') && (String(variantErr.message).includes('does not exist') || variantErr.code === '42703')) {
        res = { data: [], error: baseErr || variantErr };
      } else {
        const baseData = rBase.data || [];
        const varData = rVariant.data || [];
        // merge de-dup by id
        const merged = [];
        const seen = new Set();
        for (const p of baseData.concat(varData)) {
          if (!p || !p.id) continue;
          if (!seen.has(p.id)) { seen.add(p.id); merged.push(p); }
        }
        res = { data: merged, error: null };
      }
    } else {
      res = await productsQuery;
    }
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

  if (usedVariantSelect) console.debug('Used variant select:', usedVariantSelect);

  return { products: productsWithEffective, total: total ?? (Array.isArray(productsWithEffective) ? productsWithEffective.length : 0) };
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
    const normalizeToCentsLocal = (val) => {
      if (val == null) return 0;
      const n = Number(val);
      if (!Number.isFinite(n)) return 0;
      return Number.isInteger(n) ? Math.round(n) : Math.round(n * 100);
    };

    const mapped = vendorsWithProducts.map(v => {
      const origProds = v.products || [];
      // normalize vendor products: attach formatted price and effective cents price
      const prods = origProds.map(p => {
        try {
          const baseCents = normalizeToCentsLocal(p.base_price ?? p.base_price_in_cents ?? 0);
          // try to compute min variant price if variants exist
          let minVariant = null;
          if (Array.isArray(p.product_variants)) {
            for (const vv of p.product_variants) {
              const vpRaw = vv?.price_in_cents ?? vv?.price ?? vv?.price_cents ?? 0;
              const vPrice = normalizeToCentsLocal(vpRaw);
              if (vPrice > 0 && (minVariant === null || vPrice < minVariant)) minVariant = vPrice;
            }
          }
          const effective = (minVariant !== null && minVariant > 0) ? minVariant : baseCents;
          return { ...p, price_formatted: (baseCents ? formatCurrency(baseCents) : null), __effective_price: Number(effective || 0) };
        } catch (e) {
          return { ...p, price_formatted: null, __effective_price: 0 };
        }
      });
      const published = prods.filter(p => p.is_published !== false);
      const featured = published.length ? published[0] : (prods[0] || null);
      const featured_product = featured ? {
        id: featured.id,
        title: featured.title,
        image: featured.image_url || (featured.gallery_images && featured.gallery_images[0]),
        price: formatCurrency(Number(featured.base_price || 0)),
        __effective_price: (() => {
          try {
            const baseC = normalizeToCentsLocal(featured.base_price ?? featured.base_price_in_cents ?? 0);
            // if featured has variants, prefer lowest variant
            let minV = null;
            if (Array.isArray(featured.product_variants)) {
              for (const vv of featured.product_variants) {
                const vp = vv?.price_in_cents ?? vv?.price ?? vv?.price_cents ?? 0;
                const vpc = normalizeToCentsLocal(vp);
                if (vpc > 0 && (minV === null || vpc < minV)) minV = vpc;
              }
            }
            const eff = (minV !== null && minV > 0) ? minV : baseC;
            return Number(eff || 0);
          } catch (e) { return 0; }
        })()
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

/**
 * Get or create a category by name
 * Returns the category ID, or null if operation fails
 */
/**
 * Ensure "Uncategorized" default category exists
 */
export async function ensureDefaultCategory() {
  if (!supabase) return null;
  
  try {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', 'Uncategorized')
      .single();
    
    if (existing) return existing.id;
  } catch (e) {
    // Doesn't exist, create it
  }
  
  try {
    const { data: created } = await supabase
      .from('categories')
      .insert([{ name: 'Uncategorized', slug: 'uncategorized' }])
      .select('id')
      .single();
    
    return created?.id || null;
  } catch (error) {
    console.error('Error ensuring default category:', error);
    return null;
  }
}

/**
 * Alert admin of missing or incomplete categories
 */
export async function alertAdminMissingCategory(productId, categoryName, reason = 'FALLBACK_TO_UNCATEGORIZED') {
  if (!supabase) return;
  
  try {
    // Get current user for context
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'unknown';
    
    // Insert admin alert
    await supabase
      .from('admin_alerts')
      .insert([{
        alert_type: 'MISSING_CATEGORY',
        product_id: productId,
        requested_category: categoryName,
        reason,
        triggered_by: userId,
        created_at: new Date().toISOString(),
        status: 'UNRESOLVED',
        metadata: {
          productId,
          categoryName,
          reason,
          timestamp: new Date().toISOString()
        }
      }])
      .select();
    
    console.log(`🚨 Admin alert: Missing category "${categoryName}" for product ${productId}`);
  } catch (error) {
    console.warn('Could not create admin alert:', error.message);
  }
}

/**
 * Get or create category by name with fallback handling
 * If category cannot be created, falls back to "Uncategorized" and alerts admin
 */
export async function getOrCreateCategoryByName(categoryName, options = {}) {
  if (!supabase || !categoryName) return null;
  
  const { alertOnFallback = true, createIfMissing = true } = options;
  
  const cleanName = String(categoryName).trim();
  
  // Handle empty or whitespace-only names
  if (!cleanName || cleanName.length === 0) {
    console.warn('Empty category name provided');
    return await ensureDefaultCategory();
  }
  
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  try {
    // Try to find existing category (case-insensitive for flexibility)
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', cleanName)
      .single();
    
    if (existing) {
      console.log(`✅ Found existing category: ${cleanName} (id: ${existing.id})`);
      return existing.id;
    }
  } catch (e) {
    // Category doesn't exist, will try to create
    // Try case-insensitive search
    try {
      const { data: caseInsensitive } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', cleanName)
        .single();
      
      if (caseInsensitive) {
        console.log(`✅ Found existing category (case-insensitive): ${cleanName} (id: ${caseInsensitive.id})`);
        return caseInsensitive.id;
      }
    } catch (err) {
      // Still doesn't exist, will try to create
    }
  }
  
  // Only try to create if enabled
  if (!createIfMissing) {
    console.warn(`⚠️  Category "${cleanName}" not found and creation disabled`);
    return null;
  }
  
  // Category doesn't exist, try to create it
  try {
    const { data: created, error: createError } = await supabase
      .from('categories')
      .insert([{ name: cleanName, slug, metadata: { auto_created: true, created_at: new Date().toISOString() } }])
      .select('id')
      .single();
    
    if (createError) {
      console.warn(`⚠️  Could not create category "${cleanName}":`, createError.message);
      // Fall back to uncategorized
      console.log(`📌 Falling back to "Uncategorized" for "${cleanName}"`);
      if (alertOnFallback) {
        // Will alert when product is updated
      }
      return null; // Return null to trigger fallback
    }
    
    console.log(`✨ Created new category: ${cleanName} (id: ${created.id})`);
    return created.id;
  } catch (error) {
    console.error(`Error creating category "${cleanName}":`, error);
    console.log(`📌 Falling back to "Uncategorized" due to creation error`);
    return null;
  }
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
  
  // Generate slug from title
  const slug = (productData.title || 'product')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100);
  
  // Create the product
  const payload = {
    vendor_id: vendorId,
    title: productData.title,
    description: productData.description,
    slug: slug,
    base_price: productData.price_in_cents || 0,
    image_url: productData.image || null,
    is_published: true,
    metadata: {
      category: productData.category || 'Uncategorized'
    },
    created_at: new Date().toISOString()
  };
  
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert([payload])
    .select()
    .single();
  
  if (productError) throw productError;
  
  // Create variants if provided
  if (productData.variants && Array.isArray(productData.variants) && productData.variants.length > 0) {
    const variantsData = productData.variants.map((v, idx) => ({
      product_id: product.id,
      seller_id: vendorId, // Use vendor_id as seller_id for now
      sku: v.sku || `${slug}-v${idx + 1}`,
      price_in_cents: v.price_in_cents || productData.price_in_cents || 0,
      inventory_quantity: v.inventory_quantity || 0,
      attributes: v.attributes || { title: v.title || `Variant ${idx + 1}` },
      is_active: true
    }));
    
    const { error: variantsError } = await supabase
      .from('product_variants')
      .insert(variantsData);
    
    if (variantsError) {
      console.warn('Failed to create variants:', variantsError);
    }
  }
  
  // Re-fetch with variants to return complete product
  const { data: completeProduct } = await supabase
    .from('products')
    .select('*')
    .eq('id', product.id)
    .single();
  
  return completeProduct;
}

export async function updateProduct(productId, updates) {
  if (!supabase) throw new Error('Supabase client not available');
  
  console.log('🔍 updateProduct called with:', { productId, updates });
  
  // Get current user for authorization check
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('You must be logged in to update products');
  }
  
  // Check authorization
  const isAuthorized = await canEditProduct(productId, user.id);
  if (!isAuthorized) {
    throw new Error('You do not have permission to edit this product');
  }
  
  // Fetch current product to preserve existing metadata and other fields
  const { data: currentProduct, error: fetchError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  
  if (fetchError || !currentProduct) {
    throw new Error('Product not found');
  }
  
  // Map incoming updates to database schema
  const dbUpdates = {};
  
  // Extract variants before processing other fields (don't include in product update)
  const variantsToUpdate = updates.variants;
  
  // Only add fields that are being updated (non-undefined)
  if (updates.title !== undefined && updates.title !== null) {
    dbUpdates.title = String(updates.title).trim();
  }
  if (updates.description !== undefined && updates.description !== null) {
    dbUpdates.description = String(updates.description).trim();
  }
  if (updates.price_in_cents !== undefined && updates.price_in_cents !== null) {
    dbUpdates.base_price = Number(updates.price_in_cents);
  }
  if (updates.image !== undefined && updates.image !== null) {
    const imageUrl = String(updates.image).trim();
    // Only include image if it's a valid URL (not containing 'undefined')
    if (imageUrl && !imageUrl.includes('undefined') && imageUrl.length > 10) {
      dbUpdates.image_url = imageUrl;
    } else {
      console.warn('Invalid image URL, skipping:', imageUrl);
    }
  }
  
  // Handle metadata carefully - preserve existing metadata
  // Merge in category name and any other desired metadata
  if (updates.category !== undefined || Object.keys(updates).some(k => k.startsWith('metadata_'))) {
    const existingMetadata = (currentProduct.metadata && typeof currentProduct.metadata === 'object') 
      ? currentProduct.metadata 
      : {};
    
    const newMetadata = { ...existingMetadata };
    
    // Store category name in metadata for search/reference
    if (updates.category !== undefined && updates.category !== null) {
      newMetadata.category_name = String(updates.category).trim();
      newMetadata.category_updated_at = new Date().toISOString();
    }
    
    // Handle any metadata_* fields from form
    Object.entries(updates).forEach(([key, value]) => {
      if (key.startsWith('metadata_')) {
        const metaKey = key.replace('metadata_', '');
        if (value !== undefined && value !== null) {
          newMetadata[metaKey] = value;
        }
      }
    });
    
    if (Object.keys(newMetadata).length > 0) {
      dbUpdates.metadata = newMetadata;
    }
  }
  
  // Handle category FK - look up category ID from categories table
  let categoryWarning = null;
  if (updates.category !== undefined && updates.category !== null) {
    // Check if it's already a UUID (category_id) or a string (category name)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(updates.category));
    
    let categoryId;
    if (isUUID) {
      // Already a category_id, use it directly
      categoryId = updates.category;
      console.log(`📋 Using provided category_id: ${categoryId}`);
    } else {
      // It's a category name, look it up
      const requestedCategory = String(updates.category).trim();
      categoryId = await getOrCreateCategoryByName(requestedCategory);
      
      // If category creation failed, fall back to "Uncategorized"
      if (!categoryId) {
        console.warn(`⚠️  Category "${requestedCategory}" could not be resolved`);
        categoryWarning = `Category "${requestedCategory}" was not found and could not be created. Using "Uncategorized".`;
        
        // Try to get "Uncategorized" category ID
        categoryId = await ensureDefaultCategory();
        
        // Alert admin about the fallback
        await alertAdminMissingCategory(productId, requestedCategory, 'CREATION_FAILED');
      }
    }
    
    if (categoryId) {
      dbUpdates.category_id = categoryId;
      console.log(`📋 Setting category_id to: ${categoryId}`);
    }
  } else if (currentProduct.category_id === null || currentProduct.category_id === undefined) {
    // Product has no category, ensure it gets "Uncategorized"
    const defaultCatId = await ensureDefaultCategory();
    if (defaultCatId) {
      dbUpdates.category_id = defaultCatId;
      console.log(`📋 Auto-assigning "Uncategorized" to product with no category`);
    }
  }
  
  // If no updates, return current product
  if (Object.keys(dbUpdates).length === 0) {
    console.warn('No updates to apply');
    return currentProduct;
  }
  
  console.log('🔧 Final dbUpdates to send:', dbUpdates);
  console.log('🔍 Fields being updated:', Object.keys(dbUpdates));
  for (const [key, value] of Object.entries(dbUpdates)) {
    const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value).substring(0, 50);
    console.log(`   └─ ${key}: ${typeof value} = ${displayValue}`);
  }
  
  // Update product record
  const { data: product, error: productError } = await supabase
    .from('products')
    .update(dbUpdates)
    .eq('id', productId)
    .select()
    .single();
  
  if (productError) {
    // Log detailed error info
    console.error('❌ Supabase error:', {
      message: productError.message,
      code: productError.code,
      details: productError.details,
      hint: productError.hint
    });
    
    logDatabaseOperation({
      table: 'products',
      method: 'update',
      id: productId,
      payloadSent: dbUpdates,
      error: productError.message,
      context: 'updateProduct-api'
    });
    
    console.error('Product update error:', productError);
    console.error('Update payload was:', dbUpdates);
    throw new Error(`Failed to update product: ${productError.message}`);
  }
  
  // Log successful update
  logDatabaseOperation({
    table: 'products',
    method: 'update',
    id: productId,
    payloadSent: dbUpdates,
    payloadReceived: product,
    context: 'updateProduct-api'
  });
  
  // Handle variants if provided (separately from product update)
  if (variantsToUpdate && Array.isArray(variantsToUpdate) && variantsToUpdate.length > 0) {
    // Get existing variants
    const { data: existingVariants, error: variantFetchError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', productId);
    
    if (!variantFetchError && existingVariants && existingVariants.length > 0) {
      // Delete old variants
      const { error: deleteError } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId);
      
      if (deleteError) {
        console.warn('Failed to delete old variants:', deleteError);
      }
    }
    
    // Insert new variants
    const newVariants = variantsToUpdate.map((v, idx) => ({
      product_id: productId,
      seller_id: product.vendor_id,
      sku: v.sku || `${product.slug}-v${idx + 1}`,
      price_in_cents: Number(v.price_in_cents) || 0,
      inventory_quantity: Number(v.inventory_quantity) || 0,
      attributes: v.attributes || { title: v.title || `Variant ${idx + 1}` },
      is_active: true
    }));
    
    const { error: variantError } = await supabase
      .from('product_variants')
      .insert(newVariants);
    
    if (variantError) {
      console.warn('Failed to update variants:', variantError);
    }
  }
  
  // Re-fetch with updated data
  const { data: completeProduct, error: refetchError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();
  
  if (refetchError) {
    console.warn('Failed to re-fetch product:', refetchError);
    return product;
  }
  
  // Return product with warning if applicable
  if (categoryWarning) {
    console.warn(`⚠️  ${categoryWarning}`);
    return {
      ...completeProduct || product,
      _warning: categoryWarning
    };
  }
  
  return completeProduct || product;
}

export async function deleteProduct(productId) {
  if (!supabase) throw new Error('Supabase client not available');
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
  return true;
}

/**
 * Get unresolved admin alerts for missing categories
 */
export async function getAdminAlerts(options = {}) {
  if (!supabase) {
    console.warn('Supabase not initialized');
    return [];
  }
  
  const { status = 'UNRESOLVED', alertType = 'MISSING_CATEGORY', limit = 50 } = options;
  
  try {
    let query = supabase
      .from('admin_alerts')
      .select('*')
      .eq('status', status)
      .eq('alert_type', alertType)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    const { data, error } = await query;
    
    if (error) {
      console.warn('Error fetching admin alerts:', error.message);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAdminAlerts:', error);
    return [];
  }
}

/**
 * Mark admin alert as resolved
 */
export async function resolveAdminAlert(alertId, categoryId = null) {
  if (!supabase) return false;
  
  try {
    const updates = {
      status: 'RESOLVED',
      resolved_at: new Date().toISOString(),
      resolved_category_id: categoryId
    };
    
    const { error } = await supabase
      .from('admin_alerts')
      .update(updates)
      .eq('id', alertId);
    
    if (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in resolveAdminAlert:', error);
    return false;
  }
}

/**
 * Bulk migrate products missing categories
 * Useful for cleaning up products without categories
 */
export async function migrateMissingCategories(options = {}) {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  
  const { dryRun = true, batchSize = 100 } = options;
  
  try {
    // Get products without categories
    const { data: productsWithoutCategory, error: fetchError } = await supabase
      .from('products')
      .select('id, title, category_id')
      .is('category_id', null)
      .limit(batchSize);
    
    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }
    
    if (!productsWithoutCategory || productsWithoutCategory.length === 0) {
      console.log('✅ No products found missing categories');
      return { total: 0, updated: 0, errors: [] };
    }
    
    // Ensure "Uncategorized" category exists
    const uncategorizedId = await ensureDefaultCategory();
    if (!uncategorizedId) {
      throw new Error('Could not ensure default "Uncategorized" category');
    }
    
    console.log(`📊 Found ${productsWithoutCategory.length} products missing categories`);
    
    if (dryRun) {
      console.log('🔍 DRY RUN - Would update:', productsWithoutCategory.map(p => p.title));
      return { total: productsWithoutCategory.length, updated: 0, errors: [], dryRun: true };
    }
    
    // Update products
    const updates = productsWithoutCategory.map(p => ({
      id: p.id,
      category_id: uncategorizedId
    }));
    
    const { error: updateError } = await supabase
      .from('products')
      .upsert(updates);
    
    if (updateError) {
      throw new Error(`Failed to update products: ${updateError.message}`);
    }
    
    console.log(`✅ Successfully migrated ${productsWithoutCategory.length} products to "Uncategorized"`);
    
    return {
      total: productsWithoutCategory.length,
      updated: productsWithoutCategory.length,
      errors: []
    };
  } catch (error) {
    console.error('Error in migrateMissingCategories:', error);
    return {
      total: 0,
      updated: 0,
      errors: [error.message]
    };
  }
}

/**
 * Get category statistics
 * Shows how many products are in each category
 */
export async function getCategoryStats() {
  if (!supabase) {
    console.warn('Supabase not initialized');
    return {};
  }
  
  try {
    // Count products by category
    const { data: stats, error } = await supabase
      .from('products')
      .select('category_id, categories!inner(name, slug)')
      .order('category_id');
    
    if (error) {
      console.warn('Error fetching category stats:', error.message);
    }
    
    // Aggregate by category
    const categoryStats = {};
    const productsWithoutCategory = { name: 'Uncategorized', count: 0, slug: 'uncategorized' };
    
    if (stats) {
      stats.forEach(product => {
        if (!product.category_id) {
          productsWithoutCategory.count++;
        } else if (product.categories) {
          const cat = product.categories;
          if (!categoryStats[cat.slug]) {
            categoryStats[cat.slug] = { name: cat.name, count: 0, slug: cat.slug };
          }
          categoryStats[cat.slug].count++;
        }
      });
    }
    
    if (productsWithoutCategory.count > 0) {
      categoryStats['uncategorized'] = productsWithoutCategory;
    }
    
    return categoryStats;
  } catch (error) {
    console.error('Error in getCategoryStats:', error);
    return {};
  }
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
    console.warn('[EcommerceApi] Vendor ID is required to fetch dashboard data');
    return { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
  }
  try {
    const url = `${API_CONFIG.baseURL}/dashboard/vendor/${vendorId}`;
    console.log('[EcommerceApi] Fetching vendor dashboard data from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch vendor dashboard data: ${response.status}`);
    }
    const data = await response.json();
    console.log('[EcommerceApi] Dashboard data response:', data);
    return data || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
  } catch (error) {
    console.error('[EcommerceApi] Error fetching vendor dashboard data:', error);
    return { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 };
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
    // Insert into product_ratings table directly
    const { product_id, user_id, rating, title, body } = reviewData;
    
    const { data, error } = await supabase
      .from('product_ratings')
      .insert([{
        product_id,
        user_id,
        rating: parseInt(rating),
        comment: body || title || ''
      }])
      .select('*')
      .single();

    if (error) throw error;

    // Transform response to review format
    return {
      id: data.id,
      product_id: data.product_id,
      user_id: data.user_id,
      rating: data.rating,
      title: data.comment || `${data.rating}-star review`,
      body: data.comment || '',
      created_at: data.created_at
    };
  } catch (error) {
    console.error('Error creating review:', error);
    throw error;
  }
}






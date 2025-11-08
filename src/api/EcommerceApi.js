import { supabase } from '../lib/customSupabaseClient';

// PayPal API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// PayPal config will be handled by the backend
const API_ENDPOINTS = {
  createOrder: `${API_BASE_URL}/api/paypal/create-order`,
  captureOrder: `${API_BASE_URL}/api/paypal/capture-order`,
  config: `${API_BASE_URL}/api/paypal/config`
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
      if (!item?.variant?.price_in_cents) {
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

  // options can include { sellerId, categoryId, searchQuery, limit }
  const { sellerId, categoryId, searchQuery, priceRange, page = 1, perPage = 24 } = options;

  // Build base product filter conditions
  // Note: products table uses `vendor_id` (not seller_id) per schema. Map sellerId -> vendor_id.
  let productFilter = (qb) => qb;
  if (sellerId) productFilter = (qb) => qb.eq('vendor_id', sellerId);
  if (categoryId) {
    const prev = productFilter;
    productFilter = (qb) => prev(qb).eq('category_id', categoryId);
  }

  // Normalize search query
  let searchQueryStr = null;
  if (searchQuery && String(searchQuery).trim().length > 0) {
    searchQueryStr = String(searchQuery).trim();
  }

  // If priceRange is provided, first query product_variants to find matching product_ids
  let productIdsFromPrice = null;
  if (priceRange && priceRange !== 'all') {
    // priceRange expected to be a token like 'under-50', '50-200', 'over-500'
    let min = null;
    let max = null;
    const pr = String(priceRange).toLowerCase();
    if (pr.startsWith('under')) { max = parseInt(pr.replace(/[^0-9]/g, ''), 10) * 100; min = 0; }
    else if (pr.startsWith('over')) { min = parseInt(pr.replace(/[^0-9]/g, ''), 10) * 100; }
    else if (pr.includes('-')) {
      const parts = pr.split('-').map(p => parseInt(p.replace(/[^0-9]/g, ''), 10));
      if (parts.length === 2) { min = parts[0] * 100; max = parts[1] * 100; }
    }

    try {
      let variantQuery = supabase.from('product_variants').select('product_id');
      if (min !== null) variantQuery = variantQuery.gte('price_in_cents', min);
      if (max !== null && Number.isFinite(max)) variantQuery = variantQuery.lte('price_in_cents', max);
      const { data: variantData, error: variantError } = await variantQuery;
      if (variantError) {
        console.error('Error fetching variants for price filter:', variantError);
      } else {
        productIdsFromPrice = Array.from(new Set((variantData || []).map(v => v.product_id))).filter(Boolean);
      }
    } catch (err) {
      console.error('Price filter lookup failed:', err);
    }

    // If no matching product ids, return empty
    if (productIdsFromPrice && productIdsFromPrice.length === 0) {
      return { products: [], total: 0 };
    }
  }

  // Build the products query
  let productsQuery = supabase.from('products').select('*, product_variants(*)').order('created_at', { ascending: false });
  // Apply product-level filters
  if (sellerId) productsQuery = productsQuery.eq('vendor_id', sellerId);
  if (categoryId) productsQuery = productsQuery.eq('category_id', categoryId);
  if (productIdsFromPrice) productsQuery = productsQuery.in('id', productIdsFromPrice);
  if (searchQueryStr) {
    productsQuery = productsQuery.or(`title.ilike.%${searchQueryStr}%,description.ilike.%${searchQueryStr}%`);
  }

  // Get total count (exact) before pagination
  let total = null;
  try {
  const countQuery = supabase.from('products').select('id', { count: 'exact', head: true });
  if (sellerId) countQuery.eq('vendor_id', sellerId);
  if (categoryId) countQuery.eq('category_id', categoryId);
    if (productIdsFromPrice) countQuery.in('id', productIdsFromPrice);
    if (searchQueryStr) countQuery.or(`title.ilike.%${searchQueryStr}%,description.ilike.%${searchQueryStr}%`);
    const { error: countErr, count } = await countQuery;
    if (countErr) {
      console.warn('Failed to retrieve products count', countErr);
    } else {
      total = count || 0;
    }
  } catch (e) {
    console.warn('Count query failed', e);
  }

  // Apply pagination via range
  const per = Number.isInteger(perPage) ? perPage : 24;
  const pg = Math.max(1, parseInt(page, 10) || 1);
  const start = (pg - 1) * per;
  const end = pg * per - 1;
  productsQuery = productsQuery.range(start, end);

  const { data, error } = await productsQuery;

  if (error) {
    console.error('Error fetching products:', error);
    return { products: [], total: total ?? 0 };
  }

  return { products: data || [], total: total ?? (Array.isArray(data) ? data.length : 0) };
}

export async function getVendors() {
  if (!supabase) {
    console.warn('Supabase not initialized, returning empty vendors array');
    return [];
  }
  // Fetch from `vendors` table and include a small products selection so the UI can show a featured product
  try {
    // Disambiguate the products relationship using the products->vendor_id foreign key
    const { data, error } = await supabase
      .from('vendors')
      .select(`id, owner_id, name, slug, description, logo_url, cover_url, website, location, is_active, created_at, products!products_vendor_id_fkey(id, title, slug, description, image_url, base_price, is_published, product_variants(id, price_in_cents, inventory_quantity))`)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching vendors:', error);
      return [];
    }

    // Map to vendor card shape
    const mapped = (data || []).map(v => {
      const prods = v.products || [];
      const published = prods.filter(p => p.is_published !== false);
      const featured = published.length ? published[0] : (prods[0] || null);
      const featured_product = featured ? {
        id: featured.id,
        title: featured.title,
        image: featured.image_url || (featured.product_variants && featured.product_variants[0] && featured.product_variants[0].images ? featured.product_variants[0].images[0] : null),
        price: featured.product_variants && featured.product_variants[0] ? formatCurrency(Number(featured.product_variants[0].price_in_cents || featured.base_price * 100)) : null
      } : null;

      return {
        id: v.id,
        owner_id: v.owner_id,
        name: v.name || v.slug,
        store_name: v.name || v.slug,
        slug: v.slug,
        description: v.description || '',
        avatar: v.logo_url || v.cover_url || null,
        cover_url: v.cover_url || null,
        website: v.website || null,
        location: v.location || null,
        is_active: v.is_active,
        created_at: v.created_at,
        featured_product,
        categories: [], // categories would require a separate join; leave empty for now
        rating: null,
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

export async function createProduct(sellerId, productData) {
  if (!supabase) throw new Error('Supabase client not available');
  const payload = {
    seller_id: sellerId,
    seller_name: productData.seller_name,
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

export async function getProductById(productId) {
  if (!supabase) {
    console.warn('Supabase not initialized, returning null');
    return null;
  }
  const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();

  if (error) {
    console.error(`Error fetching product with id ${productId}:`, error);
    return null;
  }

  return data;
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

export async function listProductsBySeller(sellerId) {
  if (!supabase) throw new Error('Supabase client not available');
  const { data, error } = await supabase.from('products').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}







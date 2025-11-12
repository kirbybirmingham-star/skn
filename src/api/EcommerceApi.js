import { supabase } from '../lib/customSupabaseClient';

// PayPal API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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

  const { sellerId, categoryId, searchQuery, priceRange, page = 1, perPage = 24 } = options;

  let productsQuery = supabase.from('products').select(`
      id,
      vendor_id,
      title,
      slug,
      description,
      base_price,
      currency,
      is_published,
      image_url,
      gallery_images,
      featured,
      ribbon_text,
      vendors!inner(business_name),
      images (url, alt)
    `).order('created_at', { ascending: false });

  if (sellerId) productsQuery = productsQuery.eq('vendor_id', sellerId);
  if (categoryId) productsQuery = productsQuery.eq('category_id', categoryId);

  if (searchQuery && String(searchQuery).trim().length > 0) {
    const searchQueryStr = String(searchQuery).trim();
    productsQuery = productsQuery.or(`title.ilike.%${searchQueryStr}%,description.ilike.%${searchQueryStr}%`);
  }

  if (priceRange && priceRange !== 'all') {
    const pr = String(priceRange).toLowerCase();
    if (pr.startsWith('under')) {
      const max = parseInt(pr.replace(/[^0-9]/g, ''), 10) * 100;
      productsQuery = productsQuery.lte('base_price', max);
    } else if (pr.startsWith('over')) {
      const min = parseInt(pr.replace(/[^0-9]/g, ''), 10) * 100;
      productsQuery = productsQuery.gte('base_price', min);
    } else if (pr.includes('-')) {
      const parts = pr.split('-').map(p => parseInt(p.replace(/[^0-9]/g, ''), 10));
      if (parts.length === 2) {
        productsQuery = productsQuery.gte('base_price', parts[0] * 100);
        productsQuery = productsQuery.lte('base_price', parts[1] * 100);
      }
    }
  }

  let total = null;
  try {
    const { error: countErr, count } = await productsQuery.select('id', { count: 'exact', head: true });
    if (countErr) {
      console.warn('Failed to retrieve products count', countErr);
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
  try {
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        id, 
        owner_id, 
        business_name, 
        slug, 
        description, 
        created_at, 
        products!products_vendor_id_fkey(id, title, slug, description, base_price, is_published, image_url, images, gallery_images),
        profile:profiles(avatar_url),
        vendor_ratings(*)
      `)
      .order('business_name', { ascending: true });

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
        image: featured.image_url || (featured.images && featured.images[0]) || (featured.gallery_images && featured.gallery_images[0]),
        price: formatCurrency(Number(featured.base_price || 0))
      } : null;
      const rating = v.vendor_ratings?.[0];

      return {
        id: v.id,
        owner_id: v.owner_id,
        name: v.business_name || v.slug,
        store_name: v.business_name || v.slug,
        slug: v.slug,
        description: v.description || '',
        avatar: v.profile?.avatar_url,
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

export async function getProductById(productId) {
  if (!supabase) {
    console.warn('Supabase not initialized, returning null');
    return null;
  }
  const { data, error } = await supabase.from('products').select('*, product_variants(*), product_images(url, alt)').eq('id', productId).single();

  if (error) {
    console.error(`Error fetching product with id ${productId}:`, error);
    return null;
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
    const fileName = `listings-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const bucket = 'listings-images';

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






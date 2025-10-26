// PayPal API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://skn-2.onrender.com';

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
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    const response = await fetch(`${serverUrl}/api/paypal/capture-order/${orderID}`, {
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
  // options can include { sellerId }
  // Mock products data for development — include seller fields so marketplace can show seller/store links
  const allProducts = [
    {
      id: '1',
      title: 'Vintage Leather Backpack',
      description: 'Handcrafted genuine leather backpack with multiple compartments',
      seller_id: 'seller-1',
      seller_name: 'John D.',
      category: 'Accessories',
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=60',
      variants: [
        {
          id: '1-1',
          title: 'Classic Brown',
          price_in_cents: 12999,
          sale_price_in_cents: 9999,
          price_formatted: '$129.99',
          sale_price_formatted: '$99.99',
          inventory_quantity: 5,
          manage_inventory: true,
        }
      ]
    },
    {
      id: '2',
      title: 'Professional Camera Kit',
      description: 'Complete DSLR camera kit with accessories',
      seller_id: 'seller-2',
      seller_name: 'Sarah M.',
      category: 'Electronics',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=60',
      variants: [
        {
          id: '2-1',
          title: 'Full Kit',
          price_in_cents: 149999,
          sale_price_in_cents: null,
          price_formatted: '$1,499.99',
          sale_price_formatted: null,
          inventory_quantity: 3,
          manage_inventory: true,
        }
      ]
    },
    {
      id: '3',
      title: 'Mountain Bike',
      description: 'High-performance mountain bike for all terrains',
      seller_id: 'seller-3',
      seller_name: 'Mike R.',
      category: 'Sports',
      image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&w=800&q=60',
      variants: [
        {
          id: '3-1',
          title: 'Standard',
          price_in_cents: 89999,
          sale_price_in_cents: 79999,
          price_formatted: '$899.99',
          sale_price_formatted: '$799.99',
          inventory_quantity: 2,
          manage_inventory: true,
        }
      ]
    }
  ];

  if (options.sellerId) {
    return { products: allProducts.filter(p => p.seller_id === options.sellerId) };
  }

  return { products: allProducts };
}

export async function getVendors() {
  // Derive vendors from the available products. Each vendor aggregates basic profile info.
  const { products } = await getProducts();
  const map = new Map();
  
  // First pass: collect all products for each vendor
  (products || []).forEach((p) => {
    const id = p.seller_id || p.sellerId || p.seller;
    if (!id) return;
    
    if (!map.has(id)) {
      map.set(id, {
        id,
        name: p.seller_name || p.seller || 'Seller',
        store_name: p.store_name || `${p.seller_name || p.seller || 'Seller'}'s Store`,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(id)}`,
        description: p.seller_description || 'Quality products from a trusted seller',
        rating: 4.5,
        total_products: 0,
        products: [], // Keep track of all products
        categories: new Set(), // Track unique categories
      });
    }
    
    const entry = map.get(id);
    entry.products.push(p);
    entry.total_products += 1;
    if (p.category) {
      entry.categories.add(p.category);
    }
  });

  // Second pass: finalize vendor data
  const vendors = Array.from(map.values()).map(vendor => {
    // Get the best-selling or featured product for the store description
    const featuredProduct = vendor.products[0]; // Could enhance this to pick highest-rated/most sold
    return {
      ...vendor,
      description: vendor.description || `Offering ${Array.from(vendor.categories).join(', ')}`,
      categories: Array.from(vendor.categories),
      featured_product: featuredProduct ? {
        title: featuredProduct.title,
        image: featuredProduct.image,
        price: featuredProduct.variants?.[0]?.price_formatted
      } : null,
      products: vendor.products.slice(0, 3) // Only keep first 3 products for preview
    };
  });

  return vendors;
}

export async function getProductQuantities() {
  // Mock inventory data — return inventory_quantity to match ProductsList expectations
  return {
    variants: [
      { id: '1-1', inventory_quantity: 5 },
      { id: '2-1', inventory_quantity: 3 },
      { id: '3-1', inventory_quantity: 2 }
    ]
  };
}

/* Supabase-backed persistence helpers (optional). If Supabase env vars are set and the tables/buckets exist,
   these functions will use Supabase to persist products and images. Otherwise they fall back to the
   in-memory implementations above. */
import { supabase } from '@/lib/customSupabaseClient';

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

export async function listProductsBySellerSupabase(sellerId) {
  if (!supabase) throw new Error('Supabase client not available');
  const { data, error } = await supabase.from('products').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createProductSupabase(sellerId, productData) {
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

export async function updateProductSupabase(productId, updates) {
  if (!supabase) throw new Error('Supabase client not available');
  const { data, error } = await supabase.from('products').update(updates).eq('id', productId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProductSupabase(productId) {
  if (!supabase) throw new Error('Supabase client not available');
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
  return true;
}

// Update the public in-memory wrappers to prefer Supabase when available
// Only treat Supabase as available if the env vars are present to avoid calling a misconfigured client
const hasSupabase = !!(supabase && import.meta.env && import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export async function listProductsBySeller(sellerId) {
  if (hasSupabase) {
    try { return await listProductsBySellerSupabase(sellerId); } catch (err) { console.warn('Supabase list failed, falling back to in-memory', err); }
  }
  ensureInMemory();
  return inMemoryProducts.filter(p => p.seller_id === sellerId);
}

export async function getProductById(productId) {
  if (hasSupabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', productId).single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase getProductById failed, falling back to in-memory', err);
    }
  }
  ensureInMemory();
  return inMemoryProducts.find(p => p.id === productId) || null;
}

export async function createProduct(sellerId, productData) {
  if (hasSupabase) {
    try { return await createProductSupabase(sellerId, productData); } catch (err) { console.warn('Supabase create failed, falling back to in-memory', err); }
  }
  ensureInMemory();
  const id = String(Date.now());
  const newProduct = {
    id,
    seller_id: sellerId,
    seller_name: productData.seller_name || 'You',
    title: productData.title || 'Untitled Product',
    description: productData.description || '',
    category: productData.category || 'Uncategorized',
    image: productData.image || null,
    variants: productData.variants && productData.variants.length ? productData.variants : [
      {
        id: `${id}-v1`,
        title: 'Default Variant',
        price_in_cents: productData.price_in_cents || 0,
        sale_price_in_cents: null,
        price_formatted: formatCurrency(productData.price_in_cents || 0),
        sale_price_formatted: null,
        inventory_quantity: productData.inventory_quantity ?? 0,
        manage_inventory: true,
      }
    ]
  };

  inMemoryProducts.unshift(newProduct);
  return newProduct;
}

export async function updateProduct(productId, updates) {
  if (hasSupabase) {
    try { return await updateProductSupabase(productId, updates); } catch (err) { console.warn('Supabase update failed, falling back to in-memory', err); }
  }
  ensureInMemory();
  const idx = inMemoryProducts.findIndex(p => p.id === productId);
  if (idx === -1) throw new Error('Product not found');
  const product = inMemoryProducts[idx];
  const updated = { ...product, ...updates };
  inMemoryProducts[idx] = updated;
  return updated;
}

export async function deleteProduct(productId) {
  if (hasSupabase) {
    try { return await deleteProductSupabase(productId); } catch (err) { console.warn('Supabase delete failed, falling back to in-memory', err); }
  }
  ensureInMemory();
  const idx = inMemoryProducts.findIndex(p => p.id === productId);
  if (idx === -1) throw new Error('Product not found');
  inMemoryProducts.splice(idx, 1);
  return true;
}
// The in-memory store and fallback logic are defined earlier and used by the Supabase-aware wrappers.

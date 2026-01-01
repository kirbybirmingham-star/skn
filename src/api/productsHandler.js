/**
 * Products Handler - Centralized product data fetching with proper field handling
 * Handles Supabase RLS and ensures complete product data is returned
 */

import { supabase } from '@/lib/customSupabaseClient';

/**
 * Fetch products with complete field data
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Products array and total count
 */
export async function fetchProductsHandler(options = {}) {
  const { sellerId, categoryId, searchQuery, priceRange, page = 1, perPage = 24, sortBy = 'newest' } = options;

  try {
    // Request all fields explicitly to avoid RLS filtering issues
    const fieldsToSelect = 'id, title, slug, vendor_id, base_price, currency, description, image_url, gallery_images, is_published, created_at, category_id';

    console.log('🔧 productsHandler: Building query with fields:', fieldsToSelect);

    let query = supabase
      .from('products')
      .select(fieldsToSelect);

    // Add filters
    if (sellerId) {
      query = query.eq('vendor_id', sellerId);
      console.log('🔧 productsHandler: Filtering by vendor_id:', sellerId);
    }

    if (categoryId) {
      // Check both category_id (table) and metadata (fallback)
      query = query.or(`category_id.eq.${categoryId},metadata->category_id.eq."${categoryId}"`);
      console.log('🔧 productsHandler: Filtering by category_id (table or metadata):', categoryId);
    }

    if (searchQuery && String(searchQuery).trim().length > 0) {
      const searchStr = String(searchQuery).trim();
      query = query.or(`title.ilike.%${searchStr}%,description.ilike.%${searchStr}%`);
      console.log('🔧 productsHandler: Filtering by search:', searchStr);
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

    // Add sorting - map all options to supported backends sorts
    // Unsupported options (rating, popular) fall back to newest
    let sortColumn = 'created_at';
    let sortAscending = false;
    
    const sb = String(sortBy).toLowerCase();
    if (sb === 'price-low') {
      sortColumn = 'base_price';
      sortAscending = true;
    } else if (sb === 'price-high') {
      sortColumn = 'base_price';
      sortAscending = false;
    } else if (sb === 'title-asc' || sb === 'title_asc') {
      sortColumn = 'title';
      sortAscending = true;
    } else if (sb === 'title-desc' || sb === 'title_desc') {
      sortColumn = 'title';
      sortAscending = false;
    } else if (sb === 'oldest') {
      sortColumn = 'created_at';
      sortAscending = true;
    } else {
      // Default to newest (rating, popular, or unknown)
      sortColumn = 'created_at';
      sortAscending = false;
    }
    
    query = query.order(sortColumn, { ascending: sortAscending });
    console.log('🔧 productsHandler: Sorting by', sortColumn, sortAscending ? 'ASC' : 'DESC', '(requested:', sortBy, ')');

    // Add pagination
    const per = Number.isInteger(perPage) ? perPage : 24;
    const pg = Math.max(1, parseInt(page, 10) || 1);
    const start = (pg - 1) * per;
    const end = pg * per - 1;

    // Build separate query for getting exact count
    console.log('🔧 productsHandler: Getting total count...');
    let countQuery = supabase
      .from('products')
      .select('id', { count: 'exact', head: true });

    // Apply same filters to count query
    if (sellerId) countQuery = countQuery.eq('vendor_id', sellerId);
    if (categoryId) countQuery = countQuery.or(`category_id.eq.${categoryId},metadata->category_id.eq."${categoryId}"`);
    if (searchQuery && String(searchQuery).trim().length > 0) {
      const searchStr = String(searchQuery).trim();
      countQuery = countQuery.or(`title.ilike.%${searchStr}%,description.ilike.%${searchStr}%`);
    }
    if (priceRange && priceRange !== 'all') {
      const pr = String(priceRange).toLowerCase();
      if (pr.startsWith('under')) {
        const max = parseInt(pr.replace(/[^0-9]/g, ''), 10) * 100;
        countQuery = countQuery.lte('base_price', max);
      } else if (pr.startsWith('over')) {
        const min = parseInt(pr.replace(/[^0-9]/g, ''), 10) * 100;
        countQuery = countQuery.gte('base_price', min);
      } else if (pr.includes('-')) {
        const parts = pr.split('-').map(p => parseInt(p.replace(/[^0-9]/g, ''), 10));
        if (parts.length === 2) {
          countQuery = countQuery.gte('base_price', parts[0] * 100);
          countQuery = countQuery.lte('base_price', parts[1] * 100);
        }
      }
    }

    const { count: totalCount } = await countQuery;

    query = query.range(start, end);

    console.log('🔧 productsHandler: Executing query...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ productsHandler: Query error:', error.message);
      throw error;
    }

    console.log('🔧 productsHandler: Query successful!');
    console.log('🔧 productsHandler: Returned', data?.length || 0, 'products on page', pg);
    console.log('🔧 productsHandler: Total available:', totalCount || 0);
    
    if (data && data.length > 0) {
      const firstProduct = data[0];
      console.log('🔧 productsHandler: First product keys:', Object.keys(firstProduct));
      console.log('🔧 productsHandler: First product:', {
        id: firstProduct.id,
        title: firstProduct.title,
        base_price: firstProduct.base_price,
        currency: firstProduct.currency,
        vendor_id: firstProduct.vendor_id,
        category_id: firstProduct.category_id,
        image_url: firstProduct.image_url ? 'present' : 'missing'
      });
    }

    // Transform data to ensure consistency
    const products = (data || []).map(product => ({
      id: product.id,
      title: product.title || 'Untitled',
      slug: product.slug,
      vendor_id: product.vendor_id,
      base_price: product.base_price || 0,
      currency: product.currency || 'USD',
      description: product.description,
      image_url: product.image_url,
      gallery_images: product.gallery_images,
      is_published: product.is_published,
      created_at: product.created_at,
      category_id: product.category_id
    }));

    return {
      products,
      total: totalCount || data?.length || 0,
      page: pg,
      perPage: per,
      filters: { sellerId, categoryId, searchQuery, priceRange, sortBy }
    };
  } catch (err) {
    console.error('❌ productsHandler: Error fetching products:', err.message || err);
    return {
      products: [],
      total: 0,
      error: err.message || String(err)
    };
  }
}

/**
 * Fetch a single product by ID
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Product data or null
 */
export async function fetchProductByIdHandler(productId) {
  if (!productId) return null;

  try {
    const fieldsToSelect = 'id, title, slug, vendor_id, base_price, currency, description, image_url, gallery_images, is_published, created_at';

    const { data, error } = await supabase
      .from('products')
      .select(fieldsToSelect)
      .eq('id', productId)
      .single();

    if (error) {
      console.error('❌ productsHandler: Error fetching product:', error.message);
      return null;
    }

    return data;
  } catch (err) {
    console.error('❌ productsHandler: Error fetching product:', err.message);
    return null;
  }
}

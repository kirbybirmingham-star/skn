import React, { useState, useEffect } from 'react';
import { Loader2, ShoppingCart } from 'lucide-react';
import { getProducts, formatCurrency } from '@/api/EcommerceApi';
import MarketplaceProductCard from './products/MarketplaceProductCard';


const ProductsList = ({ sellerId = null, categoryId = null, categorySlug = null, searchQuery = '', priceRange = 'all', sortBy = 'newest' }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(24);
  const [total, setTotal] = useState(null);

  // When filters or sort change, reset page to 1
  useEffect(() => {
    setPage(1);
  }, [sellerId, categoryId, categorySlug, searchQuery, priceRange, sortBy]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Normalize incoming priceRange into tokens our API understands
        const normalizePriceRange = (pr) => {
          if (!pr) return 'all';
          const p = String(pr).toLowerCase();
          if (p.includes('under')) return 'under-50';
          if (p.includes('over')) return 'over-500';
          // ranges like '50-200' or '$50-$200' or '50 - 200'
          const nums = p.match(/(\d+)/g);
          if (nums && nums.length >= 2) return `${nums[0]}-${nums[1]}`;
          return 'all';
        };

        const prToken = normalizePriceRange(priceRange);
        const resp = await getProducts({ sellerId, categoryId, categorySlug, searchQuery, priceRange: prToken, page, perPage, sortBy });

        if (!resp.products || resp.products.length === 0) {
          setProducts([]);
          setTotal(resp.total || 0);
          return;
        }

        let results = (resp.products || []).map(p => ({ ...p }));
        // Compute effective price for each product (base_price or min variant price)
        results = results.map(p => {
          const base = Number(p.base_price || p.base_price_in_cents || 0);
          let minVariant = null;
          if (Array.isArray(p.product_variants)) {
            for (const v of p.product_variants) {
              const vPrice = Number(v?.price || v?.price_in_cents || 0);
              if (vPrice > 0 && (minVariant === null || vPrice < minVariant)) minVariant = vPrice;
            }
          }
          const effective = (minVariant !== null && minVariant > 0) ? minVariant : base;
          return { ...p, __effective_price: Number(effective || 0) };
        });

        // Client-side price range filtering using __effective_price
        if (prToken && prToken !== 'all') {
          const pr = String(prToken).toLowerCase();
          let min = null, max = null;
          if (pr.startsWith('under')) {
            const num = parseInt(pr.replace(/[^0-9]/g, ''), 10);
            min = 0;
            max = isNaN(num) ? null : num * 100;
          } else if (pr.startsWith('over')) {
            const num = parseInt(pr.replace(/[^0-9]/g, ''), 10);
            min = isNaN(num) ? null : num * 100;
            max = null;
          } else if (pr.includes('-')) {
            const parts = pr.match(/(\d+)/g);
            if (parts && parts.length >= 2) {
              min = parseInt(parts[0], 10) * 100;
              max = parseInt(parts[1], 10) * 100;
            }
          }
          if (min !== null || max !== null) {
            results = results.filter(p => {
              const price = Number(p.__effective_price || 0);
              if (min !== null && price < min) return false;
              if (max !== null && price > max) return false;
              return true;
            });
          }
        }

        // Client-side sorting by rating and price
        const s = String(sortBy).toLowerCase();
        if (s === 'rating_desc' || s === 'rating_asc') {
          results = results.map(p => {
            const ratings = p.product_ratings || [];
            const avg = ratings.length ? (ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length) : 0;
            return { ...p, __avg_rating: avg };
          });
          results.sort((a, b) => {
            const diff = (b.__avg_rating || 0) - (a.__avg_rating || 0);
            return s === 'rating_desc' ? diff : -diff;
          });
        } else if (s === 'price_asc' || s === 'price_desc') {
          results.sort((a, b) => {
            const diff = (a.__effective_price || 0) - (b.__effective_price || 0);
            return s === 'price_asc' ? diff : -diff;
          });
        }

        // Client-side category slug filter: ensure products using metadata-based categories are included
        // When categorySlug is not set (showing 'all'), include all products including those with no category
        if (categorySlug) {
          const slug = String(categorySlug).toLowerCase();
          results = results.filter(p => {
            if (p.category_id && String(p.category_id) === String(categoryId)) return true;
            // metadata may have a category field
            const metaCat = p?.metadata?.category || p?.metadata?.subcategory || null;
            if (metaCat && String(metaCat).toLowerCase().includes(slug)) return true;
            if (String(p?.title || '').toLowerCase().includes(slug)) return true;
            return String(p?.slug || '').toLowerCase().includes(slug);
          });
        }
        // When no category filter is applied (categorySlug is null), include all products including uncategorized ones
        setProducts(results);
        setTotal(resp.total ?? null);
      } catch (err) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [sellerId, categoryId, categorySlug, searchQuery, priceRange, page, sortBy]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-blue-600 animate-spin mb-4" />
          <p className="text-slate-600 animate-pulse">Loading amazing products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12 bg-red-50 rounded-3xl border border-red-100 shadow-lg max-w-2xl mx-auto">
        <div className="text-red-500 bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-red-700 mb-2">Oops! Something went wrong</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center p-12 bg-slate-50 rounded-3xl border border-slate-100 shadow-lg max-w-2xl mx-auto">
        <div className="text-slate-400 bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-700 mb-2">No Products Available</h3>
        <p className="text-slate-600">Our sellers are adding new products soon. Please check back later!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
      {products.map((product, index) => (
        <MarketplaceProductCard key={product.id} product={product} index={index} />
      ))}
      {/* Pagination controls */}
      {total > perPage && (
        <div className="col-span-full flex items-center justify-center space-x-4 mt-6">
          <button className="px-3 py-2 bg-white border rounded" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span className="text-sm text-slate-600">Page {page} {total ? `of ${Math.ceil(total / perPage)}` : ''}</span>
          <button className="px-3 py-2 bg-white border rounded" onClick={() => setPage(p => p + 1)} disabled={total && page >= Math.ceil(total / perPage)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default ProductsList;
import React, { useState, useEffect } from 'react';
import { Loader2, ShoppingCart } from 'lucide-react';
import { getProducts } from '@/api/EcommerceApi';
import ProductCard from './ProductCard';


const ProductsList = ({ sellerId = null, categoryId = null, searchQuery = '', priceRange = 'all' }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductsWithQuantities = async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await getProducts({ sellerId, categoryId, searchQuery });
        if (!resp.products || resp.products.length === 0) {
          setProducts([]);
          return;
        }

        // Normalize variants and ensure inventory_quantity exists
        let productsWithQuantities = resp.products.map(product => {
          const productVariants = product.variants || product.product_variants || [];
          return {
            ...product,
            image: product.image || product.image_url || null,
            seller_name: product.seller_name || product.seller || null,
            variants: productVariants.map(variant => ({
              ...variant,
              inventory_quantity: variant.inventory_quantity ?? 0
            }))
          };
        });

        // Apply client-side filters: category, search text, price range
        // category and search are applied server-side; only apply priceRange client-side

        if (priceRange && priceRange !== 'all') {
          const ranges = {
            'under $50': [0, 5000],
            '$50-$200': [5000, 20000],
            '$200-$500': [20000, 50000],
            'over $500': [50000, Infinity]
          };
          const key = priceRange.toLowerCase();
          const range = ranges[Object.keys(ranges).find(k => k.toLowerCase() === key)];
          if (range) {
            productsWithQuantities = productsWithQuantities.filter(p => {
              const variantPrices = (p.variants || []).map(v => v.price_in_cents || v.price || Infinity);
              const minPrice = Math.min(...(variantPrices.length ? variantPrices : [Infinity]));
              return minPrice >= range[0] && minPrice <= range[1];
            });
          }
        }

        setProducts(productsWithQuantities);
      } catch (err) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProductsWithQuantities();
  }, [sellerId]);

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
        <ProductCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
};

export default ProductsList;
import React, { useState, useEffect } from 'react';
import { Loader2, ShoppingCart } from 'lucide-react';
import { getProducts, getProductQuantities } from '@/api/EcommerceApi';
import ProductCard from './ProductCard';


const ProductsList = ({ sellerId = null }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductsWithQuantities = async () => {
      try {
        setLoading(true);
        setError(null);

        const productsResponse = await getProducts(sellerId ? { sellerId } : {});

        if (!productsResponse.products || productsResponse.products.length === 0) {
          setProducts([]);
          return;
        }

        const productIds = productsResponse.products.map(product => product.id);

        const quantitiesResponse = await getProductQuantities({
          fields: 'inventory_quantity',
          product_ids: productIds
        });

        const variantQuantityMap = new Map();
        if (quantitiesResponse.variants) {
          quantitiesResponse.variants.forEach(variant => {
            variantQuantityMap.set(variant.id, variant.inventory_quantity);
          });
        }

        const productsWithQuantities = productsResponse.products.map(product => ({
          ...product,
          image: product.image || product.image_url || null,
          seller_name: product.seller_name || product.seller || null,
          variants: product.variants.map(variant => ({
            ...variant,
            inventory_quantity: variantQuantityMap.get(variant.id) ?? variant.inventory_quantity
          }))
        }));

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
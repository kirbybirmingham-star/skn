import React, { useState, useEffect } from 'react';
import { Loader2, ShoppingCart, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { getProducts, formatCurrency } from '@/api/EcommerceApi';
import MarketplaceProductCard from './products/MarketplaceProductCard';
import { SkeletonGrid } from './ui/skeleton';
import diagnosticProductCards from '@/lib/diagnosticProductCards';


const ProductsList = ({ sellerId = null, categoryId = null, searchQuery = '', priceRange = 'all', sortBy = 'newest', viewMode = 'grid' }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(24);
  const [total, setTotal] = useState(null);

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
        const resp = await getProducts({
          sellerId,
          categoryId,
          searchQuery,
          priceRange: prToken,
          sortBy,
          page,
          perPage
        });

        console.log('🛍️ ProductsList: Received products response:', {
          productsCount: resp.products?.length || 0,
          total: resp.total,
          page,
          perPage,
          filters: { sellerId, categoryId, searchQuery, priceRange: prToken }
        });

        if (!resp.products || resp.products.length === 0) {
          console.log('🛍️ ProductsList: No products found');
          setProducts([]);
          setTotal(resp.total || 0);
          return;
        }

        console.log('🛍️ ProductsList: Setting products state with', resp.products.length, 'products');
        resp.products.forEach((p, i) => {
          console.log(`🛍️ ProductsList: Product ${i + 1}: "${p.title}"`, {
            id: p.id,
            title: p.title,
            base_price: p.base_price,
            currency: p.currency,
            image_url: p.image_url,
            gallery_images: p.gallery_images,
            hasImageUrl: !!p.image_url,
            hasImages: Array.isArray(p.images) && p.images.length > 0,
            hasVariants: Array.isArray(p.product_variants) && p.product_variants.length > 0
          });
        });

        setProducts(resp.products);
        setTotal(resp.total ?? null);
        
        // Run diagnostic
        diagnosticProductCards(resp.products);
      } catch (err) {
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [sellerId, categoryId, searchQuery, priceRange, sortBy, page]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonGrid count={viewMode === 'list' ? 6 : 8} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12 bg-destructive/5 rounded-xl border border-destructive/20 shadow-lg max-w-2xl mx-auto">
        <div className="text-destructive bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-destructive mb-2">Unable to Load Products</h3>
        <p className="text-destructive/80 mb-6">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-destructive/20 text-destructive hover:bg-destructive/5"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => window.history.back()}
            variant="ghost"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    const hasFilters = searchQuery || (typeof selectedCategory !== 'undefined' && selectedCategory !== 'all') || priceRange !== 'all';
    return (
      <div className="text-center p-12 bg-muted/30 rounded-xl border border-border shadow-sm max-w-2xl mx-auto">
        <div className="text-muted-foreground bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-3">
          {hasFilters ? 'No Products Match Your Filters' : 'No Products Available Yet'}
        </h3>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          {hasFilters
            ? 'Try adjusting your search criteria or clearing some filters to discover more products.'
            : 'Our sellers are actively adding new products. Check back soon for the latest items!'
          }
        </p>
        {hasFilters && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => window.location.href = '/marketplace'}
              variant="default"
            >
              View All Products
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* SUCCESS INDICATOR: Products are loading correctly */}
      <div className="mb-4 p-4 bg-success/10 border border-success/30 rounded-lg text-sm">
        <div className="font-bold text-success mb-2">✅ Products Successfully Loaded</div>
        <div className="text-success space-y-1">
          <div>Current Page: {page} ({products.length} products showing)</div>
          <div>Total Available: {total} products in database</div>
          <div>Pages: {Math.ceil(total / perPage)}</div>
          {products.length > 0 && (
            <div className="mt-2 pt-2 border-t border-success/30">
              <div>✓ Product titles: <span className="font-mono text-success">{products[0]?.title}</span></div>
              <div>✓ Product pricing: <span className="font-mono text-success">${(products[0]?.base_price / 100).toFixed(2)} {products[0]?.currency}</span></div>
              <div>✓ Product images: <span className="font-mono text-success">{products[0]?.image_url ? 'Loaded' : 'Using placeholder'}</span></div>
            </div>
          )}
        </div>
      </div>
      
      <div className={
        viewMode === 'list'
          ? 'space-y-4'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
      }>
        {products.map((product, index) => (
          <MarketplaceProductCard
            key={product.id}
            product={product}
            index={index}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Enhanced Pagination controls */}
      {total > perPage && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-2"
          >
            ← Previous
          </Button>

          <div className="flex items-center space-x-1">
            {/* First page */}
            {page > 3 && (
              <>
                <Button variant={page === 1 ? 'default' : 'ghost'} size="sm" onClick={() => setPage(1)}>1</Button>
                {page > 4 && <span className="px-2">...</span>}
              </>
            )}

            {/* Pages around current page */}
            {Array.from({ length: 5 }, (_, i) => {
              const pageNum = page - 2 + i;
              if (pageNum >= 1 && pageNum <= Math.ceil(total / perPage)) {
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              }
              return null;
            })}

            {/* Last page */}
            {page < Math.ceil(total / perPage) - 2 && (
              <>
                {page < Math.ceil(total / perPage) - 3 && <span className="px-2">...</span>}
                <Button
                  variant={page === Math.ceil(total / perPage) ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setPage(Math.ceil(total / perPage))}
                >
                  {Math.ceil(total / perPage)}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={total && page >= Math.ceil(total / perPage)}
            className="flex items-center gap-2"
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductsList;
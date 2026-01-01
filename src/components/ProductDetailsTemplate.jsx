import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw, MapPin } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/use-toast';
import { supabase } from '../lib/customSupabaseClient';

const ProductDetailsTemplate = ({ product: initialProduct, showBackButton = true }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [product, setProduct] = useState(initialProduct);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(!initialProduct);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    if (id && !initialProduct) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      
      // Fetch product without embedding variants (due to multiple relationships)
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          slug,
          vendor_id,
          base_price,
          currency,
          image_url,
          gallery_images,
          is_published,
          created_at
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setProduct(data);
      
      // Fetch product variants separately
      const { data: variants } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);
      
      if (variants && variants.length > 0) {
        setSelectedVariant(variants[0]);
      }
      
      setReviews(data.reviews || []);

      // Fetch related products from products table
      const { data: related } = await supabase
        .from('products')
        .select('id, title, slug, base_price, image_url')
        .eq('vendor_id', data.vendor_id)
        .neq('id', id)
        .limit(4);
      setRelatedProducts(related || []);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const allImages = product?.gallery_images || (product?.image_url ? [product.image_url] : [
    `https://i.pravatar.cc/800x600?u=${product?.id || 'default'}`,
    `https://i.pravatar.cc/800x600?u=${product?.id || 'default'}2`,
    `https://i.pravatar.cc/800x600?u=${product?.id || 'default'}3`
  ]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast({
        title: "Please select a variant",
        description: "Choose a product variant before adding to cart",
        variant: "destructive",
      });
      return;
    }

    try {
      await addToCart({
        productId: product.id,
        variantId: selectedVariant.id,
        quantity,
        price: selectedVariant.price_in_cents / 100
      });

      toast({
        title: "Added to cart",
        description: `${product.title} has been added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted animate-pulse rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
              <div className="h-6 bg-muted animate-pulse rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {showBackButton && (
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 -ml-2"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={allImages[currentImageIndex]}
                  alt={`${product.title || product.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>

              {allImages.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {allImages.slice(0, 5).map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.title || product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.title || product.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({reviews.length} reviews)</span>
                  </div>
                )}
                <Badge variant="secondary">{product.category || 'Product'}</Badge>
              </div>
              <p className="text-lg text-muted-foreground">{product.description}</p>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                ${(selectedVariant?.price_in_cents ? selectedVariant.price_in_cents / 100 : product.base_price / 100).toFixed(2)}
              </span>
              {selectedVariant && selectedVariant.price_in_cents !== product.base_price && (
                <span className="text-lg text-muted-foreground line-through">
                  ${(product.base_price / 100).toFixed(2)}
                </span>
              )}
            </div>

            {/* Variants */}
            {product.product_variants && product.product_variants.length > 1 && (
              <div>
                <h3 className="font-medium mb-3">Options</h3>
                <div className="grid grid-cols-2 gap-2">
                  {product.product_variants.map((variant) => (
                    <Button
                      key={variant.id}
                      variant={selectedVariant?.id === variant.id ? "default" : "outline"}
                      onClick={() => setSelectedVariant(variant)}
                      className="justify-start"
                    >
                      {variant.attributes?.color && (
                        <div
                          className="w-4 h-4 rounded-full mr-2 border"
                          style={{ backgroundColor: variant.attributes.color }}
                        />
                      )}
                      {variant.attributes?.size || variant.attributes?.default || 'Standard'}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="font-medium">Quantity:</label>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="px-4 py-2">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddToCart} className="flex-1" size="lg">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Vendor Information */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="font-medium text-primary">
                      V
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium">Vendor Store</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>Caribbean Islands</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="w-4 h-4 text-primary" />
                <span>Free shipping</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-primary" />
                <span>2-year warranty</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RotateCcw className="w-4 h-4 text-primary" />
                <span>30-day returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
            <div className="grid gap-4">
              {reviews.slice(0, 3).map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">
                          U
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="font-medium">{review.title}</span>
                        </div>
                        <p className="text-muted-foreground">{review.body}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Card
                  key={relatedProduct.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/product/${relatedProduct.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square mb-3 overflow-hidden rounded-md">
                      <img
                        src={relatedProduct.image_url || `https://i.pravatar.cc/300x300?u=${relatedProduct.id}`}
                        alt={relatedProduct.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium text-sm mb-1 line-clamp-2">{relatedProduct.title}</h3>
                    <p className="text-lg font-bold">${(relatedProduct.base_price / 100).toFixed(2)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsTemplate;
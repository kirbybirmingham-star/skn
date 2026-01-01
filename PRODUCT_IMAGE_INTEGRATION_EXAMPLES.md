# Product Image Integration Examples

## Complete Integration Patterns

### 1. Product Creation with Image Upload

```javascript
// src/pages/vendor/ProductCreate.jsx
import { useState } from 'react';
import { ImageUpload } from '@/components/image/ImageUpload';
import { updateProductImage } from '@/api/productImageApi';
import { createProduct } from '@/api/productApi';

export default function ProductCreate() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    imageUrl: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageSelect = async (image) => {
    // ImageUpload component has already uploaded the file
    // Just store the URL
    setFormData(prev => ({
      ...prev,
      imageUrl: image.url
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create product
      const result = await createProduct({
        title: formData.title,
        description: formData.description,
        price: formData.price,
        vendor_id: currentVendor.id
      });

      if (!result.success) throw new Error(result.error);

      // Update with image if provided
      if (formData.imageUrl) {
        await updateProductImage(result.product.id, formData.imageUrl);
      }

      // Redirect to product page
      navigate(`/vendor/products/${result.product.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label>Product Title *</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
        />
      </div>

      <div>
        <label>Description *</label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
        />
      </div>

      <div>
        <label>Price *</label>
        <input
          type="number"
          required
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
        />
      </div>

      <ImageUpload
        onImageSelect={handleImageSelect}
        onError={(err) => setError(err)}
        bucket="product-images"
        label="Product Image *"
        description="Upload a clear product image (JPG, PNG, or WebP)"
        maxSize={10 * 1024 * 1024} // 10MB
      />

      {formData.imageUrl && (
        <div className="border rounded p-4">
          <p className="text-sm text-gray-600 mb-2">Preview</p>
          <img 
            src={formData.imageUrl} 
            alt="Preview" 
            className="max-w-xs h-auto rounded"
          />
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Product'}
      </button>
    </form>
  );
}
```

### 2. Product Edit with Image Update

```javascript
// src/pages/vendor/ProductEdit.jsx
import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/image/ImageUpload';
import { updateProductImage, isProductImageComplete } from '@/api/productImageApi';
import { getProduct, updateProduct } from '@/api/productApi';

export default function ProductEdit({ productId }) {
  const [product, setProduct] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      const result = await getProduct(productId);
      setProduct(result);
      setFormData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = async (image) => {
    try {
      await updateProductImage(productId, image.url);
      setProduct(prev => ({
        ...prev,
        image_url: image.url
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateProduct(productId, {
        title: formData.title,
        description: formData.description,
        price: formData.price
      });

      // Check if image is now complete
      const isComplete = await isProductImageComplete(productId);
      if (!isComplete) {
        setError('Note: Product still lacks an image. Add one for better visibility.');
      }

      // Refresh product
      await loadProduct();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label>Product Title *</label>
        <input
          type="text"
          required
          value={formData.title || ''}
          onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
        />
      </div>

      <div>
        <label>Description *</label>
        <textarea
          required
          value={formData.description || ''}
          onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
        />
      </div>

      <div>
        <label>Price *</label>
        <input
          type="number"
          required
          step="0.01"
          value={formData.price || ''}
          onChange={(e) => setFormData(prev => ({...prev, price: e.target.value}))}
        />
      </div>

      {product?.image_url && (
        <div className="border rounded p-4 bg-gray-50">
          <p className="text-sm font-medium mb-2">Current Image</p>
          <img 
            src={product.image_url} 
            alt={product.title} 
            className="max-w-xs h-auto rounded"
          />
        </div>
      )}

      <ImageUpload
        onImageSelect={handleImageSelect}
        onError={(err) => setError(err)}
        bucket="product-images"
        label="Update Product Image"
        description="Replace with a new image"
        isOptional={true}
      />

      {error && <div className="error-message">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
```

### 3. Variant Management with Image Inheritance

```javascript
// src/components/ProductVariants.jsx
import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/image/ImageUpload';
import { 
  getProductVariantsWithImages,
  updateVariantImage,
  flagVariantForImageAssistance
} from '@/api/productImageApi';

export default function ProductVariants({ productId, vendorId }) {
  const [data, setData] = useState({ product: null, variants: [] });
  const [loading, setLoading] = useState(true);
  const [expandedVariant, setExpandedVariant] = useState(null);

  useEffect(() => {
    loadVariants();
  }, [productId]);

  const loadVariants = async () => {
    try {
      const result = await getProductVariantsWithImages(productId);
      setData(result);
    } catch (err) {
      console.error('Error loading variants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantImageSelect = async (variantId, image) => {
    try {
      await updateVariantImage(variantId, image.url);
      
      // Flag for admin assistance if needed
      const variant = data.variants.find(v => v.id === variantId);
      if (variant.needs_image_flag) {
        await flagVariantForImageAssistance(variantId, productId, vendorId);
      }

      // Refresh variants
      await loadVariants();
    } catch (err) {
      console.error('Error updating variant image:', err);
    }
  };

  if (loading) return <div>Loading variants...</div>;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Product Variants</h3>

      {!data.product?.image_url && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ Product has no main image. Variants will display placeholder image.
          </p>
        </div>
      )}

      {data.variants.map(variant => (
        <div 
          key={variant.id}
          className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
          onClick={() => setExpandedVariant(
            expandedVariant === variant.id ? null : variant.id
          )}
        >
          <div className="flex items-start gap-4">
            {/* Image */}
            <div className="flex-shrink-0">
              <img
                src={variant.image_url}
                alt={variant.title}
                className="w-20 h-20 rounded object-cover"
              />
              {!variant.has_own_image && (
                <div className="text-xs text-gray-500 mt-1 text-center">
                  Product image
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h4 className="font-medium">{variant.title}</h4>
              <p className="text-sm text-gray-600">
                {variant.attributes?.join(', ')}
              </p>
              
              {!variant.has_own_image && (
                <div className="mt-2 inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  Using main image
                </div>
              )}
            </div>

            <div className="flex-shrink-0 text-gray-400">
              {expandedVariant === variant.id ? '▼' : '▶'}
            </div>
          </div>

          {/* Expanded section */}
          {expandedVariant === variant.id && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {!variant.has_own_image && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <p className="font-medium text-blue-900">💡 Add Variant Image</p>
                  <p className="text-blue-800 mt-1">
                    This variant is using the main product image. 
                    Upload a variant-specific image for better presentation.
                  </p>
                </div>
              )}

              <ImageUpload
                onImageSelect={(image) => handleVariantImageSelect(variant.id, image)}
                bucket="product-images"
                label={variant.has_own_image ? "Replace Variant Image" : "Add Variant Image"}
                description="Upload a clear image of this variant"
                isOptional={true}
              />
            </div>
          )}
        </div>
      ))}

      {data.variants.length === 0 && (
        <p className="text-gray-500 text-center py-8">
          No variants for this product
        </p>
      )}
    </div>
  );
}
```

### 4. Admin Dashboard - Missing Images

```javascript
// src/pages/admin/ImageManagement.jsx
import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/image/ImageUpload';
import { 
  getVariantsNeedingImages,
  updateVariantImage,
  getVendorImageWarnings
} from '@/api/productImageApi';

export default function AdminImageManagement() {
  const [variants, setVariants] = useState([]);
  const [warnings, setWarnings] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVariantsNeedingImages();
  }, []);

  const loadVariantsNeedingImages = async () => {
    setLoading(true);
    try {
      const needing = await getVariantsNeedingImages(100);
      setVariants(needing);
    } finally {
      setLoading(false);
    }
  };

  const loadVendorWarnings = async (vendorId) => {
    setSelectedVendor(vendorId);
    setLoading(true);
    try {
      const w = await getVendorImageWarnings(vendorId);
      setWarnings(w);
    } finally {
      setLoading(false);
    }
  };

  const handleVariantImageSelect = async (variantId, image) => {
    try {
      await updateVariantImage(variantId, image.url);
      
      // Refresh lists
      await loadVariantsNeedingImages();
      if (selectedVendor) {
        await loadVendorWarnings(selectedVendor);
      }
    } catch (err) {
      console.error('Error updating image:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Image Management</h2>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded p-4">
            <p className="text-sm text-gray-600">Variants Needing Images</p>
            <p className="text-3xl font-bold text-blue-600">{variants.length}</p>
          </div>
          {warnings && (
            <div className="bg-yellow-50 rounded p-4">
              <p className="text-sm text-gray-600">Total Missing Images</p>
              <p className="text-3xl font-bold text-yellow-600">{warnings.totalWarnings}</p>
            </div>
          )}
        </div>

        <button 
          onClick={loadVariantsNeedingImages}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh List'}
        </button>
      </div>

      {/* Variants needing images */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Variants Needing Images</h3>
        
        <div className="space-y-4">
          {variants.map(variant => (
            <div key={variant.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-medium">{variant.title}</h4>
                  <p className="text-sm text-gray-600">
                    Product: {variant.products?.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    Vendor: {variant.products?.vendors?.business_name}
                  </p>
                </div>
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                  No Image
                </span>
              </div>

              <ImageUpload
                onImageSelect={(image) => handleVariantImageSelect(variant.id, image)}
                bucket="product-images"
                label="Upload Image"
                description="Add image for this variant"
                isOptional={false}
              />
            </div>
          ))}
        </div>

        {variants.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            ✓ All variants have images!
          </p>
        )}
      </div>

      {/* Vendor-specific warnings */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Vendor-Specific Warnings</h3>
        
        <div className="bg-gray-50 rounded p-4">
          <label className="block text-sm font-medium mb-2">Select Vendor</label>
          <select 
            onChange={(e) => loadVendorWarnings(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="">-- Choose a vendor --</option>
            {/* Populate with vendors */}
          </select>
        </div>

        {warnings && (
          <div className="mt-4 space-y-6">
            {/* Products without images */}
            {warnings.productsWithoutImages.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">
                  Products Without Images ({warnings.productsWithoutImages.length})
                </h4>
                <div className="space-y-2">
                  {warnings.productsWithoutImages.map(product => (
                    <div key={product.id} className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                      {product.title}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Variants without images */}
            {warnings.variantsWithoutImages.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">
                  Variants Without Images ({warnings.variantsWithoutImages.length})
                </h4>
                <div className="space-y-2">
                  {warnings.variantsWithoutImages.map(variant => (
                    <div key={variant.id} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm font-medium">{variant.title}</p>
                      <p className="text-xs text-gray-600">
                        {variant.products?.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5. Product Display with Variant Images

```javascript
// src/components/ProductCard.jsx
import { useState, useEffect } from 'react';
import { getProductVariantsWithImages } from '@/api/productImageApi';

export default function ProductCard({ product }) {
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    loadVariants();
  }, [product.id]);

  const loadVariants = async () => {
    const { variants } = await getProductVariantsWithImages(product.id);
    setVariants(variants);
    if (variants.length > 0) {
      setSelectedVariant(variants[0]);
    }
  };

  const variantImage = selectedVariant?.image_url || product.image_url;

  return (
    <div className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition">
      {/* Image */}
      <div className="bg-gray-200 aspect-square overflow-hidden relative">
        <img 
          src={variantImage} 
          alt={product.title}
          className="w-full h-full object-cover"
        />
        {selectedVariant && !selectedVariant.has_own_image && (
          <div className="absolute bottom-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            Product image
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold truncate">{product.title}</h3>
        <p className="text-lg font-semibold mt-1">${product.price}</p>

        {/* Variant selector */}
        {variants.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-2">Variants:</p>
            <div className="flex flex-wrap gap-2">
              {variants.map(variant => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`text-xs px-2 py-1 rounded border ${
                    selectedVariant?.id === variant.id
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {variant.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="w-full mt-4 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
          View Details
        </button>
      </div>
    </div>
  );
}
```

## Key Integration Points

1. **Product Creation**: Collect image URL from ImageUpload, store after product created
2. **Product Edit**: Show current image, allow replacement via ImageUpload
3. **Variant Display**: Show effective image (variant → product → placeholder)
4. **Variant Upload**: Only if variant lacks image (inherits from product)
5. **Admin Dashboard**: List variants without images, bulk upload capability
6. **Product Card**: Display variant-specific images with indicator

## Usage Tips

✅ Always use `getProductVariantsWithImages()` for variant display - handles image inheritance
✅ Call `flagVariantForImageAssistance()` when variant gets image to clear notification
✅ Use placeholder images in ImageUpload component with `showPlaceholder={true}`
✅ Admin should review `getVariantsNeedingImages()` weekly to maintain image quality
✅ Vendors can see warnings via `getVendorImageWarnings()` in their dashboard

See `IMAGE_MANAGEMENT_IMPLEMENTATION_GUIDE.md` for complete documentation.

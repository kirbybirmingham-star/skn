/**
 * Product utility functions with defensive programming
 * Ensures product data is safely extracted and validated
 */

export const PLACEHOLDER_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23eef2ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23728bd6' font-family='Arial,Helvetica,sans-serif' font-size='20'>No Image</text></svg>";

const PLACEHOLDER_IMAGE_INTERNAL = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='100%' height='100%' fill='%23eef2ff'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23728bd6' font-family='Arial,Helvetica,sans-serif' font-size='20'>No Image</text></svg>";

/**
 * Validates and normalizes product data
 * @param {Object} product - Raw product object from API
 * @returns {Object} Validated product with safe defaults
 */
export function normalizeProduct(product) {
  if (!product || typeof product !== 'object') {
    console.warn('❌ Invalid product object:', product);
    return null;
  }

  // DEBUG: Log the actual keys and values
  const keys = Object.keys(product);
  const values = {};
  keys.forEach(k => {
    values[k] = typeof product[k];
  });
  
  if (product.id === '3312ef7a-ec88-449a-a352-d4fafa5f28d0') {
    console.log('🔧 normalizeProduct called with:', {
      id: product.id,
      keys: keys,
      types: values,
      rawValues: {
        title: product.title,
        base_price: product.base_price,
        currency: product.currency,
        image_url: product.image_url,
        description: product.description
      }
    });
  }

  return {
    id: product.id || null,
    title: String(product.title || '').trim() || 'Untitled',
    slug: String(product.slug || '').trim() || 'unknown',
    description: String(product.description || '').trim(),
    ribbon_text: String(product.ribbon_text || '').trim(),
    base_price: Number(product.base_price) || 0,
    currency: String(product.currency || 'USD').toUpperCase(),
    image_url: String(product.image_url || '').trim() || null,
    gallery_images: Array.isArray(product.gallery_images) ? product.gallery_images : [],
    is_published: Boolean(product.is_published),
    vendor_id: product.vendor_id || null,
    product_variants: Array.isArray(product.product_variants) ? product.product_variants : [],
    product_ratings: Array.isArray(product.product_ratings) ? product.product_ratings : [],
    // Legacy support
    images: Array.isArray(product.images) ? product.images : [],
  };
}

/**
 * Gets the best available image URL for a product
 * Priority chain: main image → variant images → gallery → placeholder
 * @param {Object} product - Normalized product object
 * @returns {string} Image URL or placeholder
 */
export function getProductImageUrl(product) {
  if (!product) return PLACEHOLDER_IMAGE;

  // Priority 1: Main product image
  if (product.image_url) {
    return product.image_url;
  }

  // Priority 2: First variant image
  if (Array.isArray(product.product_variants) && product.product_variants.length > 0) {
    const variant = product.product_variants[0];
    if (variant?.image_url) return variant.image_url;
    if (Array.isArray(variant?.images) && variant.images.length > 0) {
      return variant.images[0];
    }
  }

  // Priority 3: Gallery images
  if (Array.isArray(product.gallery_images) && product.gallery_images.length > 0) {
    return product.gallery_images[0];
  }

  // Priority 4: Legacy images array
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images[0];
  }

  // Fallback to placeholder
  return PLACEHOLDER_IMAGE_INTERNAL;
}

/**
 * Formats a price in cents to currency string
 * @param {number} amountInCents - Price in cents (always cents from database)
 * @param {string} currency - ISO 4217 currency code
 * @returns {string} Formatted price or null if invalid
 */
export function formatProductPrice(amountInCents, currency = 'USD') {
  // Validate input
  if (amountInCents === null || amountInCents === undefined) {
    return null;
  }

  const amount = Number(amountInCents);
  if (isNaN(amount)) {
    console.warn('❌ Invalid price:', amountInCents);
    return null;
  }

  // Always assume the input is in cents (from database) and convert to dollars
  const dollarAmount = amount / 100;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(currency).toUpperCase()
    }).format(dollarAmount);
  } catch (err) {
    console.warn('❌ Currency format error:', err.message);
    // Fallback to manual formatting
    return `${currency} ${dollarAmount.toFixed(2)}`;
  }
}

/**
 * Gets the display price for a product
 * Prefers variant price if available, falls back to base price
 * @param {Object} product - Normalized product object
 * @returns {Object} {amount: number, formatted: string}
 */
export function getProductPrice(product) {
  if (!product) return { amount: 0, formatted: '$0.00' };

  // Check for variant price first
  if (Array.isArray(product.product_variants) && product.product_variants.length > 0) {
    const variant = product.product_variants[0];
    const variantPrice = variant?.price_in_cents ?? variant?.price ?? variant?.price_cents;

    if (variantPrice != null && !isNaN(Number(variantPrice))) {
      const amount = Number(variantPrice);
      const formatted = formatProductPrice(amount, product.currency);
      return {
        amount,
        formatted: formatted || '$0.00',
        source: 'variant'
      };
    }
  }

  // Fallback to base price
  if (product.base_price != null && !isNaN(Number(product.base_price))) {
    const amount = Number(product.base_price);
    const formatted = formatProductPrice(amount, product.currency);
    return {
      amount,
      formatted: formatted || '$0.00',
      source: 'base'
    };
  }

  return {
    amount: 0,
    formatted: '$0.00',
    source: 'default'
  };
}

/**
 * Gets product rating information
 * @param {Object} product - Normalized product object
 * @returns {Object|null} Rating data or null
 */
export function getProductRating(product) {
  if (!product || !Array.isArray(product.product_ratings) || product.product_ratings.length === 0) {
    return null;
  }
  return product.product_ratings[0];
}

/**
 * Validates a product has minimum required data for display
 * @param {Object} product - Product object
 * @returns {Object} Validation result
 */
export function validateProductForDisplay(product) {
  const errors = [];
  const warnings = [];

  if (!product) {
    errors.push('Product is null or undefined');
    return { valid: false, errors, warnings };
  }

  if (!product.id) {
    errors.push('Missing product ID');
  } else if (product.id === 'null' || product.id === null) {
    errors.push('Product ID is invalid');
  }

  if (!product.title || product.title === 'Untitled') {
    warnings.push('Product has no title');
  }

  if (product.base_price === 0 || product.base_price === null) {
    warnings.push('Product has no price');
  }

  if (!product.image_url) {
    warnings.push('Product has no primary image (will use placeholder)');
  }

  const hasValidId = product.id && product.id !== 'null' && product.id !== null;

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    isDisplayable: errors.length === 0 && hasValidId
  };
}

/**
 * Gets all available images for a product (used for gallery)
 * @param {Object} product - Normalized product object
 * @returns {Array} Array of image URLs
 */
export function getAllProductImages(product) {
  const images = [];

  if (product?.image_url) {
    images.push(product.image_url);
  }

  if (Array.isArray(product?.gallery_images)) {
    images.push(...product.gallery_images);
  }

  if (Array.isArray(product?.images)) {
    images.push(...product.images);
  }

  // Add variant images
  if (Array.isArray(product?.product_variants)) {
    product.product_variants.forEach(variant => {
      if (variant?.image_url) images.push(variant.image_url);
      if (Array.isArray(variant?.images)) images.push(...variant.images);
    });
  }

  // Remove duplicates
  return [...new Set(images)].filter(img => img && typeof img === 'string');
}

export default {
  normalizeProduct,
  getProductImageUrl,
  formatProductPrice,
  getProductPrice,
  getProductRating,
  validateProductForDisplay,
  getAllProductImages,
  PLACEHOLDER_IMAGE
};

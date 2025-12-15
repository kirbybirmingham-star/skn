/**
 * Placeholder Image Resolver
 * 
 * Provides fallback placeholder images for products missing images.
 * Supports multiple placeholder services:
 * - DiceBear (generates avatars with product info)
 * - Placeholder.com
 * - UI Avatars (colored backgrounds based on product name)
 */

/**
 * Generate placeholder image URL using DiceBear API
 * Creates a unique avatar based on product slug
 */
export function getDiceBearPlaceholder(productSlug, options = {}) {
  const {
    size = 400,
    style = 'bottts', // avataaars, bottts, lorelei, etc.
    backgroundColor = 'random'
  } = options;

  const url = new URL('https://api.dicebear.com/7.x/avataaars/svg');
  url.searchParams.set('seed', productSlug);
  url.searchParams.set('size', size);
  if (backgroundColor !== 'random') {
    url.searchParams.set('backgroundColor', backgroundColor);
  }

  return url.toString();
}

/**
 * Generate placeholder using UI Avatars with colored background
 * Shows product initial with colored background
 */
export function getUIAvatarPlaceholder(productTitle, options = {}) {
  const {
    size = 400,
    fontSize = 0.3,
    bold = true
  } = options;

  const initials = productTitle
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  const url = new URL('https://ui-avatars.com/api/');
  url.searchParams.set('name', initials);
  url.searchParams.set('size', size);
  url.searchParams.set('font-size', fontSize);
  url.searchParams.set('bold', bold);
  url.searchParams.set('background', 'random');
  url.searchParams.set('color', 'fff');

  return url.toString();
}

/**
 * Generate placeholder using placeholder.com
 */
export function getPlaceholderCom(width = 400, height = 300, options = {}) {
  const { text = 'No Image', bgColor = '999', textColor = 'fff' } = options;

  return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
}

/**
 * Generate a colorful gradient placeholder based on product name
 * Uses hash of product name to generate consistent colors
 */
export function getGradientPlaceholder(productSlug, width = 400, height = 300) {
  // Generate colors based on product slug hash
  const hash = [...productSlug].reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);

  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 60) % 360;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:hsl(${hue1},70%,50%);stop-opacity:1" />
          <stop offset="100%" style="stop-color:hsl(${hue2},70%,60%);stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#grad)"/>
      <text x="50%" y="50%" font-size="48" font-weight="bold" fill="white" 
            text-anchor="middle" dy="0.3em" font-family="Arial">📦</text>
    </svg>
  `;

  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return dataUrl;
}

/**
 * Get placeholder image with fallback chain
 * Tries multiple services in order of preference
 */
export function getPlaceholderImage(productSlug, productTitle, options = {}) {
  const {
    service = 'dicebear', // 'dicebear', 'uiavatar', 'placeholder', 'gradient'
    size = 400,
    fallback = true
  } = options;

  try {
    switch (service.toLowerCase()) {
      case 'dicebear':
        return getDiceBearPlaceholder(productSlug, { size });

      case 'uiavatar':
        return getUIAvatarPlaceholder(productTitle || productSlug, { size });

      case 'placeholder':
        return getPlaceholderCom(size, Math.floor(size * 0.75));

      case 'gradient':
        return getGradientPlaceholder(productSlug, size, Math.floor(size * 0.75));

      default:
        return getDiceBearPlaceholder(productSlug, { size });
    }
  } catch (error) {
    console.warn(`Error generating ${service} placeholder:`, error.message);

    // Fallback to gradient (doesn't require network)
    if (fallback && service !== 'gradient') {
      return getGradientPlaceholder(productSlug, size, Math.floor(size * 0.75));
    }

    throw error;
  }
}

export default {
  getDiceBearPlaceholder,
  getUIAvatarPlaceholder,
  getPlaceholderCom,
  getGradientPlaceholder,
  getPlaceholderImage
};

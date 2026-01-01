/**
 * Image Upload Handler
 * Handles image uploads to Supabase buckets with UUID-based naming
 * Supports both URL links and file uploads
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabaseClient.js';
import { authenticateUser } from './middleware.js';

const router = express.Router();

// Available buckets
const BUCKETS = {
  products: 'product-images',
  vendors: 'vendor-images',
  avatars: 'user-avatars'
};

// Placeholder images
const PLACEHOLDERS = {
  product: 'https://via.placeholder.com/400x400?text=Product+Image',
  avatar: 'https://via.placeholder.com/150x150?text=User+Avatar',
  vendor: 'https://via.placeholder.com/600x200?text=Vendor+Logo'
};

/**
 * Generate unique image filename using UUID trim
 * @param {string} originalFilename - Original file name
 * @returns {string} UUID-based filename with extension
 */
function generateImageFilename(originalFilename = '') {
  const uuid = uuidv4();
  const ext = originalFilename ? originalFilename.split('.').pop() : 'jpg';
  // Use UUID without hyphens for shorter names, take first 16 chars
  return `img_${uuid.replace(/-/g, '').substring(0, 16)}.${ext}`;
}

/**
 * Upload image from URL
 * Validates URL and stores in specified bucket
 */
async function uploadFromUrl(imageUrl, bucket) {
  try {
    // Validate URL
    const urlObj = new URL(imageUrl);
    if (!['http', 'https'].includes(urlObj.protocol.replace(':', ''))) {
      throw new Error('Invalid URL protocol');
    }

    // Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL does not point to a valid image');
    }

    const buffer = await response.arrayBuffer();

    // Generate filename with extension from content type
    const ext = contentType.split('/')[1].split('+')[0] || 'jpg';
    const filename = generateImageFilename(`image.${ext}`);

    // Upload to bucket
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    return {
      success: true,
      filename: filename,
      url: publicUrl.publicUrl,
      bucket: bucket
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * POST /api/images/upload
 * Upload image from file (multipart form data)
 * Body: { bucket: 'products|vendors|avatars' }
 * File: form field 'image'
 */
router.post('/upload', authenticateUser, async (req, res) => {
  try {
    const { bucket = 'products' } = req.body;

    // Validate bucket
    if (!BUCKETS[bucket]) {
      return res.status(400).json({
        error: 'Invalid bucket. Must be one of: ' + Object.keys(BUCKETS).join(', ')
      });
    }

    // Get file from request
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const file = req.files.image;
    const fileSize = file.size;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (fileSize > maxSize) {
      return res.status(400).json({
        error: `File too large. Maximum size is 10MB, got ${(fileSize / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type. Allowed types: JPEG, PNG, WebP, GIF'
      });
    }

    // Generate filename
    const filename = generateImageFilename(file.name);

    // Upload to bucket
    const { data, error } = await supabase.storage
      .from(BUCKETS[bucket])
      .upload(filename, file.data, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return res.status(500).json({
        error: 'Failed to upload image: ' + error.message
      });
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from(BUCKETS[bucket])
      .getPublicUrl(filename);

    return res.json({
      success: true,
      filename: filename,
      url: publicUrl.publicUrl,
      bucket: bucket,
      size: fileSize,
      type: file.mimetype
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: 'Upload failed: ' + error.message
    });
  }
});

/**
 * POST /api/images/upload-from-url
 * Upload image from URL
 * Body: { url: 'https://...', bucket: 'products|vendors|avatars' }
 */
router.post('/upload-from-url', authenticateUser, async (req, res) => {
  try {
    const { url, bucket = 'products' } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!BUCKETS[bucket]) {
      return res.status(400).json({
        error: 'Invalid bucket. Must be one of: ' + Object.keys(BUCKETS).join(', ')
      });
    }

    const result = await uploadFromUrl(url, BUCKETS[bucket]);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result);
  } catch (error) {
    console.error('URL upload error:', error);
    return res.status(500).json({
      error: 'URL upload failed: ' + error.message
    });
  }
});

/**
 * POST /api/images/validate-url
 * Validate URL without uploading
 * Body: { url: 'https://...' }
 */
router.post('/validate-url', authenticateUser, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const urlObj = new URL(url);
    if (!['http', 'https'].includes(urlObj.protocol.replace(':', ''))) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    const response = await fetch(url, { method: 'HEAD' });
    if (!response.ok) {
      return res.status(400).json({
        error: `Failed to access URL: ${response.statusText}`
      });
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({
        error: 'URL does not point to a valid image'
      });
    }

    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength) : null;

    return res.json({
      valid: true,
      url: url,
      contentType: contentType,
      size: size,
      sizeReadable: size ? `${(size / 1024 / 1024).toFixed(2)}MB` : 'Unknown'
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message
    });
  }
});

/**
 * DELETE /api/images/:bucket/:filename
 * Delete image from bucket
 */
router.delete('/:bucket/:filename', authenticateUser, async (req, res) => {
  try {
    const { bucket, filename } = req.params;

    if (!BUCKETS[bucket]) {
      return res.status(400).json({
        error: 'Invalid bucket'
      });
    }

    // Security: Only allow deleting own uploads
    // In production, verify ownership via database

    const { error } = await supabase.storage
      .from(BUCKETS[bucket])
      .remove([filename]);

    if (error) {
      return res.status(400).json({
        error: 'Failed to delete image: ' + error.message
      });
    }

    return res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Delete failed: ' + error.message
    });
  }
});

/**
 * GET /api/images/placeholders
 * Get placeholder image URLs
 */
router.get('/placeholders', (req, res) => {
  return res.json({
    product: PLACEHOLDERS.product,
    avatar: PLACEHOLDERS.avatar,
    vendor: PLACEHOLDERS.vendor
  });
});

/**
 * GET /api/images/placeholder/:type
 * Get specific placeholder
 */
router.get('/placeholder/:type', (req, res) => {
  const { type } = req.params;
  const placeholder = PLACEHOLDERS[type] || PLACEHOLDERS.product;

  return res.json({
    type: type,
    url: placeholder
  });
});

export default router;

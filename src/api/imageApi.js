/**
 * Image API Operations
 * Frontend API layer for image upload and management
 */

const API_BASE = '/api/images';

/**
 * Get placeholder images
 */
export async function getPlaceholders() {
  try {
    const response = await fetch(`${API_BASE}/placeholders`);
    if (!response.ok) throw new Error('Failed to get placeholders');
    return await response.json();
  } catch (error) {
    console.error('Error getting placeholders:', error);
    return {
      product: 'https://via.placeholder.com/400x400?text=Product+Image',
      avatar: 'https://via.placeholder.com/150x150?text=User+Avatar',
      vendor: 'https://via.placeholder.com/600x200?text=Vendor+Logo'
    };
  }
}

/**
 * Get specific placeholder
 */
export async function getPlaceholder(type = 'product') {
  try {
    const response = await fetch(`${API_BASE}/placeholder/${type}`);
    if (!response.ok) throw new Error('Failed to get placeholder');
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting placeholder:', error);
    return 'https://via.placeholder.com/400x400?text=Product+Image';
  }
}

/**
 * Upload image from file
 * @param {File} file - Image file
 * @param {string} bucket - Bucket name (products, vendors, avatars)
 * @returns {Promise<Object>} Upload result with URL
 */
export async function uploadImageFile(file, bucket = 'products') {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('bucket', bucket);

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return {
      success: true,
      filename: data.filename,
      url: data.url,
      bucket: data.bucket
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Upload image from URL
 * @param {string} imageUrl - Image URL
 * @param {string} bucket - Bucket name (products, vendors, avatars)
 * @returns {Promise<Object>} Upload result with URL
 */
export async function uploadImageFromUrl(imageUrl, bucket = 'products') {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/upload-from-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        url: imageUrl,
        bucket: bucket
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return {
      success: true,
      filename: data.filename,
      url: data.url,
      bucket: data.bucket
    };
  } catch (error) {
    console.error('Error uploading image from URL:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Validate image URL
 * @param {string} imageUrl - Image URL to validate
 * @returns {Promise<Object>} Validation result
 */
export async function validateImageUrl(imageUrl) {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/validate-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ url: imageUrl })
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        valid: false,
        error: data.error || 'Invalid URL'
      };
    }

    return {
      valid: true,
      url: data.url,
      contentType: data.contentType,
      size: data.size,
      sizeReadable: data.sizeReadable
    };
  } catch (error) {
    console.error('Error validating URL:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Delete image from bucket
 * @param {string} bucket - Bucket name
 * @param {string} filename - Filename to delete
 * @returns {Promise<Object>} Delete result
 */
export async function deleteImage(bucket, filename) {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`${API_BASE}/${bucket}/${filename}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Delete failed');
    }

    return {
      success: true,
      message: 'Image deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting image:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  getPlaceholders,
  getPlaceholder,
  uploadImageFile,
  uploadImageFromUrl,
  validateImageUrl,
  deleteImage
};

import express from 'express';
import multer from 'multer';
import { supabase } from './supabaseClient.js';

const router = express.Router();

// Configure multer for image uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get products for a vendor
router.get('/vendor/:vendorId', async (req, res) => {
  const { vendorId } = req.params;
  const { page = 1, perPage = 20, search, category } = req.query;

  if (!vendorId) {
    return res.status(400).json({ error: 'Vendor ID is required' });
  }

  try {
    const offset = (parseInt(page) - 1) * parseInt(perPage);

    let query = supabase
      .from('products')
      .select(`
        *,
        product_variants (*)
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(perPage) - 1);

    // Add search filter
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    // Add category filter
    if (category) {
      query = query.ilike('category', `%${category}%`);
    }

    const { data: products, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId);

    res.json({
      products: products || [],
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / parseInt(perPage))
      }
    });
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new product
router.post('/vendor/:vendorId', async (req, res) => {
  const { vendorId } = req.params;
  const { title, description, category, image_url, variants } = req.body;

  if (!vendorId) {
    return res.status(400).json({ error: 'Vendor ID is required' });
  }

  if (!title || title.trim().length < 3) {
    return res.status(400).json({ error: 'Title must be at least 3 characters' });
  }

  try {
    // Create the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        vendor_id: vendorId,
        title: title.trim(),
        description: description?.trim() || '',
        category: category?.trim() || 'Uncategorized',
        image_url: image_url?.trim() || null,
        is_published: true
      })
      .select()
      .single();

    if (productError) {
      throw productError;
    }

    // Create product variants if provided
    let createdVariants = [];
    if (variants && variants.length > 0) {
      const variantsToInsert = variants.map((variant, index) => ({
        product_id: product.id,
        title: variant.title || `Variant ${index + 1}`,
        sku: variant.sku || `${title.replace(/\s+/g, '-').toUpperCase()}-${index + 1}`,
        price_in_cents: parseInt(variant.price_in_cents) || 0,
        inventory_quantity: parseInt(variant.inventory_quantity) || 0,
        is_active: true,
        attributes: variant.attributes || {}
      }));

      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert)
        .select();

      if (variantsError) {
        throw variantsError;
      }

      createdVariants = variantsData || [];
    } else {
      // Create default variant
      const { data: defaultVariant, error: defaultVariantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: product.id,
          title: 'Default',
          sku: `${title.replace(/\s+/g, '-').toUpperCase()}-DEFAULT`,
          price_in_cents: 0,
          inventory_quantity: 0,
          is_active: true,
          attributes: {}
        })
        .select()
        .single();

      if (defaultVariantError) {
        throw defaultVariantError;
      }

      createdVariants = [defaultVariant];
    }

    res.status(201).json({
      product: { ...product, variants: createdVariants }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a product
router.put('/:productId', async (req, res) => {
  const { productId } = req.params;
  const { title, description, category, image_url, variants } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  if (!title || title.trim().length < 3) {
    return res.status(400).json({ error: 'Title must be at least 3 characters' });
  }

  try {
    // Update the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .update({
        title: title.trim(),
        description: description?.trim() || '',
        category: category?.trim() || 'Uncategorized',
        image_url: image_url?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (productError) {
      throw productError;
    }

    // Update variants if provided
    if (variants && variants.length > 0) {
      // Delete existing variants
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId);

      // Insert new variants
      const variantsToInsert = variants.map((variant, index) => ({
        product_id: productId,
        title: variant.title || `Variant ${index + 1}`,
        sku: variant.sku || `${title.replace(/\s+/g, '-').toUpperCase()}-${index + 1}`,
        price_in_cents: parseInt(variant.price_in_cents) || 0,
        inventory_quantity: parseInt(variant.inventory_quantity) || 0,
        is_active: true,
        attributes: variant.attributes || {}
      }));

      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantsToInsert)
        .select();

      if (variantsError) {
        throw variantsError;
      }

      res.json({
        product: { ...product, variants: variantsData }
      });
    } else {
      // Get existing variants
      const { data: existingVariants } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId);

      res.json({
        product: { ...product, variants: existingVariants }
      });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a product
router.delete('/:productId', async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    // Delete product variants first (cascade should handle this, but let's be explicit)
    await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', productId);

    // Delete the product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      throw error;
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single product by ID
router.get('/:productId', async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants (*)
      `)
      .eq('id', productId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' });
      }
      throw error;
    }

    res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Upload product image after product is created/saved
 * POST /api/products/:productId/upload-image
 * Body: FormData with 'image' field containing the file
 */
router.post('/:productId/upload-image', upload.single('image'), async (req, res) => {
  const { productId } = req.params;
  
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const file = req.file;
    const fileExt = file.originalname?.split('.').pop() || 'jpg';
    const fileName = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const bucket = 'product-images';

    // Upload to Supabase storage using service role key (has proper permissions)
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    const imageUrl = publicData.publicUrl;

    // Update product with image URL
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    res.json({ 
      success: true, 
      imageUrl,
      product: updatedProduct 
    });
  } catch (error) {
    console.error('Error uploading product image:', error);
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
});

export default router;
import express from 'express';
import { supabase } from './supabaseClient.js';

const router = express.Router();

// Get inventory for a vendor
router.get('/vendor/:vendorId', async (req, res) => {
  const { vendorId } = req.params;
  const { page = 1, perPage = 50, search, lowStock = false } = req.query;

  if (!vendorId) {
    return res.status(400).json({ error: 'Vendor ID is required' });
  }

  try {
    const offset = (parseInt(page) - 1) * parseInt(perPage);

    // Get products for this vendor first
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        title,
        description,
        image_url,
        categories (
          name
        )
      `)
      .eq('vendor_id', vendorId)
      .eq('is_active', true);

    if (productsError) {
      throw productsError;
    }

    if (!products || products.length === 0) {
      return res.json({
        variants: [],
        alerts: [],
        pagination: {
          page: parseInt(page),
          perPage: parseInt(perPage),
          total: 0
        }
      });
    }

    const productIds = products.map(p => p.id);

    // Get variants for these products
    let variantsQuery = supabase
      .from('product_variants')
      .select(`
        id,
        product_id,
        price_in_cents,
        inventory_quantity,
        attributes,
        created_at,
        updated_at
      `)
      .in('product_id', productIds)
      .order('created_at', { ascending: false });

    // Add search filter if provided
    if (search) {
      // For now, just filter products by title
      const filteredProductIds = products
        .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
        .map(p => p.id);

      if (filteredProductIds.length === 0) {
        return res.json({
          variants: [],
          alerts: [],
          pagination: {
            page: parseInt(page),
            perPage: parseInt(perPage),
            total: 0
          }
        });
      }

      variantsQuery = variantsQuery.in('product_id', filteredProductIds);
    }

    // Filter for low stock if requested
    if (lowStock === 'true') {
      variantsQuery = variantsQuery.lte('inventory_quantity', 5);
    }

    const { data: variants, error: variantsError } = await variantsQuery
      .range(offset, offset + parseInt(perPage) - 1);

    if (variantsError) {
      throw variantsError;
    }

    // Combine product and variant data
    const variantsWithProducts = variants?.map(variant => {
      const product = products.find(p => p.id === variant.product_id);
      return {
        ...variant,
        product_title: product?.title || 'Unknown Product',
        product_category: product?.categories?.name || 'Uncategorized',
        product_image: product?.image_url
      };
    }) || [];

    // Get total count for pagination
    const { count } = await supabase
      .from('product_variants')
      .select('id', { count: 'exact', head: true })
      .in('product_id', productIds);

    res.json({
      variants: variantsWithProducts,
      alerts: [], // No alerts table yet
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory for a specific variant
router.get('/variant/:variantId', async (req, res) => {
  const { variantId } = req.params;

  if (!variantId) {
    return res.status(400).json({ error: 'Variant ID is required' });
  }

  try {
    const { data: variant, error } = await supabase
      .from('product_variants')
      .select(`
        id,
        product_id,
        sku,
        price_in_cents,
        compare_at,
        inventory_quantity,
        is_active,
        attributes,
        created_at,
        updated_at,
        products (
          id,
          title,
          slug,
          vendor_id,
          vendors (
            id,
            name
          )
        )
      `)
      .eq('id', variantId)
      .single();

    if (error) {
      throw error;
    }

    if (!variant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    // Get recent transactions
    const { data: transactions } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('variant_id', variantId)
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({
      variant,
      transactions: transactions || []
    });
  } catch (error) {
    console.error('Error fetching variant inventory:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update inventory quantity for a variant
router.patch('/variant/:variantId/quantity', async (req, res) => {
  const { variantId } = req.params;
  const { quantity, reason = 'Manual adjustment' } = req.body;

  if (!variantId) {
    return res.status(400).json({ error: 'Variant ID is required' });
  }

  if (typeof quantity !== 'number') {
    return res.status(400).json({ error: 'Quantity must be a number' });
  }

  try {
    // Get current variant
    const { data: currentVariant, error: fetchError } = await supabase
      .from('product_variants')
      .select('inventory_quantity, product_id')
      .eq('id', variantId)
      .single();

    if (fetchError || !currentVariant) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    const oldQuantity = currentVariant.inventory_quantity;
    const quantityChange = quantity - oldQuantity;

    // Update the quantity
    const { data: updatedVariant, error: updateError } = await supabase
      .from('product_variants')
      .update({ inventory_quantity: quantity, updated_at: new Date().toISOString() })
      .eq('id', variantId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log the transaction
    await supabase.rpc('log_inventory_transaction', {
      p_variant_id: variantId,
      p_transaction_type: 'adjustment',
      p_quantity_change: quantityChange,
      p_reason: reason,
      p_reference_type: 'manual'
    });

    // Create adjustment record
    await supabase
      .from('inventory_adjustments')
      .insert({
        variant_id: variantId,
        adjustment_type: 'set',
        quantity: quantity,
        previous_quantity: oldQuantity,
        new_quantity: quantity,
        reason,
        performed_by: req.user?.id // Assuming middleware sets req.user
      });

    res.json({
      variant: updatedVariant,
      old_quantity: oldQuantity,
      new_quantity: quantity,
      change: quantityChange
    });
  } catch (error) {
    console.error('Error updating inventory quantity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update inventory quantities
router.patch('/bulk-update', async (req, res) => {
  const { updates } = req.body; // Array of { variantId, quantity, reason? }

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'Updates array is required' });
  }

  try {
    const results = [];
    const errors = [];

    for (const update of updates) {
      const { variantId, quantity, reason = 'Bulk update' } = update;

      try {
        // Get current variant
        const { data: currentVariant, error: fetchError } = await supabase
          .from('product_variants')
          .select('inventory_quantity, product_id')
          .eq('id', variantId)
          .single();

        if (fetchError || !currentVariant) {
          errors.push({ variantId, error: 'Variant not found' });
          continue;
        }

        const oldQuantity = currentVariant.inventory_quantity;
        const quantityChange = quantity - oldQuantity;

        // Update the quantity
        const { data: updatedVariant, error: updateError } = await supabase
          .from('product_variants')
          .update({ inventory_quantity: quantity, updated_at: new Date().toISOString() })
          .eq('id', variantId)
          .select()
          .single();

        if (updateError) {
          errors.push({ variantId, error: updateError.message });
          continue;
        }

        // Log the transaction
        await supabase.rpc('log_inventory_transaction', {
          p_variant_id: variantId,
          p_transaction_type: 'adjustment',
          p_quantity_change: quantityChange,
          p_reason: reason,
          p_reference_type: 'manual'
        });

        // Create adjustment record
        await supabase
          .from('inventory_adjustments')
          .insert({
            variant_id: variantId,
            adjustment_type: 'set',
            quantity: quantity,
            previous_quantity: oldQuantity,
            new_quantity: quantity,
            reason,
            performed_by: req.user?.id
          });

        results.push({
          variantId,
          old_quantity: oldQuantity,
          new_quantity: quantity,
          change: quantityChange
        });
      } catch (err) {
        errors.push({ variantId, error: err.message });
      }
    }

    res.json({
      success: results,
      errors,
      total_processed: updates.length,
      success_count: results.length,
      error_count: errors.length
    });
  } catch (error) {
    console.error('Error in bulk inventory update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory transactions/history
router.get('/transactions/:variantId', async (req, res) => {
  const { variantId } = req.params;
  const { page = 1, perPage = 50, type, dateFrom, dateTo } = req.query;

  if (!variantId) {
    return res.status(400).json({ error: 'Variant ID is required' });
  }

  try {
    const offset = (parseInt(page) - 1) * parseInt(perPage);

    let query = supabase
      .from('inventory_transactions')
      .select('*')
      .eq('variant_id', variantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(perPage) - 1);

    // Add filters
    if (type) {
      query = query.eq('transaction_type', type);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      transactions: transactions || [],
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: count || 0
      }
    });
  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory alerts for a vendor
router.get('/alerts/:vendorId', async (req, res) => {
  const { vendorId } = req.params;
  const { active = true } = req.query;

  if (!vendorId) {
    return res.status(400).json({ error: 'Vendor ID is required' });
  }

  try {
    let query = supabase
      .from('inventory_alerts')
      .select(`
        *,
        product_variants (
          id,
          sku,
          inventory_quantity,
          products (
            id,
            title,
            slug
          )
        )
      `)
      .eq('product_variants.products.vendor_id', vendorId);

    if (active === 'true') {
      query = query.eq('is_active', true);
    }

    const { data: alerts, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ alerts: alerts || [] });
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update inventory settings for a vendor
router.put('/settings/:vendorId', async (req, res) => {
  const { vendorId } = req.params;
  const settings = req.body;

  if (!vendorId) {
    return res.status(400).json({ error: 'Vendor ID is required' });
  }

  try {
    const { data, error } = await supabase
      .from('inventory_settings')
      .upsert({
        vendor_id: vendorId,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({ settings: data });
  } catch (error) {
    console.error('Error updating inventory settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory settings for a vendor
router.get('/settings/:vendorId', async (req, res) => {
  const { vendorId } = req.params;

  if (!vendorId) {
    return res.status(400).json({ error: 'Vendor ID is required' });
  }

  try {
    const { data, error } = await supabase
      .from('inventory_settings')
      .select('*')
      .eq('vendor_id', vendorId)
      .single();

    if (error) {
      // If no settings found, return defaults
      if (error.code === 'PGRST116') {
        return res.json({
          settings: {
            vendor_id: vendorId,
            low_stock_threshold: 5,
            auto_create_alerts: true,
            track_inventory: true,
            allow_negative_stock: false,
            default_adjustment_reason: 'Manual adjustment'
          }
        });
      }
      throw error;
    }

    res.json({ settings: data });
  } catch (error) {
    console.error('Error fetching inventory settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
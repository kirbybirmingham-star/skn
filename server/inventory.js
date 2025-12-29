/**
 * Inventory API Endpoints
 * Handles inventory management for vendors and admins
 */

import express from 'express';
import { supabase } from './supabaseClient.js';
import { authenticateUser } from './middleware.js';

const router = express.Router();

// Middleware - Apply authentication to all routes
router.use(authenticateUser);

/**
 * GET /api/inventory
 * Get inventory for vendor's products
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('inventory')
      .select(`
        *,
        product: product_id (
          id,
          title,
          slug
        ),
        variant: variant_id (
          id,
          title,
          image
        )
      `)
      .eq('vendor_id', userId);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const offset = (page - 1) * limit;
    const { data: inventory, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      inventory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/inventory/:variantId
 * Get inventory for a specific variant
 */
router.get('/:variantId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId } = req.params;

    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('variant_id', variantId)
      .eq('vendor_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ message: 'Inventory not found' });
      }
      throw error;
    }

    res.json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/inventory
 * Create inventory record for a variant
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId, productId, availableQuantity, manageInventory, lowStockThreshold } = req.body;

    if (!variantId || !productId) {
      return res.status(400).json({ message: 'Variant ID and Product ID are required' });
    }

    // Check if inventory already exists
    const { data: existing } = await supabase
      .from('inventory')
      .select('id')
      .eq('variant_id', variantId)
      .eq('vendor_id', userId)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Inventory already exists for this variant' });
    }

    const { data: inventory, error } = await supabase
      .from('inventory')
      .insert({
        variant_id: variantId,
        product_id: productId,
        vendor_id: userId,
        available_quantity: availableQuantity || 0,
        manage_inventory: manageInventory !== false,
        low_stock_threshold: lowStockThreshold || 10
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Inventory already exists for this variant' });
      }
      throw error;
    }

    // Log the action
    await supabase.from('inventory_logs').insert({
      inventory_id: inventory.id,
      action: 'added',
      quantity_change: availableQuantity || 0,
      reason: 'Initial inventory',
      created_by: userId
    });

    res.json(inventory);
  } catch (error) {
    console.error('Error creating inventory:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * PATCH /api/inventory/:variantId
 * Update inventory quantity
 */
router.patch('/:variantId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId } = req.params;
    const { availableQuantity, action, reason } = req.body;

    if (availableQuantity === undefined || availableQuantity < 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    // Get current inventory
    const { data: inventory, error: fetchError } = await supabase
      .from('inventory')
      .select('*')
      .eq('variant_id', variantId)
      .eq('vendor_id', userId)
      .single();

    if (fetchError) {
      return res.status(404).json({ message: 'Inventory not found' });
    }

    const quantityChange = availableQuantity - inventory.available_quantity;

    // Update inventory
    const { data: updated, error: updateError } = await supabase
      .from('inventory')
      .update({
        available_quantity: availableQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', inventory.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log the action
    await supabase.from('inventory_logs').insert({
      inventory_id: inventory.id,
      action: action || 'adjusted',
      quantity_change: quantityChange,
      reason: reason || 'Inventory adjustment',
      created_by: userId
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/inventory/low-stock
 * Get low stock items
 */
router.get('/low-stock/items', async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: lowStock, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product: product_id (
          id,
          title
        ),
        variant: variant_id (
          id,
          title
        )
      `)
      .eq('vendor_id', userId)
      .lte('available_quantity', supabase.rpc('low_stock_threshold'))
      .order('available_quantity', { ascending: true });

    if (error) {
      throw error;
    }

    res.json(lowStock);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

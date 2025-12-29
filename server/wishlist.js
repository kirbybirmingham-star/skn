/**
 * Wishlist API Endpoints
 * Handles wishlist operations
 */

import express from 'express';
import { supabase } from './supabaseClient.js';
import { authenticateUser } from './middleware.js';

const router = express.Router();

// Middleware - Apply authentication to all routes
router.use(authenticateUser);

/**
 * GET /api/wishlist
 * Get user's wishlist
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: wishlist, error } = await supabase
      .from('wishlist')
      .select(`
        id,
        variant_id,
        product_id,
        created_at,
        product: product_id (
          id,
          title,
          image_url,
          slug
        ),
        variant: variant_id (
          id,
          title,
          price_in_cents,
          sale_price_in_cents,
          image
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * POST /api/wishlist
 * Add item to wishlist
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId } = req.body;

    if (!variantId) {
      return res.status(400).json({ message: 'Variant ID is required' });
    }

    // Get product ID from variant
    const { data: variant } = await supabase
      .from('product_variants')
      .select('product_id')
      .eq('id', variantId)
      .single();

    if (!variant) {
      return res.status(404).json({ message: 'Variant not found' });
    }

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('variant_id', variantId)
      .single();

    if (existing) {
      return res.status(400).json({ message: 'Item already in wishlist' });
    }

    // Add to wishlist
    const { data: item, error } = await supabase
      .from('wishlist')
      .insert({
        user_id: userId,
        variant_id: variantId,
        product_id: variant.product_id
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ message: 'Item already in wishlist' });
      }
      throw error;
    }

    res.json(item);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * DELETE /api/wishlist/:variantId
 * Remove item from wishlist
 */
router.delete('/:variantId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId } = req.params;

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('variant_id', variantId);

    if (error) {
      throw error;
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * GET /api/wishlist/:variantId/check
 * Check if item is in wishlist
 */
router.get('/:variantId/check', async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId } = req.params;

    const { data: item } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', userId)
      .eq('variant_id', variantId)
      .single();

    res.json({ inWishlist: !!item });
  } catch (error) {
    // Item not found - this is expected behavior
    res.json({ inWishlist: false });
  }
});

export default router;

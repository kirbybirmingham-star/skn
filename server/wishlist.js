import express from 'express';
import { supabase } from './supabaseClient.js';
import { verifyJWT } from './middleware.js';

const router = express.Router();

// Get user's wishlist
router.get('/me', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: wishlistItems, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        product_id,
        created_at,
        products (id, name, price, image_url, vendor_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ wishlist: wishlistItems || [] });
  } catch (err) {
    console.error('[Wishlist] Error fetching wishlist:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add product to wishlist
router.post('/add', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if already in wishlist
    const { data: existing } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }

    // Add to wishlist
    const { data, error } = await supabase
      .from('wishlists')
      .insert([{ user_id: userId, product_id: productId }])
      .select();

    if (error) throw error;

    res.json({ success: true, wishlistItem: data?.[0] });
  } catch (err) {
    console.error('[Wishlist] Error adding to wishlist:', err);
    res.status(500).json({ error: err.message });
  }
});

// Remove product from wishlist
router.delete('/:productId', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    console.error('[Wishlist] Error removing from wishlist:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check if product is in wishlist
router.get('/:productId', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json({ inWishlist: !!data });
  } catch (err) {
    console.error('[Wishlist] Error checking wishlist:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

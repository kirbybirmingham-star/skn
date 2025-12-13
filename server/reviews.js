import express from 'express';
import { supabase } from './supabaseClient.js';

const router = express.Router();

// Get all reviews for a product
router.get('/reviews/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    console.log('[Reviews API] Fetching reviews for productId:', productId);
    
    // Fetch from product_ratings table (which contains individual ratings/reviews)
    const { data, error } = await supabase
      .from('product_ratings')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Reviews API] Error fetching reviews:', error);
      throw error;
    }

    console.log('[Reviews API] Found reviews:', data?.length || 0);

    if (Array.isArray(data) && data.length > 0) {
      // Map product_ratings structure to expected review structure
      const reviews = data.map(r => ({
        id: r.id,
        product_id: r.product_id,
        user_id: r.user_id,
        rating: r.rating,
        title: r.comment || `${r.rating}-star review`,
        body: r.comment || '',
        created_at: r.created_at
      }));
      return res.json(reviews);
    }

    // If no reviews were found, attempt to resolve the param as a product slug
    // and query again using the resolved product id.
    const prodRes = await supabase.from('products').select('id').eq('slug', productId).maybeSingle();
    if (prodRes && prodRes.data && prodRes.data.id) {
      const resolvedId = prodRes.data.id;
      const { data: data2, error: error2 } = await supabase
        .from('product_ratings')
        .select('*')
        .eq('product_id', resolvedId)
        .order('created_at', { ascending: false });

      if (error2) throw error2;
      
      if (Array.isArray(data2) && data2.length > 0) {
        const reviews = data2.map(r => ({
          id: r.id,
          product_id: r.product_id,
          user_id: r.user_id,
          rating: r.rating,
          title: r.comment || `${r.rating}-star review`,
          body: r.comment || '',
          created_at: r.created_at
        }));
        return res.json(reviews);
      }
    }

    // Nothing found — return empty array to the client
    return res.json([]);
  } catch (error) {
    console.error('[Reviews API] Error:', error.message || error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new review
// Inserts into product_ratings table
router.post('/reviews', async (req, res) => {
  const { product_id, user_id, rating, title, body } = req.body;
  try {
    if (!product_id || !user_id || !rating) {
      return res.status(400).json({ error: 'Missing required fields: product_id, user_id, rating' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Combine title and body as comment (or use whichever is provided)
    const comment = body || title || '';

    const { data, error } = await supabase
      .from('product_ratings')
      .insert([{ 
        product_id, 
        user_id, 
        rating, 
        comment
      }])
      .select('*')
      .single();

    if (error) throw error;

    // Map the response to expected structure
    const review = {
      id: data.id,
      product_id: data.product_id,
      user_id: data.user_id,
      rating: data.rating,
      title: data.comment || `${data.rating}-star review`,
      body: data.comment || '',
      created_at: data.created_at
    };

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error.message || error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

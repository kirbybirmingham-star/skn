import express from 'express';
import { supabase } from './supabaseClient.js';

const router = express.Router();

// Get all reviews for a product
router.get('/reviews/:productId', async (req, res) => {
  const { productId } = req.params;
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, profiles!inner(id, full_name)')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform the data to match expected format
    const transformedData = data.map(review => ({
      ...review,
      user: {
        raw_user_meta_data: {
          full_name: review.profiles?.full_name || 'Anonymous'
        }
      }
    }));

    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new review
router.post('/reviews', async (req, res) => {
  const { product_id, user_id, rating, title, body } = req.body;
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert([{ product_id, user_id, rating, title, body }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { verifySupabaseJwt } from './middleware/supabaseAuth.js';

const router = express.Router();

// Lazy initialize Supabase on first request
let supabase = null;

function getSupabase() {
  if (supabase) return supabase;
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase not configured - missing URL or service role key');
    return null;
  }
  
  supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
}

// GET /api/vendor/:vendorId/orders - Get all orders for a vendor
router.get('/:vendorId/orders', verifySupabaseJwt, async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(503).json({ error: 'Server not configured' });

    const { vendorId } = req.params;
    const userId = req.user?.id;

    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    // Verify vendor ownership
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('owner_id')
      .eq('id', vendorId)
      .single();

    if (vendorError || !vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (vendor.owner_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized - not vendor owner' });
    }

    // Get all order_items for this vendor
    const { data: orderItems, error: ordersError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        product_id,
        variant_id,
        quantity,
        unit_price,
        total_price,
        metadata
      `)
      .eq('vendor_id', vendorId);

    if (ordersError) {
      console.error('Error fetching vendor orders:', ordersError);
      return res.status(500).json({ error: ordersError.message });
    }

    if (!orderItems || orderItems.length === 0) {
      return res.json([]);
    }

    // Get order details
    const orderIds = [...new Set(orderItems.map(item => item.order_id))];
    
    const { data: orders, error: ordersDataError } = await supabase
      .from('orders')
      .select('id, user_id, status, total_amount, created_at, metadata')
      .in('id', orderIds);

    if (ordersDataError) {
      console.error('Error fetching order details:', ordersDataError);
      return res.status(500).json({ error: ordersDataError.message });
    }

    const orderMap = {};
    orders?.forEach(order => {
      orderMap[order.id] = order;
    });

    // Enrich order items with order and user data
    // Note: We use payer_email from order metadata since auth.users may not be accessible
    const enrichedOrders = orderItems.map(item => {
      const order = orderMap[item.order_id];
      const userEmail = order?.metadata?.payer_email || 'Unknown';

      return {
        id: item.id,
        orderId: item.order_id,
        itemId: item.id,
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price,
        status: order?.status || 'unknown',
        createdAt: order?.created_at,
        userEmail: userEmail,
        userId: order?.user_id,
        metadata: item.metadata
      };
    });

    res.json(enrichedOrders);
  } catch (err) {
    console.error('Error fetching vendor orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/vendor/:vendorId - Update vendor information
router.put('/:vendorId', verifySupabaseJwt, async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(503).json({ error: 'Server not configured' });

    const { vendorId } = req.params;
    const { name, slug, description, website, contact_email } = req.body;
    const requesterId = req.user?.id;

    if (!vendorId) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    // Fetch the vendor to verify ownership
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('owner_id')
      .eq('id', vendorId)
      .single();

    if (fetchError) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    if (vendor.owner_id !== requesterId) {
      return res.status(403).json({ error: 'You are not authorized to edit this store' });
    }

    // Update the vendor
    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update({
        name,
        slug,
        description,
        website,
        metadata: { contact_email },
      })
      .eq('id', vendorId)
      .select();

    if (updateError) {
      return res.status(500).json({ error: updateError.message || 'Failed to update vendor' });
    }

    return res.json({ vendor: updatedVendor[0] });
  } catch (err) {
    console.error('Error updating vendor:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/vendor/products/:productId - Update product (uses service role to bypass RLS)
router.patch('/products/:productId', verifySupabaseJwt, async (req, res) => {
  try {
    console.log('📨 PATCH /products/:productId received');
    console.log('   Product ID:', req.params.productId);
    console.log('   User:', req.user?.id);
    console.log('   Body:', JSON.stringify(req.body).substring(0, 200));
    
    const supabase = getSupabase();
    if (!supabase) return res.status(503).json({ error: 'Server not configured' });

    const { productId } = req.params;
    const updates = req.body;
    const userId = req.user?.id;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Fetch product to verify vendor ownership
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      console.log('   ❌ Product not found:', fetchError?.message);
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('   Product vendor_id:', product.vendor_id);

    // Fetch vendor to verify user is owner
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('owner_id')
      .eq('id', product.vendor_id)
      .single();

    if (vendorError || !vendor) {
      console.log('   ❌ Vendor not found:', vendorError?.message);
      return res.status(404).json({ error: 'Vendor not found' });
    }

    console.log('   Vendor owner_id:', vendor.owner_id);
    console.log('   Auth user_id:', userId);

    if (vendor.owner_id !== userId) {
      console.log('   ❌ Authorization failed - not vendor owner');
      return res.status(403).json({ error: 'You are not authorized to edit this product' });
    }

    // Prepare updates object (map incoming field names to database schema)
    const dbUpdates = {};
    
    if (updates.title !== undefined && updates.title !== null) {
      dbUpdates.title = String(updates.title).trim();
    }
    if (updates.description !== undefined && updates.description !== null) {
      dbUpdates.description = String(updates.description).trim();
    }
    // Map price_in_cents to base_price
    if (updates.price_in_cents !== undefined && updates.price_in_cents !== null) {
      dbUpdates.base_price = Number(updates.price_in_cents);
    }
    if (updates.image !== undefined && updates.image !== null) {
      const imageUrl = String(updates.image).trim();
      if (imageUrl && imageUrl.length > 10) {
        dbUpdates.image_url = imageUrl;
      }
    }
    if (updates.category_id !== undefined && updates.category_id !== null) {
      dbUpdates.category_id = updates.category_id;
    }

    console.log('   💾 DB Updates to apply:', dbUpdates);

    // Update the product using service role (bypasses RLS)
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', productId)
      .select('*')
      .single();

    if (updateError) {
      console.error('   ❌ Product update error:', updateError);
      return res.status(500).json({ error: updateError.message || 'Failed to update product' });
    }

    console.log('   ✅ Product updated successfully');
    return res.json({ product: updatedProduct });
  } catch (err) {
    console.error('❌ Error updating product:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

export default router;

import express from 'express';
import { supabase } from './supabaseClient.js';
import { verifyJWT } from './middleware.js';

const router = express.Router();

// Get vendor orders with filtering and pagination
router.get('/orders', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = 50, sort_by = 'created_at', sort_order = 'desc' } = req.query;

    // Get vendor for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (vendorError || !vendor) {
      return res.status(403).json({ error: 'No vendor found for this user' });
    }

    // Get orders for this vendor with correct field names per database schema
    const { data: orderItems, error: ordersError } = await supabase
      .from('order_items')
      .select(`
        id,
        order_id,
        vendor_id,
        product_id,
        variant_id,
        quantity,
        unit_price,
        total_price,
        metadata,
        orders (
          id,
          status,
          created_at,
          total_amount,
          user_id,
          metadata
        )
      `)
      .eq('vendor_id', vendor.id)
      .order('created_at', { foreignTable: 'orders', ascending: sort_order === 'asc' })
      .limit(parseInt(limit));

    if (ordersError) throw ordersError;

    // Map response to expected format with correct field names
    const orders = (orderItems || []).map(item => ({
      id: item.id,
      orderId: item.order_id,
      itemId: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.total_price,
      status: item.orders?.status,
      createdAt: item.orders?.created_at,
      userEmail: item.orders?.metadata?.payer_email || item.orders?.metadata?.email,
      userId: item.orders?.user_id,
      metadata: item.metadata
    }));

    res.json({ orders });
  } catch (err) {
    console.error('[Vendor] Error fetching orders:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get specific vendor order
router.get('/orders/:orderId', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get vendor for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (vendorError || !vendor) {
      return res.status(403).json({ error: 'No vendor found for this user' });
    }

    // Get order items for this vendor and order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        products (id, name, image_url, price),
        orders (id, status, created_at, buyer_id, email, shipping_address, payment_method)
      `)
      .eq('vendor_id', vendor.id)
      .eq('order_id', orderId);

    if (itemsError) throw itemsError;

    if (!orderItems || orderItems.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: orderItems[0] });
  } catch (err) {
    console.error('[Vendor] Error fetching order:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fulfill vendor order
router.post('/orders/:orderId/fulfill', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    const { trackingNumber } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get vendor for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (vendorError || !vendor) {
      return res.status(403).json({ error: 'No vendor found for this user' });
    }

    // Check if vendor owns this order item
    const { data: orderItem, error: checkError } = await supabase
      .from('order_items')
      .select('id')
      .eq('vendor_id', vendor.id)
      .eq('order_id', orderId)
      .single();

    if (checkError || !orderItem) {
      return res.status(403).json({ error: 'You do not have permission to fulfill this order' });
    }

    // Update order item status
    const { error: updateError } = await supabase
      .from('order_items')
      .update({
        status: 'fulfilled',
        tracking_number: trackingNumber || null,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .eq('vendor_id', vendor.id);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'Order fulfilled' });
  } catch (err) {
    console.error('[Vendor] Error fulfilling order:', err);
    res.status(500).json({ error: err.message });
  }
});

// Cancel vendor order
router.post('/orders/:orderId/cancel', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get vendor for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (vendorError || !vendor) {
      return res.status(403).json({ error: 'No vendor found for this user' });
    }

    // Check if vendor owns this order item
    const { data: orderItem, error: checkError } = await supabase
      .from('order_items')
      .select('id, status')
      .eq('vendor_id', vendor.id)
      .eq('order_id', orderId)
      .single();

    if (checkError || !orderItem) {
      return res.status(403).json({ error: 'You do not have permission to cancel this order' });
    }

    if (orderItem.status === 'fulfilled' || orderItem.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot cancel a fulfilled or already cancelled order' });
    }

    // Update order item status
    const { error: updateError } = await supabase
      .from('order_items')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || null,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .eq('vendor_id', vendor.id);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'Order cancelled' });
  } catch (err) {
    console.error('[Vendor] Error cancelling order:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add tracking number to order
router.post('/orders/:orderId/tracking', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { orderId } = req.params;
    const { trackingNumber } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!trackingNumber) {
      return res.status(400).json({ error: 'Tracking number is required' });
    }

    // Get vendor for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (vendorError || !vendor) {
      return res.status(403).json({ error: 'No vendor found for this user' });
    }

    // Check if vendor owns this order item
    const { data: orderItem, error: checkError } = await supabase
      .from('order_items')
      .select('id')
      .eq('vendor_id', vendor.id)
      .eq('order_id', orderId)
      .single();

    if (checkError || !orderItem) {
      return res.status(403).json({ error: 'You do not have permission to update this order' });
    }

    // Update tracking number
    const { error: updateError } = await supabase
      .from('order_items')
      .update({
        tracking_number: trackingNumber,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .eq('vendor_id', vendor.id);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'Tracking number updated' });
  } catch (err) {
    console.error('[Vendor] Error updating tracking:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update vendor profile information
router.patch('/profile', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Get vendor for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (vendorError || !vendor) {
      return res.status(403).json({ error: 'No vendor found for this user' });
    }

    // Build update object with allowed fields
    const allowedFields = ['business_name', 'description', 'website', 'location', 'logo_url', 'cover_image_url', 'metadata'];
    const vendorUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        vendorUpdates[field] = updates[field];
      }
    }

    if (Object.keys(vendorUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Add timestamp
    vendorUpdates.updated_at = new Date().toISOString();

    // Update vendor
    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update(vendorUpdates)
      .eq('id', vendor.id)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`✅ Vendor ${vendor.id} profile updated`);
    res.json({ 
      success: true,
      vendor: updatedVendor 
    });
  } catch (err) {
    console.error('[Vendor] Error updating profile:', err);
    res.status(500).json({ error: err.message || 'Failed to update vendor profile' });
  }
});

// Get vendor analytics
router.get('/orders/analytics', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { period = 30 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get vendor for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (vendorError || !vendor) {
      return res.status(403).json({ error: 'No vendor found for this user' });
    }

    // Calculate date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get order items for this vendor in the period
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('status, total_price, created_at')
      .eq('vendor_id', vendor.id)
      .gte('created_at', startDate.toISOString());

    if (itemsError) throw itemsError;

    // Calculate analytics
    const totalOrders = orderItems?.length || 0;
    const totalRevenue = orderItems?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const fulfilledOrders = orderItems?.filter(item => item.status === 'fulfilled').length || 0;

    res.json({
      totalOrders,
      totalRevenue,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      fulfilledOrders,
      fulfillmentRate: totalOrders > 0 ? Math.round((fulfilledOrders / totalOrders) * 100) : 0
    });
  } catch (err) {
    console.error('[Vendor] Error fetching analytics:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a vendor's product with proper field mapping
router.patch('/products/:productId', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { productId } = req.params;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Get product to verify ownership and fetch full data (including metadata)
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('vendor_id, metadata')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get vendor to check ownership
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', product.vendor_id)
      .eq('owner_id', userId)
      .single();

    if (vendorError || !vendor) {
      return res.status(403).json({ error: 'You do not have permission to update this product' });
    }

    // Map frontend field names to database schema
    const dbUpdates = {};
    
    if (updates.title !== undefined) {
      if (updates.title.length < 3) {
        return res.status(400).json({ error: 'Title must be at least 3 characters' });
      }
      dbUpdates.title = updates.title;
    }
    
    if (updates.description !== undefined) {
      dbUpdates.description = updates.description;
    }
    
    // Map price_in_cents → base_price
    if (updates.price_in_cents !== undefined) {
      if (typeof updates.price_in_cents !== 'number' || updates.price_in_cents < 0) {
        return res.status(400).json({ error: 'Price must be a non-negative number' });
      }
      dbUpdates.base_price = updates.price_in_cents;
    }
    
    // Map image → image_url
    if (updates.image !== undefined) {
      dbUpdates.image_url = updates.image;
    }
    
    // Handle category field: use categories table if exists, else store in metadata
    if (updates.category !== undefined) {
      try {
        // Try to find category by name (case-insensitive)
        const { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('id')
          .ilike('name', updates.category)
          .single();

        if (category?.id) {
          // Category exists → update category_id
          dbUpdates.category_id = category.id;
          console.log(`📋 Product ${productId}: Category "${updates.category}" → ID ${category.id}`);
        } else {
          // Category doesn't exist → store in metadata and flag for admin review
          const currentMetadata = product.metadata || {};
          dbUpdates.metadata = {
            ...currentMetadata,
            category_name: updates.category,
            category_updated_at: new Date().toISOString(),
            needs_category_review: true
          };
          
          // Create admin alert for review
          try {
            const alertTitle = `Category Review: "${updates.category}"`;
            const alertDescription = `Product ${productId} uses custom category "${updates.category}". Please create category or update product to existing category.`;
            
            await supabase
              .from('admin_alerts')
              .insert({
                type: 'category_review',
                title: alertTitle,
                description: alertDescription,
                metadata: {
                  product_id: productId,
                  category_name: updates.category,
                  vendor_id: product.vendor_id
                },
                status: 'open'
              });
            console.log(`⚠️ Product ${productId}: Category "${updates.category}" flagged for admin review`);
          } catch (alertErr) {
            console.warn(`📢 Could not create admin alert:`, alertErr.message);
            // Don't fail the product update if alert fails
          }
        }
      } catch (err) {
        console.warn(`⚠️ Category lookup failed:`, err.message);
        // Fallback: store in metadata if lookup fails
        const currentMetadata = product.metadata || {};
        dbUpdates.metadata = {
          ...currentMetadata,
          category_name: updates.category,
          category_updated_at: new Date().toISOString()
        };
      }
    }

    if (Object.keys(dbUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Add timestamp
    dbUpdates.updated_at = new Date().toISOString();

    // Update the product
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', productId)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`✅ Product ${productId} updated:`, dbUpdates);

    res.json({ 
      success: true,
      product: updatedProduct 
    });
  } catch (err) {
    console.error('[Vendor] Error updating product:', err);
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

// Get top products for vendor
router.get('/products/top', verifyJWT, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 5 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get vendor for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (vendorError || !vendor) {
      return res.status(403).json({ error: 'No vendor found for this user' });
    }

    // Get top products by sales
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, image_url, price, sales_count')
      .eq('vendor_id', vendor.id)
      .order('sales_count', { ascending: false })
      .limit(parseInt(limit));

    if (productsError) throw productsError;

    res.json({ products: products || [] });
  } catch (err) {
    console.error('[Vendor] Error fetching top products:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get vendor by owner ID (dashboard initialization)
// Returns the first vendor for this owner (or highest priority vendor)
router.get('/by-owner/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;
    console.log('[Vendor] GET /by-owner/:ownerId - ownerId:', ownerId);

    if (!ownerId) {
      return res.status(400).json({ error: 'Owner ID is required' });
    }

    // Fetch first vendor for this owner
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (vendorError) {
      console.error('[Vendor] Error fetching vendor:', vendorError);
      return res.status(500).json({ error: vendorError.message });
    }

    const vendor = vendors?.[0] || null;

    if (!vendor) {
      console.log('[Vendor] No vendor found for owner:', ownerId);
      return res.json({ vendor: null });
    }

    console.log('[Vendor] Returning vendor with onboarding_status:', vendor.onboarding_status);
    res.json({ vendor });
  } catch (err) {
    console.error('[Vendor] Error in /by-owner:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

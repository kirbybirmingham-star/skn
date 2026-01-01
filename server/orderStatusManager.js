/**
 * Order Status Management System
 * Handles all order status transitions, validation, and business logic
 */

import { supabase } from './supabaseClient.js';

// ===== ORDER STATUS CONSTANTS =====
export const ORDER_STATUSES = {
  pending: 'pending',
  paid: 'paid',
  confirmed: 'confirmed',
  processing: 'processing',
  packed: 'packed',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
  refunded: 'refunded',
  disputed: 'disputed'
};

// ===== STATUS TRANSITION RULES =====
export const ORDER_STATUS_TRANSITIONS = {
  pending: ['paid', 'cancelled', 'disputed'],
  paid: ['confirmed', 'cancelled', 'disputed'],
  confirmed: ['processing', 'cancelled', 'disputed'],
  processing: ['packed', 'cancelled', 'disputed'],
  packed: ['shipped', 'cancelled', 'disputed'],
  shipped: ['delivered', 'cancelled', 'disputed'],
  delivered: ['refunded', 'disputed'],
  cancelled: [],
  refunded: [],
  disputed: ['cancelled', 'refunded']
};

// ===== STATUS BUSINESS RULES =====
export const STATUS_BUSINESS_RULES = {
  // Automatic transitions
  paid: {
    trigger: 'payment_success',
    requires_payment: true
  },
  confirmed: {
    requires_manual_action: true,
    allowed_roles: ['admin', 'vendor']
  },
  processing: {
    automatic_after: 'confirmed',
    delay_hours: 0 // immediate
  },
  packed: {
    requires_manual_action: true,
    allowed_roles: ['admin', 'vendor']
  },
  shipped: {
    requires_manual_action: true,
    allowed_roles: ['admin', 'vendor'],
    requires_tracking: true
  },
  delivered: {
    automatic_after: 'shipped',
    delay_days: 7, // auto-deliver after 7 days if not manually marked
    requires_manual_action: true,
    allowed_roles: ['admin', 'vendor']
  },
  cancelled: {
    allowed_from_any_state: true,
    requires_reason: true
  },
  refunded: {
    requires_approval: true,
    allowed_from: ['delivered'],
    allowed_roles: ['admin']
  },
  disputed: {
    allowed_from_any_state: true,
    allowed_roles: ['customer', 'vendor', 'admin']
  }
};

// ===== VALIDATION FUNCTIONS =====

/**
 * Validates if a status value is valid
 * @param {string} status - Status to validate
 * @returns {boolean}
 */
export function validateOrderStatus(status) {
  return Object.values(ORDER_STATUSES).includes(status);
}

/**
 * Validates if a transition from currentStatus to newStatus is allowed
 * @param {string} currentStatus - Current order status
 * @param {string} newStatus - Target status
 * @returns {boolean}
 */
export function canTransitionStatus(currentStatus, newStatus) {
  if (!validateOrderStatus(currentStatus) || !validateOrderStatus(newStatus)) {
    return false;
  }

  // Check if cancelled/refunded allow transition to disputed
  if (currentStatus === 'cancelled' || currentStatus === 'refunded') {
    return newStatus === 'disputed';
  }

  return ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

/**
 * Validates if a user can perform a status transition
 * @param {string} userRole - User's role
 * @param {string} currentStatus - Current order status
 * @param {string} newStatus - Target status
 * @param {Object} orderData - Order data for additional validation
 * @returns {Object} { valid: boolean, reason?: string }
 */
export function validateStatusTransition(userRole, currentStatus, newStatus, orderData = {}) {
  // Basic transition validation
  if (!canTransitionStatus(currentStatus, newStatus)) {
    return {
      valid: false,
      reason: `Cannot transition from ${currentStatus} to ${newStatus}`
    };
  }

  const rules = STATUS_BUSINESS_RULES[newStatus];
  if (!rules) {
    return { valid: false, reason: 'Status rules not defined' };
  }

  // Check role permissions
  if (rules.allowed_roles && !rules.allowed_roles.includes(userRole)) {
    return {
      valid: false,
      reason: `Role ${userRole} cannot change status to ${newStatus}`
    };
  }

  // Check specific business rules
  if (newStatus === 'shipped' && rules.requires_tracking) {
    if (!orderData.tracking_number || !orderData.shipping_carrier) {
      return {
        valid: false,
        reason: 'Tracking number and carrier required for shipping'
      };
    }
  }

  if (newStatus === 'cancelled' && rules.requires_reason) {
    if (!orderData.cancellation_reason) {
      return {
        valid: false,
        reason: 'Cancellation reason required'
      };
    }
  }

  if (newStatus === 'refunded' && rules.requires_approval) {
    // Additional approval workflow validation would go here
    if (userRole !== 'admin') {
      return {
        valid: false,
        reason: 'Refund requires admin approval'
      };
    }
  }

  return { valid: true };
}

// ===== STATUS CHANGE HANDLERS =====

/**
 * Handles side effects when order status changes
 * @param {string} orderId - Order ID
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<void>}
 */
export async function handleStatusChange(orderId, oldStatus, newStatus, metadata = {}) {
  try {
    // Update order timestamps based on status
    await updateOrderTimestamps(orderId, newStatus);

    // Trigger status-dependent actions
    await triggerStatusActions(orderId, oldStatus, newStatus, metadata);

    // Log the status change
    await logStatusChange(orderId, oldStatus, newStatus, metadata);
  } catch (error) {
    console.error('Error handling status change:', error);
    throw error;
  }
}

/**
 * Updates order timestamps based on status change
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New status
 * @returns {Promise<void>}
 */
async function updateOrderTimestamps(orderId, newStatus) {
  const updates = {};

  switch (newStatus) {
    case 'shipped':
      updates.shipped_at = new Date().toISOString();
      break;
    case 'delivered':
      updates.delivered_at = new Date().toISOString();
      break;
    case 'cancelled':
      updates.cancelled_at = new Date().toISOString();
      break;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId);

    if (error) {
      throw new Error(`Failed to update timestamps: ${error.message}`);
    }
  }
}

/**
 * Triggers actions based on status change (inventory updates, notifications, etc.)
 * @param {string} orderId - Order ID
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function triggerStatusActions(orderId, oldStatus, newStatus, metadata = {}) {
  try {
    // Get order details for actions
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        status,
        order_items (
          id,
          quantity,
          product_id,
          variant_id,
          products (
            id,
            title,
            inventory_quantity
          ),
          product_variants (
            id,
            sku,
            inventory_quantity
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (error || !order) {
      console.error('Failed to fetch order for status actions:', error);
      return;
    }

    // Status-specific actions
    switch (newStatus) {
      case 'paid':
        // Deduct inventory immediately when payment is confirmed
        await handleOrderPaid(order);
        break;
      case 'confirmed':
        // Check if inventory was already deducted on 'paid', if not deduct now
        if (oldStatus !== 'paid') {
          await handleOrderConfirmed(order);
        }
        break;
      case 'processing':
        await handleOrderProcessing(order);
        break;
      case 'packed':
        await handleOrderPacked(order);
        break;
      case 'shipped':
        await handleOrderShipped(order, metadata);
        break;
      case 'delivered':
        await handleOrderDelivered(order);
        break;
      case 'cancelled':
        await handleOrderCancelled(order, metadata);
        break;
      case 'refunded':
        await handleOrderRefunded(order);
        break;
    }

    // Trigger notifications
    await triggerNotifications(orderId, oldStatus, newStatus, order.user_id);

  } catch (error) {
    console.error('Error triggering status actions:', error);
    // Don't throw - actions are not critical for status change
  }
}

/**
 * Logs status change to audit trail
 * @param {string} orderId - Order ID
 * @param {string} oldStatus - Previous status
 * @param {string} newStatus - New status
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<void>}
 */
async function logStatusChange(orderId, oldStatus, newStatus, metadata = {}) {
  try {
    const { error } = await supabase
      .from('order_status_history')
      .insert({
        order_id: orderId,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: metadata.changed_by,
        change_reason: metadata.reason,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString()
        }
      });

    if (error) {
      console.error('Failed to log status change:', error);
    }
  } catch (error) {
    console.error('Error logging status change:', error);
  }
}

// ===== STATUS ACTION HANDLERS =====

/**
 * Handles inventory deduction when payment is confirmed
 * This is the primary point where inventory should be reserved
 */
async function handleOrderPaid(order) {
  console.log(`Processing inventory deduction for paid order: ${order.id}`);
  
  // Deduct inventory for each item in the order
  for (const item of order.order_items) {
    const variant = item.product_variants;
    const product = item.products;

    // Prefer variant inventory over product inventory
    if (variant && variant.inventory_quantity !== null && variant.inventory_quantity !== undefined) {
      const newInventory = Math.max(0, variant.inventory_quantity - item.quantity);
      
      // Update variant inventory
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ 
          inventory_quantity: newInventory,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.variant_id);

      if (updateError) {
        console.error(`Failed to update variant ${item.variant_id} inventory:`, updateError);
        continue;
      }

      // Log inventory transaction for audit trail
      try {
        await supabase.rpc('log_inventory_transaction', {
          p_variant_id: item.variant_id,
          p_transaction_type: 'sale',
          p_quantity_change: -item.quantity,
          p_reason: `Order paid: ${order.id}`,
          p_reference_type: 'order',
          p_reference_id: order.id
        });
      } catch (err) {
        console.error(`Failed to log inventory transaction for variant ${item.variant_id}:`, err);
      }
    } else if (product && product.inventory_quantity !== null && product.inventory_quantity !== undefined) {
      // Fallback to product-level inventory (if no variants)
      const newInventory = Math.max(0, product.inventory_quantity - item.quantity);
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          inventory_quantity: newInventory,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id);

      if (updateError) {
        console.error(`Failed to update product ${item.product_id} inventory:`, updateError);
        continue;
      }

      // Log inventory transaction for audit trail
      try {
        await supabase.rpc('log_inventory_transaction', {
          p_product_id: item.product_id,
          p_transaction_type: 'sale',
          p_quantity_change: -item.quantity,
          p_reason: `Order paid: ${order.id}`,
          p_reference_type: 'order',
          p_reference_id: order.id
        });
      } catch (err) {
        console.error(`Failed to log inventory transaction for product ${item.product_id}:`, err);
      }
    } else {
      console.warn(`No inventory field found for variant ${item.variant_id} or product ${item.product_id}`);
    }
  }
  
  console.log(`Inventory deduction completed for order: ${order.id}`);
}

async function handleOrderConfirmed(order) {
  // Reserve inventory - deduct from variants or products
  for (const item of order.order_items) {
    const variant = item.product_variants;
    const product = item.products;

    // Prefer variant inventory over product inventory
    if (variant && variant.inventory_quantity !== null && variant.inventory_quantity !== undefined) {
      const newInventory = Math.max(0, variant.inventory_quantity - item.quantity);
      
      // Update variant inventory
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ 
          inventory_quantity: newInventory,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.variant_id);

      if (updateError) {
        console.error(`Failed to update variant ${item.variant_id} inventory:`, updateError);
        continue;
      }

      // Log inventory transaction for audit trail
      try {
        await supabase.rpc('log_inventory_transaction', {
          p_variant_id: item.variant_id,
          p_transaction_type: 'sale',
          p_quantity_change: -item.quantity,
          p_reason: `Order confirmed: ${order.id}`,
          p_reference_type: 'order',
          p_reference_id: order.id
        });
      } catch (err) {
        console.error(`Failed to log inventory transaction for variant ${item.variant_id}:`, err);
      }
    } else if (product && product.inventory_quantity !== null && product.inventory_quantity !== undefined) {
      // Fallback to product-level inventory (if no variants)
      const newInventory = Math.max(0, product.inventory_quantity - item.quantity);
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          inventory_quantity: newInventory,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id);

      if (updateError) {
        console.error(`Failed to update product ${item.product_id} inventory:`, updateError);
        continue;
      }

      // Log inventory transaction for audit trail
      try {
        await supabase.rpc('log_inventory_transaction', {
          p_product_id: item.product_id,
          p_transaction_type: 'sale',
          p_quantity_change: -item.quantity,
          p_reason: `Order confirmed: ${order.id}`,
          p_reference_type: 'order',
          p_reference_id: order.id
        });
      } catch (err) {
        console.error(`Failed to log inventory transaction for product ${item.product_id}:`, err);
      }
    } else {
      console.warn(`No inventory field found for variant ${item.variant_id} or product ${item.product_id}`);
    }
  }
}

async function handleOrderProcessing(order) {
  // Additional processing logic can be added here
  console.log(`Order ${order.id} moved to processing`);
}

async function handleOrderPacked(order) {
  // Additional packing logic can be added here
  console.log(`Order ${order.id} packed and ready for shipping`);
}

async function handleOrderShipped(order, metadata) {
  // Update shipping information
  const updates = {};
  if (metadata.tracking_number) updates.tracking_number = metadata.tracking_number;
  if (metadata.carrier) updates.shipping_carrier = metadata.carrier;
  if (metadata.notes) updates.fulfillment_notes = metadata.notes;

  if (Object.keys(updates).length > 0) {
    await supabase
      .from('orders')
      .update(updates)
      .eq('id', order.id);
  }

  console.log(`Order ${order.id} shipped with tracking: ${metadata.tracking_number}`);
}

async function handleOrderDelivered(order) {
  // Finalize order metrics
  console.log(`Order ${order.id} delivered successfully`);
}

async function handleOrderCancelled(order, metadata) {
  // Restore inventory when order is cancelled
  for (const item of order.order_items) {
    const variant = item.product_variants;
    const product = item.products;

    // Prefer variant inventory over product inventory
    if (variant && variant.inventory_quantity !== null && variant.inventory_quantity !== undefined) {
      const newInventory = variant.inventory_quantity + item.quantity;
      
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ 
          inventory_quantity: newInventory,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.variant_id);

      if (updateError) {
        console.error(`Failed to restore variant ${item.variant_id} inventory:`, updateError);
        continue;
      }

      // Log inventory transaction for audit trail
      try {
        await supabase.rpc('log_inventory_transaction', {
          p_variant_id: item.variant_id,
          p_transaction_type: 'cancellation',
          p_quantity_change: item.quantity,
          p_reason: `Order cancelled: ${metadata.reason || 'No reason provided'}`,
          p_reference_type: 'order',
          p_reference_id: order.id
        });
      } catch (err) {
        console.error(`Failed to log inventory transaction for variant ${item.variant_id}:`, err);
      }
    } else if (product && product.inventory_quantity !== null && product.inventory_quantity !== undefined) {
      // Fallback to product-level inventory (if no variants)
      const newInventory = product.inventory_quantity + item.quantity;
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          inventory_quantity: newInventory,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id);

      if (updateError) {
        console.error(`Failed to restore product ${item.product_id} inventory:`, updateError);
        continue;
      }

      // Log inventory transaction for audit trail
      try {
        await supabase.rpc('log_inventory_transaction', {
          p_product_id: item.product_id,
          p_transaction_type: 'cancellation',
          p_quantity_change: item.quantity,
          p_reason: `Order cancelled: ${metadata.reason || 'No reason provided'}`,
          p_reference_type: 'order',
          p_reference_id: order.id
        });
      } catch (err) {
        console.error(`Failed to log inventory transaction for product ${item.product_id}:`, err);
      }
    } else {
      console.warn(`No inventory field found for variant ${item.variant_id} or product ${item.product_id}`);
    }
  }

  console.log(`Order ${order.id} cancelled: ${metadata.reason}`);
}

async function handleOrderRefunded(order) {
  // Restore inventory for refunded items
  // This would be handled by the refund system separately
  console.log(`Order ${order.id} refunded`);
}

// ===== NOTIFICATION SYSTEM =====

async function triggerNotifications(orderId, oldStatus, newStatus, userId) {
  try {
    // Import notification service dynamically to avoid circular dependencies
    const { default: notificationService } = await import('./notificationService.js');

    // Get user's notification preferences
    const prefs = await notificationService.getUserPreferences(userId);

    // Determine if notification should be sent
    const shouldNotify = getNotificationPreference(prefs, newStatus);

    if (shouldNotify) {
      // Send notification using the new notification service
      await notificationService.triggerOrderStatusNotification(orderId, oldStatus, newStatus, userId);
    }
  } catch (error) {
    console.error('Error triggering notifications:', error);
  }
}

// Legacy notification functions - kept for backward compatibility
// These are now handled by the notificationService
function getNotificationPreference(prefs, status) {
  const defaultPrefs = {
    order_confirmed: true,
    order_shipped: true,
    order_delivered: true,
    order_cancelled: true
  };

  const userPrefs = { ...defaultPrefs, ...prefs };

  switch (status) {
    case 'confirmed': return userPrefs.order_confirmed;
    case 'shipped': return userPrefs.order_shipped;
    case 'delivered': return userPrefs.order_delivered;
    case 'cancelled': return userPrefs.order_cancelled;
    default: return false;
  }
}

function getEmailTemplateForStatus(status) {
  const templates = {
    confirmed: 'order_confirmed',
    shipped: 'order_shipped',
    delivered: 'order_delivered',
    cancelled: 'order_cancelled'
  };
  return templates[status];
}

// ===== AUTOMATIC STATUS TRANSITIONS =====

/**
 * Processes automatic status transitions based on business rules
 * This should be called by a cron job or webhook
 * @returns {Promise<void>}
 */
export async function processAutomaticTransitions() {
  try {
    // Auto-confirm paid orders after payment verification
    await autoConfirmPaidOrders();

    // Auto-deliver shipped orders after timeout
    await autoDeliverShippedOrders();

    // Auto-process confirmed orders
    await autoProcessConfirmedOrders();

  } catch (error) {
    console.error('Error processing automatic transitions:', error);
  }
}

async function autoConfirmPaidOrders() {
  // This would be triggered by payment webhooks
  // For now, just log that this should be implemented
  console.log('Auto-confirmation of paid orders should be implemented via payment webhooks');
}

async function autoDeliverShippedOrders() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'shipped')
    .lt('shipped_at', sevenDaysAgo.toISOString());

  if (error) {
    console.error('Error fetching orders for auto-delivery:', error);
    return;
  }

  for (const order of orders || []) {
    try {
      await handleStatusChange(order.id, 'shipped', 'delivered', {
        reason: 'Auto-delivered after 7 days',
        automatic: true
      });

      await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', order.id);

    } catch (error) {
      console.error(`Failed to auto-deliver order ${order.id}:`, error);
    }
  }
}

async function autoProcessConfirmedOrders() {
  // Auto-move confirmed orders to processing immediately
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'confirmed');

  if (error) {
    console.error('Error fetching confirmed orders:', error);
    return;
  }

  for (const order of orders || []) {
    try {
      await handleStatusChange(order.id, 'confirmed', 'processing', {
        reason: 'Auto-processing confirmed order',
        automatic: true
      });

      await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', order.id);

    } catch (error) {
      console.error(`Failed to auto-process order ${order.id}:`, error);
    }
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Gets the display name for a status
 * @param {string} status - Status value
 * @returns {string}
 */
export function getStatusDisplayName(status) {
  const names = {
    pending: 'Pending',
    paid: 'Paid',
    confirmed: 'Confirmed',
    processing: 'Processing',
    packed: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    disputed: 'Disputed'
  };
  return names[status] || status;
}

/**
 * Gets available next statuses for a given status
 * @param {string} currentStatus - Current status
 * @returns {string[]}
 */
export function getAvailableTransitions(currentStatus) {
  return ORDER_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Checks if a status is a final state (no further transitions allowed except dispute)
 * @param {string} status - Status to check
 * @returns {boolean}
 */
export function isFinalStatus(status) {
  const finalStatuses = ['delivered', 'cancelled', 'refunded'];
  return finalStatuses.includes(status);
}

/**
 * Gets status color for UI display
 * @param {string} status - Status value
 * @returns {string}
 */
export function getStatusColor(status) {
  const colors = {
    pending: 'gray',
    paid: 'blue',
    confirmed: 'green',
    processing: 'yellow',
    packed: 'orange',
    shipped: 'purple',
    delivered: 'green',
    cancelled: 'red',
    refunded: 'red',
    disputed: 'red'
  };
  return colors[status] || 'gray';
}

export default {
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  STATUS_BUSINESS_RULES,
  validateOrderStatus,
  canTransitionStatus,
  validateStatusTransition,
  handleStatusChange,
  processAutomaticTransitions,
  getStatusDisplayName,
  getAvailableTransitions,
  isFinalStatus,
  getStatusColor
};
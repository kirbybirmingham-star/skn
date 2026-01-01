import { supabase } from '../lib/customSupabaseClient';

// Get inventory for a vendor
export async function getVendorInventory(vendorId, options = {}) {
  if (!supabase) {
    console.warn('Supabase not initialized, returning empty inventory');
    return { variants: [], alerts: [], pagination: {} };
  }

  const { page = 1, perPage = 50, search, lowStock = false } = options;

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
      ...(search && { search }),
      ...(lowStock && { lowStock: 'true' })
    });

    const response = await fetch(`/api/inventory/vendor/${vendorId}?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch inventory: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching vendor inventory:', error);
    throw error;
  }
}

// Get inventory for a specific variant
export async function getVariantInventory(variantId) {
  if (!supabase) {
    console.warn('Supabase not initialized');
    return null;
  }

  try {
    const response = await fetch(`/api/inventory/variant/${variantId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch variant inventory: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching variant inventory:', error);
    throw error;
  }
}

// Update inventory quantity for a variant
export async function updateVariantQuantity(variantId, quantity, reason = 'Manual adjustment') {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const response = await fetch(`/api/inventory/variant/${variantId}/quantity`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity, reason }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update inventory: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating variant quantity:', error);
    throw error;
  }
}

// Bulk update inventory quantities
export async function bulkUpdateInventory(updates) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const response = await fetch('/api/inventory/bulk-update', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk update inventory: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error bulk updating inventory:', error);
    throw error;
  }
}

// Get inventory transactions/history
export async function getInventoryTransactions(variantId, options = {}) {
  if (!supabase) {
    console.warn('Supabase not initialized');
    return { transactions: [], pagination: {} };
  }

  const { page = 1, perPage = 50, type, dateFrom, dateTo } = options;

  try {
    const params = new URLSearchParams({
      page: page.toString(),
      perPage: perPage.toString(),
      ...(type && { type }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo })
    });

    const response = await fetch(`/api/inventory/transactions/${variantId}?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch transactions: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching inventory transactions:', error);
    throw error;
  }
}

// Get inventory alerts for a vendor
export async function getInventoryAlerts(vendorId, active = true) {
  if (!supabase) {
    console.warn('Supabase not initialized');
    return { alerts: [] };
  }

  try {
    const params = new URLSearchParams({
      active: active.toString()
    });

    const response = await fetch(`/api/inventory/alerts/${vendorId}?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch alerts: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    throw error;
  }
}

// Update inventory settings for a vendor
export async function updateInventorySettings(vendorId, settings) {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  try {
    const response = await fetch(`/api/inventory/settings/${vendorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error(`Failed to update settings: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating inventory settings:', error);
    throw error;
  }
}

// Get inventory settings for a vendor
export async function getInventorySettings(vendorId) {
  if (!supabase) {
    console.warn('Supabase not initialized');
    return {
      settings: {
        low_stock_threshold: 5,
        auto_create_alerts: true,
        track_inventory: true,
        allow_negative_stock: false,
        default_adjustment_reason: 'Manual adjustment'
      }
    };
  }

  try {
    const response = await fetch(`/api/inventory/settings/${vendorId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch settings: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching inventory settings:', error);
    throw error;
  }
}

// Adjust inventory quantity (add or subtract)
export async function adjustInventoryQuantity(variantId, adjustment, reason = 'Inventory adjustment') {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  if (typeof adjustment !== 'number') {
    throw new Error('Adjustment must be a number');
  }

  try {
    // First get current quantity
    const variantData = await getVariantInventory(variantId);
    const currentQuantity = variantData.variant.inventory_quantity;
    const newQuantity = currentQuantity + adjustment;

    // Update with new quantity
    return await updateVariantQuantity(variantId, newQuantity, reason);
  } catch (error) {
    console.error('Error adjusting inventory quantity:', error);
    throw error;
  }
}
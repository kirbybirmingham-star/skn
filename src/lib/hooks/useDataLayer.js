/**
 * ============================================================================
 * DATA LAYER HOOKS
 * ============================================================================
 * 
 * Svelte stores and hooks for seamless data layer integration
 * Handles loading states, error states, and data updates reactively
 */

import { writable, derived, get } from 'svelte/store';
import DataLayer from '../api/DataLayer.js';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../config/dataLayerConfig.js';

// ============================================================================
// NOTIFICATION STORE (for displaying success/error messages)
// ============================================================================

export const notification = writable({
  visible: false,
  message: '',
  type: 'success', // 'success', 'error', 'info', 'warning'
  duration: 3000
});

/**
 * Show notification
 */
export function showNotification(message, type = 'success', duration = 3000) {
  notification.set({ visible: true, message, type, duration });
  if (duration > 0) {
    setTimeout(() => notification.update(n => ({ ...n, visible: false })), duration);
  }
}

/**
 * Show success notification
 */
export function success(message) {
  showNotification(message, 'success');
}

/**
 * Show error notification
 */
export function error(message) {
  showNotification(message, 'error', 5000);
}

/**
 * Show info notification
 */
export function info(message) {
  showNotification(message, 'info');
}

// ============================================================================
// GENERIC DATA STORE FACTORY
// ============================================================================

/**
 * Create a reactive data store for any fetch operation
 * Usage: const products = createDataStore(DataLayer.products.getAll);
 */
export function createDataStore(fetchFn, initialData = null) {
  const data = writable(initialData);
  const loading = writable(false);
  const loaded = writable(false);
  const error = writable(null);

  const fetch = async (options = {}) => {
    loading.set(true);
    error.set(null);

    try {
      const result = await fetchFn(options);

      if (result.success) {
        data.set(result.data);
        loaded.set(true);
        return result;
      } else {
        const errorMsg = result.error?.message || ERROR_MESSAGES.UNKNOWN;
        error.set(errorMsg);
        showNotification(errorMsg, 'error');
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || ERROR_MESSAGES.UNKNOWN;
      error.set(errorMsg);
      showNotification(errorMsg, 'error');
      return { success: false, error: err };
    } finally {
      loading.set(false);
    }
  };

  const refresh = () => fetch();
  const clear = () => {
    data.set(initialData);
    loaded.set(false);
    error.set(null);
  };

  return {
    data,
    loading,
    loaded,
    error,
    fetch,
    refresh,
    clear,
    // Derived store for ready state
    ready: derived([loading, loaded], ([$loading, $loaded]) => !$loading && $loaded),
    // Derived store for error state
    hasError: derived([error], ([$error]) => $error !== null)
  };
}

// ============================================================================
// PRODUCTS HOOKS
// ============================================================================

/**
 * Create products store (for listing/searching)
 */
export function createProductsStore(filters = {}) {
  return createDataStore(
    (options) => DataLayer.products.getAll({ ...filters, ...options })
  );
}

/**
 * Create single product store
 */
export function createProductStore(productId) {
  const store = createDataStore(() => DataLayer.products.getById(productId));

  return {
    ...store,
    update: async (data) => {
      const result = await DataLayer.products.update(productId, data);
      if (result.success) {
        store.data.set(result.data);
        showNotification(SUCCESS_MESSAGES.PRODUCT_UPDATED);
      } else {
        error(result.error?.message || ERROR_MESSAGES.UNKNOWN);
      }
      return result;
    },
    delete: async () => {
      const result = await DataLayer.products.delete(productId);
      if (result.success) {
        store.clear();
        showNotification(SUCCESS_MESSAGES.PRODUCT_DELETED);
      } else {
        error(result.error?.message || ERROR_MESSAGES.UNKNOWN);
      }
      return result;
    }
  };
}

/**
 * Create product creation hook
 */
export function useCreateProduct() {
  const loading = writable(false);
  const error = writable(null);

  const create = async (data) => {
    loading.set(true);
    error.set(null);

    try {
      const result = await DataLayer.products.create(data);

      if (result.success) {
        showNotification(SUCCESS_MESSAGES.PRODUCT_CREATED);
        return result;
      } else {
        const errorMsg = result.error?.message || ERROR_MESSAGES.UNKNOWN;
        error.set(errorMsg);
        showNotification(errorMsg, 'error');
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || ERROR_MESSAGES.UNKNOWN;
      error.set(errorMsg);
      showNotification(errorMsg, 'error');
      return { success: false, error: err };
    } finally {
      loading.set(false);
    }
  };

  return { loading, error, create };
}

// ============================================================================
// VENDORS HOOKS
// ============================================================================

/**
 * Create vendors store
 */
export function createVendorsStore() {
  return createDataStore(() => DataLayer.vendors.getAll());
}

/**
 * Create vendor store (current user's vendor)
 */
export function createVendorStore(userId) {
  const store = createDataStore(() => DataLayer.vendors.getByOwner(userId));

  return {
    ...store,
    update: async (data) => {
      const vendorId = get(store.data)?.id;
      if (!vendorId) {
        error('Vendor not found');
        return { success: false };
      }

      const result = await DataLayer.vendors.update(vendorId, data);
      if (result.success) {
        store.data.set(result.data);
        showNotification(SUCCESS_MESSAGES.VENDOR_UPDATED);
      } else {
        error(result.error?.message || ERROR_MESSAGES.UNKNOWN);
      }
      return result;
    }
  };
}

// ============================================================================
// ORDERS HOOKS
// ============================================================================

/**
 * Create orders store (vendor orders)
 */
export function createOrdersStore() {
  return createDataStore(() => DataLayer.orders.getVendorOrders());
}

/**
 * Use order fulfillment
 */
export function useOrderFulfillment() {
  const loading = writable(false);
  const error = writable(null);

  const fulfill = async (orderId) => {
    loading.set(true);
    error.set(null);

    try {
      const result = await DataLayer.orders.fulfill(orderId);

      if (result.success) {
        showNotification(SUCCESS_MESSAGES.ORDER_FULFILLED);
        return result;
      } else {
        const errorMsg = result.error?.message || ERROR_MESSAGES.UNKNOWN;
        error.set(errorMsg);
        showNotification(errorMsg, 'error');
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || ERROR_MESSAGES.UNKNOWN;
      error.set(errorMsg);
      showNotification(errorMsg, 'error');
      return { success: false, error: err };
    } finally {
      loading.set(false);
    }
  };

  const cancel = async (orderId) => {
    loading.set(true);
    error.set(null);

    try {
      const result = await DataLayer.orders.cancel(orderId);

      if (result.success) {
        showNotification(SUCCESS_MESSAGES.ORDER_CANCELLED);
        return result;
      } else {
        const errorMsg = result.error?.message || ERROR_MESSAGES.UNKNOWN;
        error.set(errorMsg);
        showNotification(errorMsg, 'error');
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || ERROR_MESSAGES.UNKNOWN;
      error.set(errorMsg);
      showNotification(errorMsg, 'error');
      return { success: false, error: err };
    } finally {
      loading.set(false);
    }
  };

  return { loading, error, fulfill, cancel };
}

// ============================================================================
// INVENTORY HOOKS
// ============================================================================

/**
 * Use inventory update
 */
export function useInventoryUpdate() {
  const loading = writable(false);
  const error = writable(null);

  const update = async (productId, variantId, quantity) => {
    loading.set(true);
    error.set(null);

    try {
      const result = await DataLayer.inventory.update(productId, variantId, quantity);

      if (result.success) {
        showNotification(SUCCESS_MESSAGES.INVENTORY_UPDATED);
        return result;
      } else {
        const errorMsg = result.error?.message || ERROR_MESSAGES.UNKNOWN;
        error.set(errorMsg);
        showNotification(errorMsg, 'error');
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || ERROR_MESSAGES.UNKNOWN;
      error.set(errorMsg);
      showNotification(errorMsg, 'error');
      return { success: false, error: err };
    } finally {
      loading.set(false);
    }
  };

  return { loading, error, update };
}

// ============================================================================
// BATCH OPERATIONS HOOK
// ============================================================================

/**
 * Use batch operations
 */
export function useBatch() {
  const loading = writable(false);
  const error = writable(null);

  const execute = async (operations) => {
    loading.set(true);
    error.set(null);

    try {
      const result = await DataLayer.executeBatch(operations);

      if (result.success) {
        showNotification(`Completed ${result.data.successful}/${result.data.total} operations`);
        return result;
      } else {
        const errorMsg = `Failed: ${result.data.errors.length} operations`;
        error.set(errorMsg);
        showNotification(errorMsg, 'error');
        return result;
      }
    } catch (err) {
      const errorMsg = err.message || ERROR_MESSAGES.UNKNOWN;
      error.set(errorMsg);
      showNotification(errorMsg, 'error');
      return { success: false, error: err };
    } finally {
      loading.set(false);
    }
  };

  return { loading, error, execute };
}

export default {
  notification,
  showNotification,
  success,
  error,
  info,
  createDataStore,
  createProductsStore,
  createProductStore,
  useCreateProduct,
  createVendorsStore,
  createVendorStore,
  createOrdersStore,
  useOrderFulfillment,
  useInventoryUpdate,
  useBatch
};

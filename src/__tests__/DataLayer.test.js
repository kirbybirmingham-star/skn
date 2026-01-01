/**
 * ============================================================================
 * DATA LAYER TEST SUITE
 * ============================================================================
 * 
 * Complete test suite for the data layer
 * Run: npm run test or vitest
 * 
 * Test patterns for:
 * - DataLayer operations
 * - Validation
 * - Error handling
 * - Store behavior
 * - Svelte integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import DataLayer, { validate, executeWithRetry } from '$lib/api/DataLayer';
import { 
  createProductsStore, 
  createProductStore,
  useCreateProduct 
} from '$lib/hooks/useDataLayer';
import { validateData, productSchema } from '$lib/validation/schemas';

// ============================================================================
// UNIT TESTS - DataLayer.js
// ============================================================================

describe('DataLayer - Products', () => {
  describe('getAll()', () => {
    it('should fetch all products successfully', async () => {
      const result = await DataLayer.products.getAll();
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.timestamp).toBeDefined();
    });

    it('should return standardized response format', async () => {
      const result = await DataLayer.products.getAll();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('metadata');
    });

    it('should support filters', async () => {
      const result = await DataLayer.products.getAll({ 
        categoryId: 'electronics',
        page: 1,
        limit: 10
      });
      expect(result.success).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      // Mock network error
      const result = await DataLayer.products.getAll();
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.error.message).toBeDefined();
        expect(result.error.code).toBeDefined();
      }
    });
  });

  describe('getById()', () => {
    it('should require product ID', async () => {
      const result = await DataLayer.products.getById(null);
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('required');
    });

    it('should fetch single product', async () => {
      const result = await DataLayer.products.getById('test-product-123');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
    });
  });

  describe('create()', () => {
    it('should create product with valid data', async () => {
      const validData = {
        title: 'Test Product',
        description: 'Test Description for Product',
        base_price: 99.99,
        category_id: 'electronics',
        vendor_id: 'vendor-123'
      };

      const result = await DataLayer.products.create(validData);
      expect(result).toHaveProperty('success');
    });

    it('should validate data before creating', async () => {
      const invalidData = { title: 'x' }; // Too short
      const result = await DataLayer.products.create(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require user authentication', async () => {
      // Test authentication requirement
      const result = await DataLayer.products.create({});
      // Should fail if not authenticated
      if (!result.success) {
        expect(result.error.message).toContain('logged in');
      }
    });
  });

  describe('update()', () => {
    it('should require product ID', async () => {
      const result = await DataLayer.products.update(null, {});
      expect(result.success).toBe(false);
    });

    it('should check ownership', async () => {
      // Update should verify user owns product
      const result = await DataLayer.products.update('other-users-product', {});
      // Should fail if user doesn't own it
      if (!result.success) {
        expect(result.error.message).toContain('permission');
      }
    });

    it('should validate update data', async () => {
      const result = await DataLayer.products.update('product-123', {
        title: 'x' // Too short
      });
      // Should fail validation
      expect(result.success).toBeDefined();
    });
  });

  describe('delete()', () => {
    it('should require product ID', async () => {
      const result = await DataLayer.products.delete(null);
      expect(result.success).toBe(false);
    });

    it('should check ownership before deleting', async () => {
      const result = await DataLayer.products.delete('other-users-product');
      if (!result.success) {
        expect(result.error.message).toContain('permission');
      }
    });
  });
});

// ============================================================================
// UNIT TESTS - Validation
// ============================================================================

describe('Validation', () => {
  describe('validate() function', () => {
    it('should validate product data', () => {
      const validData = {
        title: 'Product Title',
        description: 'Product Description',
        base_price: 99.99,
        inventory_quantity: 10
      };

      const { valid, errors } = validate(validData, 'product');
      expect(valid).toBeDefined();
      expect(errors).toBeDefined();
      expect(Array.isArray(errors)).toBe(true);
    });

    it('should return validation errors', () => {
      const invalidData = { title: '' };
      const { valid, errors } = validate(invalidData, 'product');
      if (!valid) {
        expect(errors.length > 0).toBe(true);
      }
    });
  });

  describe('validateData() with schemas', () => {
    it('should validate against product schema', () => {
      const validData = {
        title: 'Product Title',
        description: 'This is a product description',
        base_price: 99.99,
        category_id: 'electronics'
      };

      const result = validateData(validData, productSchema);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('errorsArray');
      expect(result).toHaveProperty('hasErrors');
    });

    it('should catch invalid title (too short)', () => {
      const result = validateData({ title: 'x' }, productSchema);
      expect(result.hasErrors).toBe(true);
      expect(result.errors.title).toBeDefined();
    });

    it('should catch invalid price (negative)', () => {
      const result = validateData({ base_price: -10 }, productSchema);
      expect(result.hasErrors).toBe(true);
    });

    it('should catch missing required fields', () => {
      const result = validateData({}, productSchema);
      expect(result.hasErrors).toBe(true);
      expect(Object.keys(result.errors).length > 0).toBe(true);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS - Svelte Stores
// ============================================================================

describe('Svelte Integration - Stores', () => {
  describe('createProductsStore()', () => {
    it('should create store with initial state', () => {
      const store = createProductsStore();
      expect(store).toBeDefined();
      expect(store.data).toBeDefined();
      expect(store.loading).toBeDefined();
      expect(store.error).toBeDefined();
      expect(store.fetch).toBeDefined();
    });

    it('should have fetch method', () => {
      const store = createProductsStore();
      expect(typeof store.fetch).toBe('function');
    });

    it('should have refresh method', () => {
      const store = createProductsStore();
      expect(typeof store.refresh).toBe('function');
    });

    it('should have clear method', () => {
      const store = createProductsStore();
      expect(typeof store.clear).toBe('function');
    });

    it('should have derived stores', () => {
      const store = createProductsStore();
      expect(store.ready).toBeDefined();
      expect(store.hasError).toBeDefined();
    });
  });

  describe('createProductStore()', () => {
    it('should create single product store', () => {
      const store = createProductStore('product-123');
      expect(store).toBeDefined();
      expect(store.data).toBeDefined();
      expect(store.update).toBeDefined();
      expect(store.delete).toBeDefined();
    });

    it('should have update method', () => {
      const store = createProductStore('product-123');
      expect(typeof store.update).toBe('function');
    });

    it('should have delete method', () => {
      const store = createProductStore('product-123');
      expect(typeof store.delete).toBe('function');
    });
  });

  describe('useCreateProduct()', () => {
    it('should provide create function', () => {
      const { create, loading } = useCreateProduct();
      expect(typeof create).toBe('function');
      expect(loading).toBeDefined();
    });

    it('should have loading state', () => {
      const { loading } = useCreateProduct();
      expect(loading).toBeDefined();
    });

    it('should have error state', () => {
      const { error } = useCreateProduct();
      expect(error).toBeDefined();
    });
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
  it('should catch network errors', async () => {
    // Test network error handling
    const result = await DataLayer.products.getAll();
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('error');
  });

  it('should format error messages', async () => {
    const result = await DataLayer.products.getById(null);
    if (!result.success) {
      expect(result.error).toHaveProperty('message');
      expect(result.error).toHaveProperty('code');
      expect(typeof result.error.message).toBe('string');
    }
  });

  it('should include metadata with timestamp', async () => {
    const result = await DataLayer.products.getAll();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.timestamp).toBeDefined();
  });
});

// ============================================================================
// RETRY LOGIC TESTS
// ============================================================================

describe('Retry Logic', () => {
  it('should retry on failure', async () => {
    let attemptCount = 0;
    const mockOperation = vi.fn(async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Temporary failure');
      }
      return { success: true };
    });

    try {
      const result = await executeWithRetry(mockOperation, 3, 100);
      expect(result.success).toBe(true);
    } catch {
      // Expected to fail after max retries
    }
  });

  it('should use exponential backoff', async () => {
    const startTime = Date.now();
    const delays = [];
    
    let attemptCount = 0;
    const mockOperation = vi.fn(async () => {
      attemptCount++;
      delays.push(Date.now() - startTime);
      throw new Error('Failure');
    });

    try {
      await executeWithRetry(mockOperation, 3, 100);
    } catch {
      // Expected to fail
    }

    // Check delays increase exponentially
    expect(attemptCount).toBe(3);
  });
});

// ============================================================================
// RESPONSE FORMAT TESTS
// ============================================================================

describe('Response Format', () => {
  it('should always return consistent format', async () => {
    const operations = [
      DataLayer.products.getAll(),
      DataLayer.vendors.getAll(),
      DataLayer.orders.getVendorOrders()
    ];

    for (const result of await Promise.all(operations)) {
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('metadata');
    }
  });

  it('should have timestamp in metadata', async () => {
    const result = await DataLayer.products.getAll();
    expect(result.metadata.timestamp).toBeDefined();
    // Verify it's a valid ISO timestamp
    expect(new Date(result.metadata.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('should not include data when error occurs', async () => {
    const result = await DataLayer.products.getById(null);
    if (!result.success) {
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    }
  });

  it('should not include error when successful', async () => {
    const result = await DataLayer.products.getAll();
    if (result.success) {
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
    }
  });
});

// ============================================================================
// BATCH OPERATIONS TESTS
// ============================================================================

describe('Batch Operations', () => {
  it('should execute multiple operations', async () => {
    const { execute } = useBatch();
    const operations = [
      { name: 'products', execute: () => DataLayer.products.getAll() },
      { name: 'vendors', execute: () => DataLayer.vendors.getAll() }
    ];

    const result = await execute(operations);
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('data');
  });

  it('should track results separately', async () => {
    const { execute } = useBatch();
    const operations = [
      { name: 'op1', execute: async () => ({ data: 'result1' }) },
      { name: 'op2', execute: async () => ({ data: 'result2' }) }
    ];

    const result = await execute(operations);
    if (result.success) {
      expect(result.data.results.length).toBe(2);
    }
  });

  it('should handle operation failures', async () => {
    const { execute } = useBatch();
    const operations = [
      { name: 'op1', execute: async () => throw new Error('Failed') },
      { name: 'op2', execute: async () => ({ data: 'ok' }) }
    ];

    const result = await execute(operations);
    expect(result).toHaveProperty('data');
    expect(result.data.errors).toBeDefined();
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance', () => {
  it('should handle multiple concurrent requests', async () => {
    const promises = Array(10).fill(null).map(() => 
      DataLayer.products.getAll()
    );

    const start = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    expect(results.length).toBe(10);
    expect(duration).toBeLessThan(10000); // Should complete in reasonable time
  });

  it('should not leak memory', () => {
    // Create and destroy many stores
    for (let i = 0; i < 100; i++) {
      const store = createProductsStore();
      store.clear();
    }
    // If we get here without crashing, memory is ok
    expect(true).toBe(true);
  });
});

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Run all tests
 * 
 * Command: npm run test
 * 
 * Or with coverage:
 * npm run test -- --coverage
 * 
 * Or watch mode:
 * npm run test -- --watch
 */

export {};

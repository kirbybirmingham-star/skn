/**
 * Example implementations of useDatabaseDebug hook
 * Shows how to integrate database debugging into your components
 */

import React, { useState } from 'react';
import { useDatabaseDebug } from '@/hooks/useDatabaseDebug';
import { useToast } from '@/components/ui/use-toast';

// ============================================================================
// EXAMPLE 1: Simple Form Update
// ============================================================================

export function ProductEditExample() {
  const db = useDatabaseDebug();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [productId, setProductId] = useState('');
  const [form, setForm] = useState({
    title: '',
    price: 0,
    description: ''
  });

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const updated = await db.update(
        'products',
        productId,
        {
          title: form.title.trim(),
          base_price: Number(form.price) || 0,
          description: form.description.trim()
        },
        {
          context: 'product-edit-form' // This helps identify where the operation came from
        }
      );

      toast({ title: 'Success', description: 'Product updated' });
      console.log('Updated product:', updated);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to update: ${error.message}`,
        variant: 'destructive'
      });
      // The error is also logged in the admin console at /admin
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        placeholder="Product Title"
      />
      <input
        type="number"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
        placeholder="Price in cents"
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Description"
      />
      <button onClick={handleUpdate} disabled={loading}>
        {loading ? 'Saving...' : 'Save Product'}
      </button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: With Before/After Comparison
// ============================================================================

export function ProductUpdateWithComparison() {
  const db = useDatabaseDebug();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  const handleUpdate = async (productId, changes) => {
    setLoading(true);
    try {
      // The hook will automatically capture before/after data
      const result = await db.update(
        'products',
        productId,
        changes,
        {
          context: `product-update-${productId}`,
          idField: 'id' // Which field is the primary key
        }
      );

      // Show the result
      setComparisonResult(result);
      toast({ title: 'Updated successfully' });

      // Go to /admin to see before/after comparison in the debug console
      console.log('Check /admin console for detailed before/after comparison');
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleUpdate('product-123', { title: 'New Title' })}>
        Update Product
      </button>
      {comparisonResult && (
        <div className="mt-4 p-4 bg-blue-50 rounded">
          <p>Updated! Go to <code>/admin</code> to see the before/after comparison</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Bulk Operations with Error Handling
// ============================================================================

export function BulkProductUpdate() {
  const db = useDatabaseDebug();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ success: 0, failed: 0, errors: [] });

  const handleBulkUpdate = async (productUpdates) => {
    setLoading(true);
    const localResults = { success: 0, failed: 0, errors: [] };

    for (const { productId, updates } of productUpdates) {
      try {
        await db.update(
          'products',
          productId,
          updates,
          {
            context: `bulk-update-${productId}`
          }
        );
        localResults.success++;
      } catch (error) {
        localResults.failed++;
        localResults.errors.push({
          productId,
          error: error.message
        });
      }
    }

    setResults(localResults);
    setLoading(false);

    toast({
      title: 'Bulk update complete',
      description: `${localResults.success} succeeded, ${localResults.failed} failed`
    });
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => handleBulkUpdate([
          { productId: 'p1', updates: { title: 'Product 1' } },
          { productId: 'p2', updates: { title: 'Product 2' } },
          { productId: 'p3', updates: { title: 'Product 3' } }
        ])}
        disabled={loading}
      >
        {loading ? 'Updating...' : 'Bulk Update'}
      </button>

      {results.success > 0 && (
        <div className="p-3 bg-green-100 rounded">
          ✅ {results.success} products updated
        </div>
      )}

      {results.errors.length > 0 && (
        <div className="p-3 bg-red-100 rounded">
          <p className="font-bold mb-2">❌ {results.failed} errors:</p>
          <ul className="list-disc ml-5">
            {results.errors.map((err, i) => (
              <li key={i}>{err.productId}: {err.error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Form with Validation and Debug Context
// ============================================================================

export function AdvancedFormExample() {
  const db = useDatabaseDebug();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    vendor_id: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!formData.name || formData.name.length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }
    if (!formData.email || !formData.email.includes('@')) {
      errors.email = 'Valid email required';
    }
    if (!formData.vendor_id) {
      errors.vendor_id = 'Vendor ID required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation failed',
        description: 'Please fix the errors above',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Create a detailed context string for debugging
      const context = `vendor-form-submit|${formData.vendor_id}`;

      const result = await db.insert(
        'vendor_contacts',
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          vendor_id: formData.vendor_id
        },
        { context }
      );

      toast({
        title: 'Success',
        description: 'Vendor contact created'
      });

      // Reset form
      setFormData({ name: '', email: '', vendor_id: '' });
      setValidationErrors({});

      return result;
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      console.error('Creation failed. Check /admin for details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label>Name</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={validationErrors.name ? 'border-red-500' : ''}
        />
        {validationErrors.name && <span className="text-red-500 text-sm">{validationErrors.name}</span>}
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className={validationErrors.email ? 'border-red-500' : ''}
        />
        {validationErrors.email && <span className="text-red-500 text-sm">{validationErrors.email}</span>}
      </div>

      <div>
        <label>Vendor ID</label>
        <input
          value={formData.vendor_id}
          onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
          className={validationErrors.vendor_id ? 'border-red-500' : ''}
        />
        {validationErrors.vendor_id && <span className="text-red-500 text-sm">{validationErrors.vendor_id}</span>}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Create Contact'}
      </button>

      <p className="text-xs text-gray-500">
        💡 All operations are logged. Go to /admin to see details.
      </p>
    </form>
  );
}

// ============================================================================
// EXAMPLE 5: Select with Filtering and Error Handling
// ============================================================================

export function LoadProductsExample() {
  const db = useDatabaseDebug();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [vendorId, setVendorId] = useState('');

  const loadProducts = async () => {
    if (!vendorId) {
      toast({
        title: 'Error',
        description: 'Please select a vendor',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const data = await db.select(
        'products',
        {
          context: `load-products-for-vendor-${vendorId}`,
          filters: [
            ['vendor_id', vendorId, 'eq']
          ],
          orderBy: ['created_at', true], // descending
          limit: 20,
          select: 'id, title, base_price, created_at'
        }
      );

      setProducts(data);
      toast({
        title: 'Loaded',
        description: `Loaded ${data.length} products`
      });
    } catch (error) {
      toast({
        title: 'Failed to load',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          placeholder="Vendor ID"
          value={vendorId}
          onChange={(e) => setVendorId(e.target.value)}
        />
        <button onClick={loadProducts} disabled={loading}>
          {loading ? 'Loading...' : 'Load Products'}
        </button>
      </div>

      {products.length > 0 && (
        <ul className="space-y-2">
          {products.map(p => (
            <li key={p.id} className="border p-2 rounded">
              <strong>{p.title}</strong> - ${p.base_price / 100}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// EXAMPLE 6: Delete with Confirmation and Logging
// ============================================================================

export function DeleteProductExample() {
  const db = useDatabaseDebug();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async (productId, productTitle) => {
    if (!confirm(`Delete "${productTitle}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);

    try {
      await db.delete(
        'products',
        productId,
        {
          context: `delete-product-${productId}`,
          idField: 'id'
        }
      );

      toast({
        title: 'Deleted',
        description: `"${productTitle}" has been deleted`
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={() => handleDelete('product-id-123', 'Sample Product')}
      disabled={loading}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      {loading ? 'Deleting...' : 'Delete Product'}
    </button>
  );
}

// ============================================================================
// EXAMPLE 7: Try-Catch with Detailed Error Info
// ============================================================================

export function RobustUpdateExample() {
  const db = useDatabaseDebug();
  const { toast } = useToast();

  const handleSave = async (productId, updates) => {
    try {
      const result = await db.update(
        'products',
        productId,
        updates,
        {
          context: `robust-update-${productId}`
        }
      );

      // All good!
      toast({ title: 'Success', description: 'Product saved' });
      return result;

    } catch (error) {
      // Detailed error handling
      const errorMessage = error.message || 'Unknown error';

      if (errorMessage.includes('permission')) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to edit this product',
          variant: 'destructive'
        });
      } else if (errorMessage.includes('not found')) {
        toast({
          title: 'Not Found',
          description: 'This product no longer exists',
          variant: 'destructive'
        });
      } else if (errorMessage.includes('400')) {
        toast({
          title: 'Bad Request',
          description: 'There\'s an issue with the data. Check /admin for details',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }

      // Log for debugging
      console.error('Update failed:', {
        productId,
        error: error.message,
        checkAdmin: 'Go to /admin to see the full payload and error'
      });

      throw error; // Re-throw if needed
    }
  };

  return (
    <button onClick={() => handleSave('p123', { title: 'New Title' })}>
      Save with Error Handling
    </button>
  );
}

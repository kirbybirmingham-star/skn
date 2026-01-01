import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  getVendorInventory,
  updateVariantQuantity,
  bulkUpdateInventory,
  getInventorySettings,
  updateInventorySettings
} from '../../api/inventoryApi';
// import { toast } from '../../hooks/use-toast';

export default function InventoryManager({ vendorId }) {
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [settings, setSettings] = useState(null);
  const [editingQuantities, setEditingQuantities] = useState({});
  const [bulkUpdates, setBulkUpdates] = useState([]);

  useEffect(() => {
    if (vendorId) {
      loadInventory();
      loadSettings();
    }
  }, [vendorId, searchTerm, showLowStockOnly]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await getVendorInventory(vendorId, {
        search: searchTerm,
        lowStock: showLowStockOnly,
        page: 1,
        perPage: 50
      });
      setInventory(data.variants || []);
      setAlerts(data.alerts || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Failed to load inventory:', error);
      console.error('Failed to load inventory:', error);
      alert('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await getInventorySettings(vendorId);
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleQuantityUpdate = async (variantId, newQuantity, reason = 'Manual adjustment') => {
    try {
      const result = await updateVariantQuantity(variantId, parseInt(newQuantity), reason);

      // Update local state
      setInventory(prev => prev.map(item =>
        item.id === variantId
          ? { ...item, inventory_quantity: result.new_quantity }
          : item
      ));

      alert(`Inventory updated: ${result.old_quantity} → ${result.new_quantity}`);

      // Clear editing state
      setEditingQuantities(prev => ({ ...prev, [variantId]: false }));
    } catch (error) {
      console.error('Failed to update quantity:', error);
      alert('Failed to update inventory quantity');
    }
  };

  const handleBulkUpdate = async () => {
    if (bulkUpdates.length === 0) return;

    try {
      const result = await bulkUpdateInventory(bulkUpdates);

      alert(`Updated ${result.success_count} items, ${result.error_count} failed`);

      // Reload inventory
      loadInventory();
      setBulkUpdates([]);
    } catch (error) {
      console.error('Failed to bulk update:', error);
      alert('Bulk update failed');
    }
  };

  const addToBulkUpdate = (variantId, quantity) => {
    const existingIndex = bulkUpdates.findIndex(u => u.variantId === variantId);
    if (existingIndex >= 0) {
      setBulkUpdates(prev => prev.map((u, i) =>
        i === existingIndex ? { ...u, quantity: parseInt(quantity) } : u
      ));
    } else {
      setBulkUpdates(prev => [...prev, { variantId, quantity: parseInt(quantity) }]);
    }
  };

  const getStockStatus = (quantity) => {
    if (!settings) return 'normal';

    if (quantity === 0) return 'out-of-stock';
    if (quantity <= settings.low_stock_threshold) return 'low-stock';
    return 'in-stock';
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'out-of-stock': return 'text-red-600';
      case 'low-stock': return 'text-orange-600';
      case 'in-stock': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory Management</h2>
          <p className="text-gray-600">Track and manage your product stock levels</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showLowStockOnly ? "default" : "outline"}
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
          >
            Low Stock Only
          </Button>
          {bulkUpdates.length > 0 && (
            <Button onClick={handleBulkUpdate}>
              Update {bulkUpdates.length} Items
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Alerts Summary */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stock Alerts</CardTitle>
            <CardDescription>{alerts.length} items need attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {alerts.filter(a => a.alert_type === 'out_of_stock').length}
                </div>
                <div className="text-sm text-gray-600">Out of Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {alerts.filter(a => a.alert_type === 'low_stock').length}
                </div>
                <div className="text-sm text-gray-600">Low Stock</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {alerts.filter(a => a.alert_type === 'threshold_reached').length}
                </div>
                <div className="text-sm text-gray-600">At Threshold</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>
            {pagination.total || 0} products • Page {pagination.page || 1} of {Math.ceil((pagination.total || 0) / (pagination.perPage || 50))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Product</th>
                  <th className="text-left p-3">Variant</th>
                  <th className="text-left p-3">SKU</th>
                  <th className="text-center p-3">Current Stock</th>
                  <th className="text-center p-3">Status</th>
                  <th className="text-center p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const stockStatus = getStockStatus(item.inventory_quantity);
                  const isEditing = editingQuantities[item.id];
                  const inBulkUpdate = bulkUpdates.some(u => u.variantId === item.id);

                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{item.product_title || 'Unknown Product'}</div>
                        <div className="text-sm text-gray-500">{item.product_category || 'Uncategorized'}</div>
                      </td>
                      <td className="p-3">
                        <div>{item.title || 'Default'}</div>
                        {item.attributes && Object.keys(item.attributes).length > 0 && (
                          <div className="text-sm text-gray-500">
                            {Object.entries(item.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="p-3">{item.sku || '-'}</td>
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <Input
                            type="number"
                            defaultValue={item.inventory_quantity}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleQuantityUpdate(item.id, e.target.value);
                              } else if (e.key === 'Escape') {
                                setEditingQuantities(prev => ({ ...prev, [item.id]: false }));
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value !== item.inventory_quantity.toString()) {
                                handleQuantityUpdate(item.id, e.target.value);
                              } else {
                                setEditingQuantities(prev => ({ ...prev, [item.id]: false }));
                              }
                            }}
                            className="w-20 text-center"
                            min="0"
                          />
                        ) : (
                          <span className={`font-medium ${getStockStatusColor(stockStatus)}`}>
                            {item.inventory_quantity}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStockStatusColor(stockStatus)} bg-opacity-10`}>
                          {stockStatus.replace('-', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingQuantities(prev => ({ ...prev, [item.id]: !isEditing }))}
                          >
                            {isEditing ? 'Cancel' : 'Edit'}
                          </Button>
                          <Button
                            size="sm"
                            variant={inBulkUpdate ? "default" : "outline"}
                            onClick={() => {
                              if (inBulkUpdate) {
                                setBulkUpdates(prev => prev.filter(u => u.variantId !== item.id));
                              } else {
                                addToBulkUpdate(item.id, item.inventory_quantity);
                              }
                            }}
                          >
                            {inBulkUpdate ? 'Remove' : 'Bulk'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {inventory.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      {searchTerm || showLowStockOnly ? 'No products match your filters' : 'No inventory items found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
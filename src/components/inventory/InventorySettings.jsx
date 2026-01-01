import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Switch } from '../ui/switch';
import {
  getInventorySettings,
  updateInventorySettings
} from '../../api/inventoryApi';
// import { toast } from '../../hooks/use-toast';

export default function InventorySettings({ vendorId }) {
  const [settings, setSettings] = useState({
    low_stock_threshold: 5,
    auto_create_alerts: true,
    track_inventory: true,
    allow_negative_stock: false,
    default_adjustment_reason: 'Manual adjustment'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vendorId) {
      loadSettings();
    }
  }, [vendorId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getInventorySettings(vendorId);
      setSettings(data.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      console.error('Failed to load settings:', error);
      alert('Failed to load inventory settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateInventorySettings(vendorId, settings);

      alert('Inventory settings updated successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to update inventory settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Inventory Settings</h2>
        <p className="text-gray-600">Configure how inventory is tracked and managed</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Basic inventory configuration for your store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="track-inventory">Track Inventory</Label>
              <p className="text-sm text-gray-600">
                Enable inventory tracking for all products
              </p>
            </div>
            <Switch
              id="track-inventory"
              checked={settings.track_inventory}
              onCheckedChange={(checked) => handleInputChange('track_inventory', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-alerts">Auto-Create Alerts</Label>
              <p className="text-sm text-gray-600">
                Automatically create alerts when stock is low or out
              </p>
            </div>
            <Switch
              id="auto-alerts"
              checked={settings.auto_create_alerts}
              onCheckedChange={(checked) => handleInputChange('auto_create_alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="negative-stock">Allow Negative Stock</Label>
              <p className="text-sm text-gray-600">
                Allow inventory quantities to go below zero
              </p>
            </div>
            <Switch
              id="negative-stock"
              checked={settings.allow_negative_stock}
              onCheckedChange={(checked) => handleInputChange('allow_negative_stock', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Thresholds</CardTitle>
          <CardDescription>
            Set thresholds for low stock alerts and notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
              <Input
                id="low-stock-threshold"
                type="number"
                min="0"
                value={settings.low_stock_threshold}
                onChange={(e) => handleInputChange('low_stock_threshold', parseInt(e.target.value) || 0)}
                placeholder="5"
              />
              <p className="text-sm text-gray-600">
                Alert when stock falls at or below this number
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Values</CardTitle>
          <CardDescription>
            Set default values for inventory operations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-reason">Default Adjustment Reason</Label>
            <Input
              id="default-reason"
              value={settings.default_adjustment_reason}
              onChange={(e) => handleInputChange('default_adjustment_reason', e.target.value)}
              placeholder="Manual adjustment"
            />
            <p className="text-sm text-gray-600">
              Default reason used when adjusting inventory manually
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
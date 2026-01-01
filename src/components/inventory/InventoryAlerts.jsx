import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { getInventoryAlerts } from '../../api/inventoryApi';
// import { toast } from '../../hooks/use-toast';
import { AlertTriangle, Package, TrendingDown } from 'lucide-react';

export default function InventoryAlerts({ vendorId }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendorId) {
      loadAlerts();
    }
  }, [vendorId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getInventoryAlerts(vendorId);
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
      console.error('Failed to load alerts:', error);
      alert('Failed to load inventory alerts');
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'out_of_stock':
        return <Package className="h-5 w-5 text-red-500" />;
      case 'low_stock':
        return <TrendingDown className="h-5 w-5 text-orange-500" />;
      case 'threshold_reached':
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getAlertColor = (alertType) => {
    switch (alertType) {
      case 'out_of_stock':
        return 'destructive';
      case 'low_stock':
        return 'warning';
      case 'threshold_reached':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getAlertTitle = (alertType) => {
    switch (alertType) {
      case 'out_of_stock':
        return 'Out of Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'threshold_reached':
        return 'At Threshold';
      default:
        return 'Alert';
    }
  };

  const formatAlertType = (alertType) => {
    return alertType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading alerts...</div>;
  }

  const activeAlerts = alerts.filter(alert => alert.is_active);
  const groupedAlerts = activeAlerts.reduce((acc, alert) => {
    const type = alert.alert_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(alert);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory Alerts</h2>
          <p className="text-gray-600">Monitor stock levels and take action</p>
        </div>
        <Button onClick={loadAlerts} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Package className="h-8 w-8 text-red-500 mr-4" />
            <div>
              <div className="text-2xl font-bold text-red-600">
                {groupedAlerts.out_of_stock?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Out of Stock</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingDown className="h-8 w-8 text-orange-500 mr-4" />
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {groupedAlerts.low_stock?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Low Stock</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <AlertTriangle className="h-8 w-8 text-blue-500 mr-4" />
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {groupedAlerts.threshold_reached?.length || 0}
              </div>
              <div className="text-sm text-gray-600">At Threshold</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Details */}
      {activeAlerts.length === 0 ? (
        <Card>
          <CardContent className="text-center p-8">
            <div className="text-gray-500">No active alerts</div>
            <div className="text-sm text-gray-400 mt-2">
              All products are sufficiently stocked
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedAlerts).map(([alertType, typeAlerts]) => (
            <Card key={alertType}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getAlertIcon(alertType)}
                  {getAlertTitle(alertType)}
                  <Badge variant={getAlertColor(alertType)}>
                    {typeAlerts.length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Products requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {typeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {alert.product_variants?.products?.title || 'Unknown Product'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {alert.product_variants?.title || 'Default Variant'}
                          {alert.product_variants?.sku && (
                            <span className="ml-2 text-gray-500">
                              • SKU: {alert.product_variants.sku}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Current stock: {alert.current_quantity}
                          {alert.threshold_quantity && (
                            <span> • Threshold: {alert.threshold_quantity}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                        <Button size="sm">
                          Update Stock
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Resolved Alerts */}
      {alerts.filter(alert => !alert.is_active).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Resolved</CardTitle>
            <CardDescription>
              Alerts that have been addressed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts
                .filter(alert => !alert.is_active)
                .slice(0, 5)
                .map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-2 text-sm text-gray-600"
                  >
                    <span>
                      {alert.product_variants?.products?.title || 'Unknown Product'} - {formatAlertType(alert.alert_type)}
                    </span>
                    <span className="text-xs">
                      {new Date(alert.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
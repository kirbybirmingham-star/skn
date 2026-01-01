import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

const VendorOrderCard = ({ order, isSelected, onSelect, onFulfill, onUpdate }) => {
  const formatCurrency = (amount) => `$${(amount / 100).toFixed(2)}`;

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'processing': return 'default';
      case 'packed': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'outline';
    }
  };

  const canFulfill = ['confirmed', 'processing'].includes(order.order_status);
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.order_status);

  const handleStatusUpdate = async (newStatus, additionalData = {}) => {
    try {
      const response = await fetch(`/api/vendor/orders/${order.id}/${newStatus === 'cancelled' ? 'cancel' : 'fulfill'}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('@/contexts/SupabaseAuthContext')).useAuth().user?.access_token || ''}`
        },
        body: JSON.stringify({
          reason: additionalData.reason || `Order ${newStatus} by vendor`,
          tracking_number: additionalData.tracking_number,
          carrier: additionalData.carrier,
          notes: additionalData.notes
        })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        onUpdate(updatedOrder.order);
      } else {
        throw new Error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      // You could show a toast here
    }
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(order.id, checked)}
            />
            <div>
              <h3 className="font-semibold text-lg">Order #{order.id.slice(-8)}</h3>
              <p className="text-sm text-gray-600">
                {format(new Date(order.order_date), 'MMM dd, yyyy • hh:mm a')}
              </p>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant(order.order_status)}>
            {order.order_status.charAt(0).toUpperCase() + order.order_status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Customer and Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Customer</h4>
              <p className="text-sm">{order.customer_name || 'N/A'}</p>
              <p className="text-xs text-gray-600">{order.customer_email || ''}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Product</h4>
              <p className="text-sm font-medium">{order.product_title}</p>
              <p className="text-xs text-gray-600">
                Qty: {order.quantity} × {formatCurrency(order.unit_price)}
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-sm text-gray-600">
              <span>Total: </span>
              <span className="font-semibold">{formatCurrency(order.total_price)}</span>
            </div>
            <div className="flex gap-2">
              {canFulfill && (
                <Button
                  size="sm"
                  onClick={() => onFulfill(order)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Fulfill Order
                </Button>
              )}
              {canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusUpdate('cancelled', {
                    reason: 'Cancelled by vendor'
                  })}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Cancel
                </Button>
              )}
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </div>

          {/* Tracking Info */}
          {order.tracking_number && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tracking</span>
                <span className="text-sm text-gray-600">
                  {order.tracking_number}
                </span>
              </div>
              {order.shipping_carrier && (
                <p className="text-xs text-gray-500 mt-1">
                  Carrier: {order.shipping_carrier}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VendorOrderCard;
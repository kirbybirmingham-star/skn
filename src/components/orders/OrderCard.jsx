import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Status color mapping
const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  packed: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-green-100 text-green-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800'
};

const STATUS_DISPLAY_NAMES = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded'
};

const OrderCard = ({ order, onViewDetails }) => {
  const formatCurrency = (amount) => `$${(amount / 100).toFixed(2)}`;

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const getOrderItemCount = () => {
    return order.order_items?.length || 0;
  };

  const getStatusColor = (status) => {
    return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplayName = (status) => {
    return STATUS_DISPLAY_NAMES[status] || status;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg">Order #{order.id.slice(-8)}</h3>
            <p className="text-sm text-gray-600">
              {formatDate(order.created_at)}
            </p>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {getStatusDisplayName(order.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Order Items Summary */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {getOrderItemCount()} item{getOrderItemCount() !== 1 ? 's' : ''}
            </span>
            <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
          </div>

          {/* Order Items Preview */}
          <div className="space-y-2">
            {order.order_items?.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  {item.products?.images?.[0] ? (
                    <img
                      src={item.products.images[0]}
                      alt={item.products.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gray-300 rounded" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.products?.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                  </p>
                </div>
              </div>
            ))}
            {order.order_items?.length > 2 && (
              <p className="text-xs text-gray-500 text-center">
                +{order.order_items.length - 2} more items
              </p>
            )}
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
                  {order.shipping_carrier}
                </p>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={() => onViewDetails(order.id)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Truck, Package, XCircle, RefreshCw } from 'lucide-react';

// Status icons mapping
const STATUS_ICONS = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  packed: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
  refunded: RefreshCw
};

// Status colors mapping
const STATUS_COLORS = {
  pending: 'text-yellow-500',
  confirmed: 'text-blue-500',
  processing: 'text-purple-500',
  packed: 'text-indigo-500',
  shipped: 'text-green-500',
  delivered: 'text-emerald-500',
  cancelled: 'text-red-500',
  refunded: 'text-gray-500'
};

// Status display names
const STATUS_DISPLAY_NAMES = {
  pending: 'Order Placed',
  confirmed: 'Order Confirmed',
  processing: 'Processing Order',
  packed: 'Order Packed',
  shipped: 'Order Shipped',
  delivered: 'Order Delivered',
  cancelled: 'Order Cancelled',
  refunded: 'Order Refunded'
};

const OrderStatusTimeline = ({ orderId, timeline = [], currentStatus, isLoading = false }) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy hh:mm a');
    } catch {
      return dateString;
    }
  };

  const getStatusIcon = (status) => {
    const IconComponent = STATUS_ICONS[status] || Clock;
    const colorClass = STATUS_COLORS[status] || 'text-gray-500';
    return <IconComponent className={`w-5 h-5 ${colorClass}`} />;
  };

  const getStatusBadgeVariant = (status) => {
    const variants = {
      pending: 'secondary',
      confirmed: 'default',
      processing: 'secondary',
      packed: 'secondary',
      shipped: 'default',
      delivered: 'default',
      cancelled: 'destructive',
      refunded: 'secondary'
    };
    return variants[status] || 'secondary';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort timeline by timestamp
  const sortedTimeline = [...timeline].sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Add current status if not in timeline
  if (currentStatus && !sortedTimeline.some(item => item.status === 'current')) {
    const currentStatusItem = {
      id: 'current_status',
      type: 'status',
      title: STATUS_DISPLAY_NAMES[currentStatus] || currentStatus,
      description: `Order is currently ${currentStatus}`,
      timestamp: new Date().toISOString(),
      status: 'current',
      icon: currentStatus
    };
    sortedTimeline.push(currentStatusItem);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Order Timeline</span>
          {currentStatus && (
            <Badge variant={getStatusBadgeVariant(currentStatus)}>
              {STATUS_DISPLAY_NAMES[currentStatus] || currentStatus}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedTimeline.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No timeline events available</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-6">
              {sortedTimeline.map((event, index) => (
                <div key={event.id || index} className="relative flex items-start space-x-4">
                  {/* Timeline dot */}
                  <div className={`
                    relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow-md
                    ${event.status === 'completed' || event.status === 'current'
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                    }
                  `}>
                    {getStatusIcon(event.icon || event.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {event.title}
                        </h4>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {event.description}
                          </p>
                        )}
                        {event.tracking && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Tracking Number</span>
                              <span className="text-sm font-mono">{event.tracking.number}</span>
                            </div>
                            {event.tracking.carrier && (
                              <p className="text-xs text-gray-500 mt-1">
                                Carrier: {event.tracking.carrier}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <time className="text-sm text-gray-500">
                          {formatDate(event.timestamp)}
                        </time>
                        {event.user && (
                          <p className="text-xs text-gray-400 mt-1">
                            by {event.user}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Additional metadata */}
                    {event.metadata && (
                      <div className="mt-2 text-xs text-gray-500">
                        {event.metadata.change_reason && (
                          <p>Reason: {event.metadata.change_reason}</p>
                        )}
                        {event.metadata.notes && (
                          <p>Notes: {event.metadata.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderStatusTimeline;
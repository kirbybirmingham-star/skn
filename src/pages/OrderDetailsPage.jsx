import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../contexts/SupabaseAuthContext';
import OrderStatusTimeline from '../components/orders/OrderStatusTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Package, Truck, MapPin, CreditCard, RefreshCw } from 'lucide-react';

// Mock API calls - will be replaced with actual API integration
const mockFetchOrderDetails = async (orderId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock detailed order data
  const mockOrder = {
    id: orderId,
    status: 'shipped',
    total_amount: 12999, // $129.99
    created_at: '2024-11-10T14:30:00Z',
    updated_at: '2024-11-12T09:15:00Z',
    shipping_address: {
      first_name: 'John',
      last_name: 'Doe',
      street_address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94105',
      country: 'US'
    },
    billing_address: {
      first_name: 'John',
      last_name: 'Doe',
      street_address: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94105',
      country: 'US'
    },
    tracking_number: 'TRK123456789',
    shipping_carrier: 'UPS',
    paypal_order_id: 'PAY123456789',
    order_items: [
      {
        id: 'item_1',
        quantity: 2,
        unit_price: 6499, // $64.99 each
        total_price: 12998,
        products: {
          id: 'prod_1',
          title: 'Premium Wireless Headphones',
          description: 'High-quality wireless headphones with noise cancellation',
          images: ['https://via.placeholder.com/200'],
          vendors: {
            name: 'TechAudio Inc.'
          }
        },
        product_variants: {
          sku: 'WH-100-BLK',
          variant_name: 'Black'
        }
      }
    ]
  };

  return { order: mockOrder };
};

const mockFetchOrderTimeline = async (orderId) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const mockTimeline = [
    {
      id: 'timeline_1',
      type: 'order',
      title: 'Order Placed',
      description: 'Your order has been received and is being processed',
      timestamp: '2024-11-10T14:30:00Z',
      status: 'completed',
      icon: 'shopping-cart'
    },
    {
      id: 'timeline_2',
      type: 'status',
      title: 'Order Confirmed',
      description: 'Your order has been confirmed and payment processed',
      timestamp: '2024-11-10T14:35:00Z',
      status: 'completed',
      icon: 'check-circle'
    },
    {
      id: 'timeline_3',
      type: 'status',
      title: 'Processing Order',
      description: 'We are preparing your items for shipment',
      timestamp: '2024-11-11T10:00:00Z',
      status: 'completed',
      icon: 'cog'
    },
    {
      id: 'timeline_4',
      type: 'status',
      title: 'Order Packed',
      description: 'Your order has been packed and is ready for shipping',
      timestamp: '2024-11-11T14:00:00Z',
      status: 'completed',
      icon: 'package'
    },
    {
      id: 'timeline_5',
      type: 'status',
      title: 'Order Shipped',
      description: 'Your order is on its way',
      timestamp: '2024-11-12T09:15:00Z',
      status: 'current',
      icon: 'truck',
      tracking: {
        number: 'TRK123456789',
        carrier: 'UPS'
      }
    }
  ];

  return { timeline: mockTimeline };
};

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCurrency = (amount) => `$${(amount / 100).toFixed(2)}`;
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy hh:mm a');
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      packed: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-green-100 text-green-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusDisplayName = (status) => {
    const names = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      packed: 'Packed',
      shipped: 'Shipped',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    };
    return names[status] || status;
  };

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await mockFetchOrderDetails(orderId);
      setOrder(response.order);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load order details. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderTimeline = async () => {
    try {
      setTimelineLoading(true);
      const response = await mockFetchOrderTimeline(orderId);
      setTimeline(response.timeline);
    } catch (err) {
      console.error('Error fetching order timeline:', err);
      // Don't show error for timeline, just leave it empty
    } finally {
      setTimelineLoading(false);
    }
  };

  useEffect(() => {
    if (user && orderId) {
      fetchOrderDetails();
      fetchOrderTimeline();
    }
  }, [user, orderId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
              <p className="text-gray-600 mb-4">
                You need to be signed in to view order details.
              </p>
              <Button onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
              <p className="text-gray-600 mb-4">
                {error || 'The order you\'re looking for doesn\'t exist or you don\'t have permission to view it.'}
              </p>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => navigate('/orders')}>
                  Back to Orders
                </Button>
                <Button onClick={fetchOrderDetails}>
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/orders')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Orders
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                <p className="text-sm text-gray-600">Order #{order.id.slice(-8)}</p>
              </div>
            </div>
            <Badge className={getStatusColor(order.status)}>
              {getStatusDisplayName(order.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Order Details - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Order Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.products?.images?.[0] ? (
                        <img
                          src={item.products.images[0]}
                          alt={item.products.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {item.products?.title}
                      </h4>
                      {item.product_variants?.variant_name && (
                        <p className="text-sm text-gray-600">
                          Variant: {item.product_variants.variant_name}
                        </p>
                      )}
                      {item.product_variants?.sku && (
                        <p className="text-xs text-gray-500">
                          SKU: {item.product_variants.sku}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">
                          Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.total_price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shipping & Billing Addresses */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Truck className="w-5 h-5 mr-2" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                    </p>
                    <p>{order.shipping_address?.street_address}</p>
                    <p>
                      {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}
                    </p>
                    <p>{order.shipping_address?.country}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Billing Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p className="font-medium">
                      {order.billing_address?.first_name} {order.billing_address?.last_name}
                    </p>
                    <p>{order.billing_address?.street_address}</p>
                    <p>
                      {order.billing_address?.city}, {order.billing_address?.state} {order.billing_address?.postal_code}
                    </p>
                    <p>{order.billing_address?.country}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Timeline */}
            <OrderStatusTimeline
              orderId={order.id}
              timeline={timeline}
              currentStatus={order.status}
              isLoading={timelineLoading}
            />
          </div>

          {/* Order Summary - Right Column */}
          <div className="space-y-6">
            {/* Order Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order Date</span>
                  <span className="text-sm font-medium">{formatDate(order.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium">{formatDate(order.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Items</span>
                  <span className="text-sm font-medium">
                    {order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                  </span>
                </div>
                {order.tracking_number && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Tracking</span>
                    <span className="text-sm font-medium font-mono">{order.tracking_number}</span>
                  </div>
                )}
                {order.paypal_order_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Payment ID</span>
                    <span className="text-sm font-medium font-mono">{order.paypal_order_id.slice(-8)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.print()}
                >
                  Print Order
                </Button>
                {order.status === 'delivered' && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "Return request functionality will be available soon."
                      });
                    }}
                  >
                    Request Return
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/support')}
                >
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
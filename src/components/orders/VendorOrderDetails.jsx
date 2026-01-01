import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  User,
  Mail,
  Phone,
  CreditCard,
  FileText,
  MessageSquare
} from 'lucide-react';

const VendorOrderDetails = ({ orderId, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      fetchOrderTimeline();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/vendor/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        throw new Error('Failed to fetch order details');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load order details."
      });
    }
  };

  const fetchOrderTimeline = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}/timeline`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline || []);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getTimelineIcon = (type) => {
    switch (type) {
      case 'order': return <Package className="h-4 w-4" />;
      case 'status': return <Clock className="h-4 w-4" />;
      case 'shipping': return <Truck className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Order not found or access denied.</p>
        <Button onClick={onClose} className="mt-4">
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.id.slice(-8)}</h1>
          <p className="text-gray-600 mt-1">
            Placed on {format(new Date(order.created_at), 'MMMM dd, yyyy • hh:mm a')}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={getStatusBadgeVariant(order.status)} className="text-sm">
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
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
                  <div className="flex-1">
                    <h3 className="font-medium">{item.products?.title}</h3>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                    </p>
                    {item.product_variants?.variant_name && (
                      <p className="text-xs text-gray-500">
                        Variant: {item.product_variants.variant_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipping & Billing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="font-medium">{order.shipping_address?.full_name}</p>
                  <p className="text-sm">{order.shipping_address?.street_address}</p>
                  <p className="text-sm">
                    {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}
                  </p>
                  <p className="text-sm">{order.shipping_address?.country}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Payment ID:</span> {order.paypal_capture_id || 'N/A'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Order ID:</span> {order.paypal_order_id || 'N/A'}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Amount:</span> {formatCurrency(order.total_amount)}
                  </p>
                  <Badge variant="default" className="mt-2">
                    Paid via PayPal
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fulfillment Notes */}
          {order.fulfillment_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Fulfillment Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{order.fulfillment_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {order.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{order.profiles?.full_name || 'Unknown'}</p>
                  <p className="text-sm text-gray-600">{order.profiles?.email || 'No email'}</p>
                </div>
              </div>

              {order.profiles?.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  <span>{order.profiles.phone}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking Info */}
          {order.tracking_number && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Tracking Number</p>
                  <p className="text-sm text-gray-600">{order.tracking_number}</p>
                </div>

                {order.shipping_carrier && (
                  <div>
                    <p className="text-sm font-medium">Carrier</p>
                    <p className="text-sm text-gray-600">{order.shipping_carrier}</p>
                  </div>
                )}

                {order.estimated_delivery && (
                  <div>
                    <p className="text-sm font-medium">Estimated Delivery</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(order.estimated_delivery), 'MMM dd, yyyy')}
                    </p>
                  </div>
                )}

                {order.shipped_at && (
                  <div>
                    <p className="text-sm font-medium">Shipped On</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(order.shipped_at), 'MMM dd, yyyy • hh:mm a')}
                    </p>
                  </div>
                )}

                {order.delivered_at && (
                  <div>
                    <p className="text-sm font-medium">Delivered On</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(order.delivered_at), 'MMM dd, yyyy • hh:mm a')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={event.id || index} className="flex gap-3">
                    <div className={`mt-1 p-1 rounded-full ${
                      event.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {getTimelineIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-gray-600">{event.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(event.timestamp), 'MMM dd, hh:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorOrderDetails;
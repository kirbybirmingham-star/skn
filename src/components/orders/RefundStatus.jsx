import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { EcommerceApi } from '@/api/EcommerceApi';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    label: 'Pending Review'
  },
  approved: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    label: 'Approved'
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Rejected'
  },
  processed: {
    icon: RefreshCw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Processed'
  }
};

const RefundStatus = ({ orderId, onRefresh }) => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (orderId) {
      loadRefunds();
    }
  }, [orderId]);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await EcommerceApi.getRefunds();
      const orderRefunds = data.refunds?.filter(r => r.order_id === orderId) || [];
      setRefunds(orderRefunds);
    } catch (err) {
      setError('Failed to load refund information');
      console.error('Error loading refunds:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `$${(amount / 100).toFixed(2)}`;

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading refund status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (refunds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            No Refund Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            There are no refund requests for this order.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {refunds.map((refund) => {
        const config = getStatusConfig(refund.status);
        const StatusIcon = config.icon;

        return (
          <Card key={refund.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${config.bgColor}`}>
                    <StatusIcon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{config.label}</CardTitle>
                    <p className="text-sm text-gray-600">
                      Requested {format(new Date(refund.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  ID: {refund.id.slice(-8)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Refund Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Requested Amount
                  </Label>
                  <p className="text-lg font-semibold">{formatCurrency(refund.amount_requested)}</p>
                </div>

                {refund.amount_approved && (
                  <div>
                    <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Approved Amount
                    </Label>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(refund.amount_approved)}
                    </p>
                  </div>
                )}

                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Status Updated
                  </Label>
                  <p className="text-sm">
                    {refund.updated_at ? format(new Date(refund.updated_at), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Reason for Refund
                </Label>
                <p className="mt-1 text-sm">{refund.reason}</p>
              </div>

              {/* Refund Items */}
              {refund.refund_items && refund.refund_items.length > 0 && (
                <div>
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                    Refund Items
                  </Label>
                  <div className="space-y-2">
                    {refund.refund_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">Qty: {item.quantity}</span>
                          <span className="text-sm">
                            {item.order_items?.products?.title || 'Product'}
                          </span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processing Information */}
              {refund.paypal_refund_id && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <RefreshCw className="w-4 h-4 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Payment Processed</p>
                      <p className="text-xs text-blue-700">
                        PayPal Refund ID: {refund.paypal_refund_id}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {refund.notes && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <Label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Admin Notes
                  </Label>
                  <p className="mt-1 text-sm">{refund.notes}</p>
                </div>
              )}

              {/* Status-specific messages */}
              {refund.status === 'pending' && (
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <div className="flex items-start">
                    <Clock className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Under Review</p>
                      <p className="text-sm text-yellow-700">
                        Your refund request is being reviewed. We'll notify you once a decision is made.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {refund.status === 'approved' && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Refund Approved</p>
                      <p className="text-sm text-green-700">
                        Your refund has been approved and will be processed shortly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {refund.status === 'rejected' && (
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="flex items-start">
                    <XCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Refund Rejected</p>
                      <p className="text-sm text-red-700">
                        Unfortunately, your refund request has been rejected.
                        {refund.notes && ' Please check the notes above for more details.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {refund.status === 'processed' && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <RefreshCw className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Refund Processed</p>
                      <p className="text-sm text-blue-700">
                        Your refund has been successfully processed. The amount should appear in your account within 3-5 business days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Refresh Button */}
              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={loadRefunds}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Status
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Helper component for labels
const Label = ({ children, className = '', ...props }) => (
  <div className={`font-medium ${className}`} {...props}>
    {children}
  </div>
);

export default RefundStatus;
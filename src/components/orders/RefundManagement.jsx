import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { EcommerceApi } from '@/api/EcommerceApi';
import { format } from 'date-fns';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  processed: 'bg-blue-100 text-blue-800'
};

const RefundManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [approvalData, setApprovalData] = useState({
    approved: false,
    amount_approved: '',
    notes: ''
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const data = await EcommerceApi.getRefunds();
      setRefunds(data.refunds || []);
    } catch (error) {
      console.error('Error loading refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (refundId, approved) => {
    setProcessingId(refundId);
    try {
      const data = {
        approved,
        amount_approved: approved ? approvalData.amount_approved : null,
        notes: approvalData.notes
      };

      await EcommerceApi.approveRefund(refundId, data);
      await loadRefunds();
      setShowProcessDialog(false);
      setSelectedRefund(null);
      setApprovalData({ approved: false, amount_approved: '', notes: '' });
    } catch (error) {
      console.error('Error processing refund:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleProcessRefund = async (refundId) => {
    setProcessingId(refundId);
    try {
      await EcommerceApi.processRefund(refundId);
      await loadRefunds();
    } catch (error) {
      console.error('Error processing PayPal refund:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRefunds = refunds.filter(refund => {
    const matchesStatus = !statusFilter || refund.status === statusFilter;
    const matchesSearch = !searchTerm ||
      refund.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatCurrency = (amount) => `$${(amount / 100).toFixed(2)}`;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'processed': return <DollarSign className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Refund Management</h2>
        <Button onClick={loadRefunds} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by order ID or reason..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', count: refunds.length, color: 'bg-gray-100' },
          { label: 'Pending', count: refunds.filter(r => r.status === 'pending').length, color: 'bg-yellow-100' },
          { label: 'Approved', count: refunds.filter(r => r.status === 'approved').length, color: 'bg-green-100' },
          { label: 'Processed', count: refunds.filter(r => r.status === 'processed').length, color: 'bg-blue-100' }
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stat.color}`}>
                {stat.label}
              </div>
              <div className="text-2xl font-bold mt-2">{stat.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Refund List */}
      <div className="space-y-4">
        {filteredRefunds.map((refund) => (
          <Card key={refund.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    Order #{refund.order_id.slice(-8)}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(refund.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <Badge className={`${STATUS_COLORS[refund.status]} flex items-center gap-1`}>
                  {getStatusIcon(refund.status)}
                  {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-xs font-medium text-gray-500">REQUESTED AMOUNT</Label>
                  <p className="font-semibold">{formatCurrency(refund.amount_requested)}</p>
                </div>
                {refund.amount_approved && (
                  <div>
                    <Label className="text-xs font-medium text-gray-500">APPROVED AMOUNT</Label>
                    <p className="font-semibold text-green-600">{formatCurrency(refund.amount_approved)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-xs font-medium text-gray-500">REASON</Label>
                  <p className="text-sm">{refund.reason}</p>
                </div>
              </div>

              {/* Order Items */}
              {refund.refund_items && refund.refund_items.length > 0 && (
                <div className="mb-4">
                  <Label className="text-xs font-medium text-gray-500 mb-2 block">REFUND ITEMS</Label>
                  <div className="space-y-2">
                    {refund.refund_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center text-xs">
                            {item.quantity}
                          </div>
                          <span className="text-sm">{item.order_items?.products?.title || 'Product'}</span>
                        </div>
                        <span className="font-medium">{formatCurrency(item.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                {refund.status === 'pending' && (
                  <>
                    <Dialog open={showProcessDialog && selectedRefund?.id === refund.id} onOpenChange={(open) => {
                      setShowProcessDialog(open);
                      if (!open) setSelectedRefund(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRefund(refund)}
                        >
                          Process
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Process Refund Request</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Requested Amount</Label>
                            <p className="font-semibold">{formatCurrency(refund.amount_requested)}</p>
                          </div>
                          <div>
                            <Label htmlFor="approved">Approved Amount</Label>
                            <Input
                              id="approved"
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={approvalData.amount_approved}
                              onChange={(e) => setApprovalData(prev => ({ ...prev, amount_approved: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              value={approvalData.notes}
                              onChange={(e) => setApprovalData(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Additional notes..."
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => handleApproval(refund.id, false)}
                              disabled={processingId === refund.id}
                            >
                              {processingId === refund.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Reject
                            </Button>
                            <Button
                              onClick={() => handleApproval(refund.id, true)}
                              disabled={processingId === refund.id || !approvalData.amount_approved}
                            >
                              {processingId === refund.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Approve
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}

                {refund.status === 'approved' && (
                  <Button
                    size="sm"
                    onClick={() => handleProcessRefund(refund.id)}
                    disabled={processingId === refund.id}
                  >
                    {processingId === refund.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Process Payment
                  </Button>
                )}

                {refund.paypal_refund_id && (
                  <Badge variant="outline" className="text-xs">
                    PayPal: {refund.paypal_refund_id.slice(-8)}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRefunds.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No refund requests found.
        </div>
      )}
    </div>
  );
};

export default RefundManagement;
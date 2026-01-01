import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { EcommerceApi } from '@/api/EcommerceApi';

const REFUND_REASONS = [
  'Defective product',
  'Wrong item received',
  'Damaged during shipping',
  'Not as described',
  'Changed mind',
  'Better price found',
  'Delivery delay',
  'Other'
];

const RefundRequestModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canRefund = order?.status === 'delivered' || order?.status === 'shipped';

  useEffect(() => {
    if (isOpen) {
      // Reset form
      setSelectedItems([]);
      setReason('');
      setCustomReason('');
      setError('');
    }
  }, [isOpen]);

  const handleItemToggle = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason) {
      setError('Please select a refund reason');
      return;
    }

    const finalReason = reason === 'Other' ? customReason : reason;

    if (!finalReason.trim()) {
      setError('Please provide a refund reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const refundData = {
        reason: finalReason
      };

      // If specific items are selected, include them
      if (selectedItems.length > 0 && selectedItems.length < order.order_items.length) {
        refundData.items = selectedItems.map(itemId => {
          const item = order.order_items.find(oi => oi.id === itemId);
          return {
            order_item_id: itemId,
            quantity: item.quantity,
            reason: finalReason
          };
        });
      }

      await EcommerceApi.requestRefund(order.id, refundData);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit refund request');
    } finally {
      setLoading(false);
    }
  };

  const calculateRefundAmount = () => {
    if (!selectedItems.length) return order.total_amount;

    const selectedItemTotal = order.order_items
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + item.total_price, 0);

    return selectedItemTotal;
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
        </DialogHeader>

        {!canRefund ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Refunds not available
                </p>
                <p className="text-sm text-yellow-700">
                  Refunds can only be requested for delivered or shipped orders.
                  Current status: <Badge variant="secondary">{order.status}</Badge>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Order #{order.id.slice(-8)}</h3>
              <div className="flex justify-between text-sm">
                <span>Total Amount:</span>
                <span className="font-medium">${(order.total_amount / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Item Selection */}
            {order.order_items && order.order_items.length > 1 && (
              <div>
                <Label className="text-base font-medium mb-3 block">
                  Select items to refund (optional - leave empty for full refund)
                </Label>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={selectedItems.includes(item.id)}
                        onCheckedChange={() => handleItemToggle(item.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {item.products?.images?.[0] ? (
                              <img
                                src={item.products.images[0]}
                                alt={item.products.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-300 rounded" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.products?.title}</p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} × ${(item.unit_price / 100).toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(item.total_price / 100).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refund Amount Preview */}
            {selectedItems.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Estimated Refund Amount:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${(calculateRefundAmount() / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {selectedItems.length} of {order.order_items.length} items selected
                </p>
              </div>
            )}

            {/* Refund Reason */}
            <div>
              <Label className="text-base font-medium mb-3 block">Refund Reason *</Label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {REFUND_REASONS.map((reasonOption) => (
                  <button
                    key={reasonOption}
                    type="button"
                    onClick={() => setReason(reasonOption)}
                    className={`p-2 text-left border rounded-lg hover:bg-gray-50 ${
                      reason === reasonOption ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    {reasonOption}
                  </button>
                ))}
              </div>

              {reason === 'Other' && (
                <Textarea
                  placeholder="Please provide details about your refund request..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="mt-2"
                  required
                />
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Refund Request
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RefundRequestModal;
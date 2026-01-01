import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { EcommerceApi } from '@/api/EcommerceApi';

const CANCELLATION_REASONS = [
  'Changed mind',
  'Found better price',
  'Delivery too slow',
  'Ordered by mistake',
  'Duplicate order',
  'Technical issues',
  'Other'
];

const CancellationModal = ({ isOpen, onClose, order, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canCancel = ['pending', 'confirmed', 'processing'].includes(order?.status);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason) {
      setError('Please select a cancellation reason');
      return;
    }

    const finalReason = reason === 'Other' ? customReason : reason;

    if (!finalReason.trim()) {
      setError('Please provide a cancellation reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await EcommerceApi.cancelOrder(order.id, { reason: finalReason });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setCustomReason('');
    setError('');
    onClose();
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Cancel Order
          </DialogTitle>
        </DialogHeader>

        {!canCancel ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              This order cannot be cancelled at this stage.
              Current status: <Badge variant="secondary">{order.status}</Badge>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Order Summary */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium">Order #{order.id.slice(-8)}</p>
              <p className="text-sm text-gray-600">
                Total: ${(order.total_amount / 100).toFixed(2)}
              </p>
            </div>

            {/* Cancellation Reason */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Reason for cancellation *
              </Label>
              <div className="space-y-2">
                {CANCELLATION_REASONS.map((reasonOption) => (
                  <button
                    key={reasonOption}
                    type="button"
                    onClick={() => setReason(reasonOption)}
                    className={`w-full p-2 text-left border rounded hover:bg-gray-50 ${
                      reason === reasonOption ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                    }`}
                  >
                    {reasonOption}
                  </button>
                ))}
              </div>

              {reason === 'Other' && (
                <Textarea
                  placeholder="Please provide details..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="mt-2"
                  required
                />
              )}
            </div>

            {/* Warning */}
            <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 text-orange-600 mr-2 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Important:</p>
                  <p>Cancelling this order will:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Stop any further processing</li>
                    <li>Restore inventory quantities</li>
                    <li>Cancel any pending payments</li>
                  </ul>
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={handleClose}>
                Keep Order
              </Button>
              <Button type="submit" variant="destructive" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Cancel Order
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CancellationModal;
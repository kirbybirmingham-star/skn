import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const VendorOrderActions = ({ order, onAction, isOpen, onClose }) => {
  const { toast } = useToast();
  const [actionType, setActionType] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!order) return;

    setLoading(true);

    try {
      let endpoint = '';
      let method = 'POST';
      let body = {};

      switch (actionType) {
        case 'fulfill':
          endpoint = `/api/vendor/orders/${order.id}/fulfill`;
          body = {
            tracking_number: trackingNumber,
            carrier,
            notes
          };
          break;

        case 'cancel':
          endpoint = `/api/vendor/orders/${order.id}/cancel`;
          body = { reason };
          break;

        case 'update_tracking':
          endpoint = `/api/vendor/orders/${order.id}/tracking`;
          method = 'PUT';
          body = {
            tracking_number: trackingNumber,
            carrier,
            notes
          };
          break;

        default:
          throw new Error('Invalid action type');
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('@/contexts/SupabaseAuthContext')).useAuth().user?.access_token || ''}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const result = await response.json();
        onAction(result.order);

        toast({
          title: "Success",
          description: `Order ${actionType}d successfully`
        });

        // Reset form
        setActionType('');
        setTrackingNumber('');
        setCarrier('');
        setNotes('');
        setReason('');
        onClose();
      } else {
        throw new Error('Failed to perform action');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to perform action. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActionType('');
    setTrackingNumber('');
    setCarrier('');
    setNotes('');
    setReason('');
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Order Actions</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action Type Selection */}
          <div>
            <Label htmlFor="action-type">Action</Label>
            <Select value={actionType} onValueChange={setActionType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                {['confirmed', 'processing'].includes(order.order_status) && (
                  <SelectItem value="fulfill">Fulfill Order</SelectItem>
                )}
                {['pending', 'confirmed', 'processing'].includes(order.order_status) && (
                  <SelectItem value="cancel">Cancel Order</SelectItem>
                )}
                {order.order_status === 'shipped' && (
                  <SelectItem value="update_tracking">Update Tracking</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Fulfillment Fields */}
          {actionType === 'fulfill' && (
            <>
              <div>
                <Label htmlFor="tracking-number">Tracking Number</Label>
                <Input
                  id="tracking-number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                />
              </div>

              <div>
                <Label htmlFor="carrier">Shipping Carrier</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usps">USPS</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="fedex">FedEx</SelectItem>
                    <SelectItem value="dhl">DHL</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Fulfillment Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the fulfillment..."
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Cancellation Fields */}
          {actionType === 'cancel' && (
            <div>
              <Label htmlFor="reason">Cancellation Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                required
                rows={3}
              />
            </div>
          )}

          {/* Update Tracking Fields */}
          {actionType === 'update_tracking' && (
            <>
              <div>
                <Label htmlFor="tracking-number">New Tracking Number</Label>
                <Input
                  id="tracking-number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter new tracking number"
                />
              </div>

              <div>
                <Label htmlFor="carrier">Shipping Carrier</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usps">USPS</SelectItem>
                    <SelectItem value="ups">UPS</SelectItem>
                    <SelectItem value="fedex">FedEx</SelectItem>
                    <SelectItem value="dhl">DHL</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Update Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the tracking update..."
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !actionType}>
              {loading ? 'Processing...' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VendorOrderActions;
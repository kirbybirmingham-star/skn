import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, Truck, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const OrderFulfillmentModal = ({ order, onClose, onComplete }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [fulfillmentData, setFulfillmentData] = useState({
    trackingNumber: '',
    carrier: '',
    notes: '',
    estimatedDelivery: ''
  });
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 1, title: 'Prepare Order', description: 'Gather items and prepare for shipping' },
    { id: 2, title: 'Package Items', description: 'Package the order securely' },
    { id: 3, title: 'Add Tracking', description: 'Enter shipping information' },
    { id: 4, title: 'Ship Order', description: 'Mark order as shipped' }
  ];

  const handleInputChange = (field, value) => {
    setFulfillmentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!fulfillmentData.trackingNumber || !fulfillmentData.carrier) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide tracking number and carrier."
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/vendor/orders/${order.id}/fulfill`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          tracking_number: fulfillmentData.trackingNumber,
          carrier: fulfillmentData.carrier,
          notes: fulfillmentData.notes
        })
      });

      if (response.ok) {
        const result = await response.json();
        onComplete(result.order);

        toast({
          title: "Order Fulfilled",
          description: "Order has been marked as shipped successfully."
        });

        onClose();
      } else {
        throw new Error('Failed to fulfill order');
      }
    } catch (error) {
      console.error('Error fulfilling order:', error);
      toast({
        variant: "destructive",
        title: "Fulfillment Failed",
        description: "Failed to complete order fulfillment. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium">Prepare Order</h3>
              <p className="text-gray-600">Gather all items for this order and prepare them for packaging.</p>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Product:</span>
                    <span>{order.product_title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Quantity:</span>
                    <span>{order.quantity}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Customer:</span>
                    <span>{order.customer_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">Package Items</h3>
              <p className="text-gray-600">Securely package the items and prepare shipping label.</p>
            </div>

            <div>
              <Label htmlFor="notes">Packaging Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add notes about packaging quality, special handling, etc."
                value={fulfillmentData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <MapPin className="mx-auto h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-lg font-medium">Add Tracking Information</h3>
              <p className="text-gray-600">Enter shipping details for tracking.</p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="tracking-number">Tracking Number *</Label>
                <Input
                  id="tracking-number"
                  placeholder="Enter tracking number"
                  value={fulfillmentData.trackingNumber}
                  onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="carrier">Shipping Carrier *</Label>
                <Select
                  value={fulfillmentData.carrier}
                  onValueChange={(value) => handleInputChange('carrier', value)}
                >
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
                <Label htmlFor="estimated-delivery">Estimated Delivery (Optional)</Label>
                <Input
                  id="estimated-delivery"
                  type="date"
                  value={fulfillmentData.estimatedDelivery}
                  onChange={(e) => handleInputChange('estimatedDelivery', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Truck className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium">Ship Order</h3>
              <p className="text-gray-600">Review details and mark order as shipped.</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Shipping Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Tracking Number:</span>
                  <span className="font-medium">{fulfillmentData.trackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Carrier:</span>
                  <span className="font-medium">{fulfillmentData.carrier}</span>
                </div>
                {fulfillmentData.estimatedDelivery && (
                  <div className="flex justify-between">
                    <span>Est. Delivery:</span>
                    <span className="font-medium">
                      {new Date(fulfillmentData.estimatedDelivery).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Fulfill Order #{order?.id?.slice(-8)}</DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex justify-between mb-6">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step.id < currentStep
                  ? 'bg-green-500 text-white'
                  : step.id === currentStep
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step.id < currentStep ? <CheckCircle className="w-4 h-4" /> : step.id}
              </div>
              <span className={`text-xs mt-1 text-center ${
                step.id <= currentStep ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            {currentStep < steps.length ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading || !fulfillmentData.trackingNumber || !fulfillmentData.carrier}
              >
                {loading ? 'Shipping...' : 'Ship Order'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderFulfillmentModal;
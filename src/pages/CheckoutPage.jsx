import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import PayPalCheckout from '@/components/PayPalCheckout';
import ordersApi from '@/api/ordersApi';
import { MapPin, Package, CreditCard, Loader2, AlertCircle } from 'lucide-react';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { cartItems, getCartTotal, clearCart } = useCart();
  
  const [step, setStep] = useState('shipping'); // shipping, review, payment
  const [loading, setLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  });
  const [paymentMethod, setPaymentMethod] = useState('paypal');

  useEffect(() => {
    // Redirect if no items in cart
    if (cartItems.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Add items to your cart before checking out.',
        variant: 'destructive'
      });
      navigate('/marketplace');
    }
  }, [cartItems, navigate, toast]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-white rounded-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Sign in required</h2>
            <p className="text-slate-600 mb-6">Please sign in to continue with checkout.</p>
            <Button onClick={() => navigate('/login')} className="bg-blue-600 hover:bg-blue-700">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step === 'shipping') {
      // Validate shipping address
      const required = ['firstName', 'lastName', 'phone', 'streetAddress', 'city', 'postalCode', 'country'];
      const missing = required.filter(field => !shippingAddress[field]);
      
      if (missing.length > 0) {
        toast({
          title: 'Incomplete address',
          description: `Please fill in all required fields.`,
          variant: 'destructive'
        });
        return;
      }
      
      setStep('review');
    } else if (step === 'review') {
      setStep('payment');
    }
  };

  const handlePaymentSuccess = async (paypalOrderId) => {
    try {
      setLoading(true);
      
      // Create order in database
      const orderData = {
        paypalOrderId,
        shippingAddress,
        items: cartItems.map(item => ({
          variantId: item.variant.id,
          quantity: item.quantity,
          priceAtPurchase: item.variant.sale_price_in_cents || item.variant.price_in_cents
        }))
      };

      const order = await ordersApi.create(orderData);

      toast({
        title: 'Order created successfully!',
        description: `Order #${order.id} has been placed.`
      });

      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (error) {
      toast({
        title: 'Error creating order',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const cartTotal = getCartTotal();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <Helmet>
        <title>Checkout - SKN Bridge Trade</title>
        <meta name="description" content="Complete your purchase" />
      </Helmet>

      <div className="max-w-6xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {['Shipping', 'Review', 'Payment'].map((label, index) => (
              <div key={label} className="flex items-center">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index < ['shipping', 'review', 'payment'].indexOf(step) + 1
                      ? 'bg-blue-600 text-white'
                      : step === ['shipping', 'review', 'payment'][index]
                      ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                  animate={{ scale: step === ['shipping', 'review', 'payment'][index] ? 1.1 : 1 }}
                >
                  {index + 1}
                </motion.div>
                {index < 2 && <div className="w-16 h-1 bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg p-6 mb-6"
            >
              {step === 'shipping' && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <MapPin className="w-6 h-6" />
                    Shipping Address
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name *"
                      value={shippingAddress.firstName}
                      onChange={handleShippingChange}
                      className="col-span-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name *"
                      value={shippingAddress.lastName}
                      onChange={handleShippingChange}
                      className="col-span-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={shippingAddress.email}
                      onChange={handleShippingChange}
                      className="col-span-2 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number *"
                      value={shippingAddress.phone}
                      onChange={handleShippingChange}
                      className="col-span-2 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="streetAddress"
                      placeholder="Street Address *"
                      value={shippingAddress.streetAddress}
                      onChange={handleShippingChange}
                      className="col-span-2 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="city"
                      placeholder="City *"
                      value={shippingAddress.city}
                      onChange={handleShippingChange}
                      className="col-span-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="state"
                      placeholder="State/Province"
                      value={shippingAddress.state}
                      onChange={handleShippingChange}
                      className="col-span-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      name="postalCode"
                      placeholder="Postal Code *"
                      value={shippingAddress.postalCode}
                      onChange={handleShippingChange}
                      className="col-span-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      name="country"
                      value={shippingAddress.country}
                      onChange={handleShippingChange}
                      className="col-span-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="MX">Mexico</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
              )}

              {step === 'review' && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Package className="w-6 h-6" />
                    Review Order
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-slate-700 mb-2">Shipping To:</h3>
                      <p className="text-slate-600">
                        {shippingAddress.firstName} {shippingAddress.lastName}<br />
                        {shippingAddress.streetAddress}<br />
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />
                        {shippingAddress.country}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-slate-700 mb-3">Order Items:</h3>
                      {cartItems.map(item => (
                        <div key={item.variant.id} className="flex justify-between text-slate-600 mb-2">
                          <span>{item.product.title} x {item.quantity}</span>
                          <span>${((item.variant.sale_price_in_cents || item.variant.price_in_cents) * item.quantity / 100).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 'payment' && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <CreditCard className="w-6 h-6" />
                    Payment Method
                  </h2>

                  <div className="space-y-4">
                    <label className="flex items-center p-4 border-2 border-blue-500 rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value="paypal"
                        checked={paymentMethod === 'paypal'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mr-3"
                      />
                      <span className="font-semibold text-slate-700">PayPal</span>
                    </label>

                    {paymentMethod === 'paypal' && (
                      <div className="mt-6">
                        <PayPalCheckout
                          cartItems={cartItems}
                          onSuccess={handlePaymentSuccess}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button
                  onClick={() => setStep(step === 'shipping' ? 'cart' : ['shipping', 'review'][['review', 'payment'].indexOf(step)])}
                  variant="outline"
                  disabled={step === 'shipping' || loading}
                >
                  Back
                </Button>
                {step !== 'payment' && (
                  <Button
                    onClick={handleNext}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Next
                  </Button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Order summary */}
          <div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-lg p-6 sticky top-4"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6 pb-6 border-b border-slate-200">
                {cartItems.map(item => (
                  <div key={item.variant.id} className="flex justify-between text-sm text-slate-600">
                    <span>{item.product.title} ({item.quantity}x)</span>
                    <span>${((item.variant.sale_price_in_cents || item.variant.price_in_cents) * item.quantity / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>{cartTotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping:</span>
                  <span>$0.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax:</span>
                  <span>$0.00</span>
                </div>
              </div>

              <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between items-center">
                <span className="font-bold text-slate-800">Total:</span>
                <span className="text-2xl font-bold text-blue-600">{cartTotal}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

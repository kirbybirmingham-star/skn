import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { CreditCard, Shield, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  const tier = searchParams.get('tier');
  const price = searchParams.get('price');

  // Define tier details
  const tierDetails = {
    'Starter': {
      price: 'XCD 50',
      description: 'Basic seller subscription',
      commission: '8%',
      features: ['Basic dashboard', 'Standard support', 'Platform payments']
    },
    'Professional': {
      price: 'XCD 150',
      description: 'Growing business subscription',
      commission: '6%',
      features: ['Advanced analytics', 'Priority support', 'Direct payments']
    },
    'Enterprise': {
      price: 'XCD 300',
      description: 'Established seller subscription',
      commission: '5%',
      features: ['All features', 'Dedicated support', 'API access']
    }
  };

  const selectedTier = tierDetails[tier];

  if (!tier || !selectedTier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Plan Selection</h2>
          <Button onClick={() => navigate('/become-seller')}>
            Back to Plans
          </Button>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to continue with payment.',
        variant: 'destructive'
      });
      // Store the current payment details for after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update user tier in Supabase
      const { supabase } = await import('../lib/customSupabaseClient');

      const { error } = await supabase
        .from('profiles')
        .update({
          seller_tier: tier.toLowerCase(),
          subscription_active: true,
          subscription_start: new Date().toISOString(),
          commission_rate: parseInt(selectedTier.commission.replace('%', ''))
        })
        .eq('id', user.id);

      if (error) throw error;

      setPaymentComplete(true);

      toast({
        title: 'Payment Successful!',
        description: `Welcome to the ${tier} tier! Your subscription is now active.`,
      });

      // Redirect to account page after a delay
      setTimeout(() => {
        navigate('/account-settings');
      }, 3000);

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 shadow-xl text-center max-w-md"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Welcome to the <span className="font-semibold text-[#00A86B]">{tier}</span> tier!
            Your subscription is now active.
          </p>
          <p className="text-sm text-gray-500">Redirecting to your account...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Complete Payment - {tier} Plan | SKN Bridge Trade</title>
        <meta name="description" content={`Complete your ${tier} subscription payment for SKN Bridge Trade seller account.`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-16 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => navigate('/become-seller')}
            className="flex items-center space-x-2 text-[#1E90FF] hover:text-[#1E90FF]/80 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Plans</span>
          </motion.button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Plan Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-lg border"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Plan Summary</h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-semibold text-[#1E90FF]">{tier}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-2xl text-[#00A86B]">{selectedTier.price}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Commission Rate:</span>
                  <span className="font-semibold">{selectedTier.commission}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Billing:</span>
                  <span className="font-semibold">Monthly</span>
                </div>

                <hr className="my-4" />

                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Included Features:</h3>
                  <ul className="space-y-1">
                    {selectedTier.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>

            {/* Payment Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border"
            >
              <div className="flex items-center mb-6">
                <CreditCard className="w-6 h-6 text-[#00A86B] mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
              </div>

              <div className="space-y-6">
                {/* Mock Payment Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A86B] focus:border-transparent"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A86B] focus:border-transparent"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A86B] focus:border-transparent"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A86B] focus:border-transparent"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Security Notice */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>Your payment information is secure and encrypted</span>
                </div>

                {/* Pay Button */}
                <Button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-[#00A86B] hover:bg-[#00A86B]/90 text-white py-4 text-lg font-semibold"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    `Pay ${selectedTier.price} - Subscribe Now`
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  By subscribing, you agree to our terms of service and privacy policy.
                  Subscription will auto-renew monthly.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentPage;
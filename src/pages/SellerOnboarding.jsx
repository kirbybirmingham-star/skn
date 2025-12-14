import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import SellerSignupForm from '@/components/auth/SellerSignupForm';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';

export default function SellerOnboarding() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { session } = useContext(SupabaseAuthContext);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/onboarding/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data?.vendor) setVendor(data.vendor);
        else setError(data.error || 'Could not load vendor');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSuccess = (data) => {
    // If the API returned an onboardingUrl, navigate there
    if (data?.onboardingUrl) {
      window.location.href = data.onboardingUrl;
      return;
    }
    // Or navigate to dashboard
    navigate('/dashboard/onboarding');
  };

  const startKyc = async () => {
    if (!vendor || !session?.access_token) return;
    setKycLoading(true);
    try {
      const res = await fetch('/api/onboarding/start-kyc', { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }, 
        body: JSON.stringify({ vendor_id: vendor.id }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'KYC start failed');
      // redirect to provider
      if (data.providerUrl) window.location.href = data.providerUrl;
    } catch (err) {
      setError(err.message);
    } finally {
      setKycLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Seller Onboarding | SKN Bridge Trade</title>
        <meta name="description" content="Complete your seller onboarding and start selling on our marketplace." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
        <div className="max-w-3xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Seller Onboarding
            </h1>
            <p className="text-slate-600">Get verified and start selling on our marketplace</p>
          </motion.div>

          {/* Onboarding Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-green-100 text-green-600 font-semibold">✓</div>
                <div className="flex-grow">
                  <h3 className="text-sm font-medium text-slate-900">Step 1: Create Seller Account</h3>
                  <p className="text-sm text-slate-600">Set up your store details and contact information</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 text-yellow-600 font-semibold">2</div>
                <div className="flex-grow">
                  <h3 className="text-sm font-medium text-slate-900">Step 2: Identity Verification (KYC)</h3>
                  <p className="text-sm text-slate-600">Complete identity verification process</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200">
                <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-slate-600 font-semibold">3</div>
                <div className="flex-grow">
                  <h3 className="text-sm font-medium text-slate-900">Step 3: Approval</h3>
                  <p className="text-sm text-slate-600">Wait for approval and start selling</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <CardTitle className="text-red-700">Error</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-red-600">{error}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {!token ? (
              <div>
                <p className="text-slate-600 mb-6">Create your seller account to start selling on our marketplace.</p>
                <SellerSignupForm onSuccess={handleSuccess} />
              </div>
            ) : loading ? (
              <Card>
                <CardContent className="py-8 text-center text-slate-600">
                  Loading your onboarding information…
                </CardContent>
              </Card>
            ) : vendor ? (
              <Card>
                <CardHeader>
                  <CardTitle>Continue Your Onboarding</CardTitle>
                  <CardDescription>You're ready for identity verification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs uppercase tracking-wide text-slate-600 mb-1">Store Name</p>
                      <p className="text-lg font-semibold text-slate-900">{vendor.name}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs uppercase tracking-wide text-slate-600 mb-1">Current Status</p>
                      <p className="text-lg font-semibold text-slate-900 capitalize">{vendor.onboarding_status || 'Not Started'}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      To start selling on our marketplace, you need to complete identity verification. This helps us maintain a safe and trusted community.
                    </p>
                  </div>

                  <Button
                    onClick={startKyc}
                    disabled={kycLoading}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 font-medium py-2"
                  >
                    {kycLoading ? 'Starting Verification…' : 'Start Identity Verification'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard/onboarding')}
                    className="w-full"
                  >
                    View My Onboarding Dashboard
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div>
                <p className="text-slate-600 mb-6">Let's create your seller account to get started.</p>
                <SellerSignupForm onSuccess={handleSuccess} />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}

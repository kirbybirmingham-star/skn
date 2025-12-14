import React, { useEffect, useState, useContext } from 'react';
import { SupabaseAuthContext } from '@/contexts/SupabaseAuthContext';
import { API_CONFIG } from '@/config/environment.js';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, FileText, ArrowRight, Sparkles, Shield, TrendingUp } from 'lucide-react';

export default function OnboardingDashboard() {
  const { session } = useContext(SupabaseAuthContext);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load vendor for current user - endpoint should return vendor owned by user
    const token = session?.access_token;
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    fetch(`${API_CONFIG.baseURL}/onboarding/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(async r => {
        // 404 means no vendor exists yet, which is OK
        if (r.status === 404) {
          setVendor(null);
          return null;
        }
        if (!r.ok) throw new Error(`Error: ${r.status}`);
        
        // It's possible the body is empty, handle that gracefully
        const text = await r.text();
        if (!text) {
          return null;
        }
        return JSON.parse(text);
      })
      .then(data => {
        // Ensure data and data.vendor exist
        if (data && data.vendor) {
          setVendor(data.vendor);
        } else {
          // If no vendor is returned, treat as not onboarded
          setVendor(null);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [session?.access_token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center"
        >
          <div className="w-12 h-12 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your onboarding dashboard…</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <CardTitle className="text-red-700">Unable to Load Dashboard</CardTitle>
                </div>
                <CardDescription className="text-red-600 mt-2">
                  {error === 'Not authenticated' 
                    ? 'Please sign in to access your onboarding dashboard'
                    : error}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  {error === 'Not authenticated' ? (
                    <Button onClick={() => window.location.href = '/auth/login'} className="bg-red-600 text-white hover:bg-red-700">
                      Sign In
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => window.location.reload()}>
                        Try Again
                      </Button>
                      <Button onClick={() => window.location.href = '/onboarding'} className="bg-blue-600 text-white hover:bg-blue-700">
                        Get Started
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <div>
                    <CardTitle>Welcome to SKN Bridge Trade!</CardTitle>
                    <CardDescription>Start your seller journey today</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-700">
                  You haven't created a seller account yet. Join our community of sellers and start reaching customers across our platform.
                </p>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Easy onboarding process
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Secure KYC verification
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Full seller dashboard access
                  </li>
                </ul>
                <Button onClick={() => window.location.href = '/onboarding'} className="w-full bg-blue-600 text-white hover:bg-blue-700 h-11">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const documents = vendor.onboarding_data?.documents || [];
  const appeals = vendor.onboarding_data?.appeals || [];
  const isOnboarded = vendor.onboarding_status === 'approved';
  const isInProgress = vendor.onboarding_status === 'pending';
  const isRejected = vendor.onboarding_status === 'rejected';

  const getStatusIcon = () => {
    if (isOnboarded) return <CheckCircle className="w-8 h-8 text-green-600" />;
    if (isInProgress) return <Clock className="w-8 h-8 text-yellow-600" />;
    if (isRejected) return <AlertCircle className="w-8 h-8 text-red-600" />;
    return <Shield className="w-8 h-8 text-slate-600" />;
  };

  const getStatusColor = () => {
    if (isOnboarded) return 'bg-green-50 border-green-200';
    if (isInProgress) return 'bg-yellow-50 border-yellow-200';
    if (isRejected) return 'bg-red-50 border-red-200';
    return 'bg-slate-50 border-slate-200';
  };

  const getStatusTextColor = () => {
    if (isOnboarded) return 'text-green-900';
    if (isInProgress) return 'text-yellow-900';
    if (isRejected) return 'text-red-900';
    return 'text-slate-900';
  };

  const getStatusBadge = () => {
    if (isOnboarded) return <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full"><CheckCircle className="w-3 h-3" /> Approved</span>;
    if (isInProgress) return <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full"><Clock className="w-3 h-3" /> Under Review</span>;
    if (isRejected) return <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full"><AlertCircle className="w-3 h-3" /> Rejected</span>;
    return <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-800 text-xs font-semibold rounded-full"><Shield className="w-3 h-3" /> Not Started</span>;
  };

  return (
    <>
      <Helmet>
        <title>Onboarding Dashboard | SKN Bridge Trade</title>
        <meta name="description" content="Manage your seller onboarding status and KYC verification." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
        <div className="max-w-4xl mx-auto px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Onboarding Dashboard
            </h1>
            <p className="text-slate-600">Manage your seller account and complete verification</p>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <Card className={`border-2 ${getStatusColor()}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-3xl font-bold mb-1">{vendor.name}</CardTitle>
                    <CardDescription className="text-base">Seller Account</CardDescription>
                  </div>
                  <div className="text-right">
                    {getStatusBadge()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon()}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Status</p>
                      <p className={`text-lg font-bold ${getStatusTextColor()} capitalize`}>
                        {vendor.onboarding_status || 'Not Started'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Account Created</p>
                    <p className="text-lg font-semibold text-slate-900">{new Date(vendor.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Documents</p>
                    <p className="text-lg font-semibold text-slate-900">{documents.length} uploaded</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Documents Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Verification Documents</CardTitle>
                    <CardDescription>Identity and compliance documents</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {documents.length === 0 ? (
                  <div className="py-12 text-center">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No documents uploaded yet</p>
                    <p className="text-sm text-slate-500 mb-6">Upload your verification documents to complete onboarding</p>
                    <Button onClick={() => window.location.href = '/onboarding'} className="bg-blue-600 text-white hover:bg-blue-700">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Upload Documents
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map(doc => (
                      <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-2 bg-slate-200 rounded group-hover:bg-blue-200 transition">
                            <FileText className="w-5 h-5 text-slate-700 group-hover:text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{doc.name || 'Document'}</p>
                            <p className="text-xs text-slate-500">{doc.type || 'Uploaded document'}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.url, '_blank')}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                        >
                          View <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Appeals Section */}
          {appeals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mb-8"
            >
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-orange-900">Pending Appeals</CardTitle>
                      <CardDescription className="text-orange-700">Items requiring your attention</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {appeals.map((a, idx) => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="p-4 bg-white rounded border border-orange-200 hover:border-orange-300 transition"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide mb-1">
                              {new Date(a.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-slate-900 font-medium mb-2">{a.reason}</p>
                            {a.description && (
                              <p className="text-sm text-slate-600">{a.description}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <Button
                    onClick={() => window.location.href = '/onboarding'}
                    className="w-full mt-6 bg-orange-600 text-white hover:bg-orange-700"
                  >
                    Resolve Appeals <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            {!isOnboarded && (
              <Button
                onClick={() => window.location.href = '/onboarding'}
                className="flex-1 bg-blue-600 text-white hover:bg-blue-700 h-11 font-semibold"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Continue Onboarding
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => window.location.href = '/dashboard/vendor/edit'}
              className="flex-1 h-11 font-semibold"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Edit Store Info
            </Button>
            {isOnboarded && (
              <Button
                onClick={() => window.location.href = '/seller-dashboard'}
                className="flex-1 bg-green-600 text-white hover:bg-green-700 h-11 font-semibold"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getVendorByOwner } from '@/api/EcommerceApi';

const DashboardPage = () => {
  const { user, profile, session } = useAuth();
  // Debug: help identify which dashboard implementation is rendering in the browser
  try {
    // eslint-disable-next-line no-console
    console.debug('DashboardPage: rendering v2 (profile available?):', { hasProfile: !!profile, userId: user?.id });
  } catch (e) {}
  const [vendor, setVendor] = useState(null);
  const [counts, setCounts] = useState({ activeListings: 0, itemsSold: 0, itemsBought: 0 });
  const [loadingVendor, setLoadingVendor] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!session?.access_token) {
        setLoadingVendor(false);
        return;
      }

      try {
        // Get vendor by owner using profile
        const ownerId = profile?.id || user?.id;
        if (ownerId) {
          const vendorData = await getVendorByOwner(ownerId);
          if (vendorData) {
            setVendor(vendorData);
          }
        }

        // Fetch counts from API. Use VITE_API_URL if set (deployed backend), otherwise relative path (dev proxy)
        const viteApi = import.meta.env.VITE_API_URL || '';
        const apiPath = viteApi ? `${viteApi.replace(/\/$/, '')}/api/onboarding/me` : '/api/onboarding/me';
        // Debug: log the exact URL being requested
        // eslint-disable-next-line no-console
        console.debug('DashboardPage: fetching onboarding.me at', apiPath);
        const res = await fetch(apiPath, { 
          headers: { Authorization: `Bearer ${session.access_token}` } 
        });
        if (res.ok) {
          const json = await res.json();
          if (json.counts) setCounts(json.counts);
        }
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoadingVendor(false);
      }
    };

    load();
  }, [session, user, profile]);

  const getAvatarFallback = (email, username) => {
    const seed = username || email;
    if (!seed) return "U";
    return seed[0].toUpperCase();
  };

  return (
    <>
      <Helmet>
        <title>Dashboard | SKN Bridge Trade</title>
        <meta name="description" content="Your personal dashboard on SKN Bridge Trade." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h1 className="text-6xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-slate-600 text-base md:text-lg">Welcome back, <span className="font-medium text-slate-800">{profile?.username || user?.user_metadata?.username || user?.email}</span>!</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-1"
            >
              <Card>
                <CardHeader className="flex-col items-center text-center py-6">
                  <div className="bg-gradient-to-br from-white/60 to-slate-50 rounded-full p-1">
                    <Avatar className="w-28 h-28 border-4 border-white shadow-lg">
                      <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                      <AvatarFallback className="text-4xl">{getAvatarFallback(user?.email, profile?.username)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <CardTitle className="text-lg md:text-xl mt-3">{profile?.username || user?.user_metadata?.username || user?.email || 'User'}</CardTitle>
                  <CardDescription className="text-sm text-slate-500">{user?.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-center text-muted-foreground">Member since <span className="font-medium text-slate-700">{new Date(profile?.created_at || user?.created_at).toLocaleDateString()}</span></p>
                  {vendor ? (
                    <div className="mt-4 text-center space-y-3">
                      <p className="text-sm font-semibold">Store: <span className="font-medium text-slate-800">{vendor.name}</span></p>
                      <p className="text-sm text-muted-foreground">Onboarding: <span className="inline-block px-2 py-1 text-xs rounded-full bg-yellow-50 text-yellow-700">{vendor.onboarding_status || 'not started'}</span></p>
                      <div className="mt-2 flex flex-col sm:flex-row sm:justify-center gap-3">
                        <a href="/dashboard/vendor" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700">Go to Seller Dashboard →</a>
                        <a href="/dashboard/onboarding" className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-md text-sm text-slate-700 hover:bg-slate-50">Onboarding Dashboard</a>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const token = session?.access_token;
                              const res = await fetch('/api/onboarding/start-kyc', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ vendor_id: vendor.id })
                              });
                              const json = await res.json();
                              if (res.ok && json.providerUrl) {
                                window.open(json.providerUrl, '_blank');
                              } else {
                                alert(json.error || 'Could not start verification');
                              }
                            } catch (err) {
                              console.error('start KYC error', err);
                              alert('Failed to start verification');
                            }
                          }}
                        >
                          Start/Resume Verification
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-muted-foreground mb-3">No store connected yet.</p>
                      <Button className="w-full bg-blue-600 text-white hover:bg-blue-700" onClick={() => window.location.href = '/become-seller'}>
                        Become a Seller
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Account Overview</CardTitle>
                  <CardDescription>Your activity at a glance.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingVendor ? (
                    <div className="text-center py-8 text-slate-500">Loading...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500 flex flex-col items-center">
                        <p className="text-3xl font-extrabold text-blue-600">{counts.activeListings}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500 mt-2">Active Listings</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-400 flex flex-col items-center">
                        <p className="text-3xl font-extrabold text-green-600">{counts.itemsSold}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500 mt-2">Items Sold</p>
                      </div>
                      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-400 flex flex-col items-center">
                        <p className="text-3xl font-extrabold text-purple-600">{counts.itemsBought}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500 mt-2">Items Bought</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
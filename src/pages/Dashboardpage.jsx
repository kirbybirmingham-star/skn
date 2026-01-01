import React, { useEffect, useState } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    // (useAuth already imported above)
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardDebug from '../components/debug/DashboardDebug';

    const DashboardPage = () => {
      const { user, session, profile, refreshProfile } = useAuth();
      const navigate = useNavigate();
      const [vendor, setVendor] = useState(null);
      const [counts, setCounts] = useState({ activeListings: 0, itemsSold: 0, itemsBought: 0 });
      const [loadingVendor, setLoadingVendor] = useState(false);

      useEffect(() => {
        // If the current user is a vendor or admin, redirect to appropriate dashboard
        const checkRoleRedirect = async () => {
          try {
            if (!session?.user?.id) return;
            const refreshed = refreshProfile ? await refreshProfile(session.user.id) : null;
            const role = (refreshed && refreshed.role) || profile?.role;
            if (role === 'vendor') {
              navigate('/dashboard/vendor');
              return;
            }
            if (role === 'admin') {
              navigate('/dashboard/admin');
              return;
            }
          } catch (err) {
            console.warn('Role redirect check failed:', err);
          }
        };
        checkRoleRedirect();

        const load = async () => {
          if (!session?.access_token) return;
          setLoadingVendor(true);
          try {
            const res = await fetch('/api/onboarding/me', { headers: { Authorization: `Bearer ${session.access_token}` } });
            if (!res.ok) {
              setLoadingVendor(false);
              return;
            }
            const json = await res.json();
            if (json.vendor) setVendor(json.vendor);
            if (json.counts) setCounts(json.counts);
          } catch (err) {
            console.error('Failed to load vendor info', err);
          } finally {
            setLoadingVendor(false);
          }
        };

        load();
      }, [session]);

      const getAvatarFallback = (email) => {
        if (!email) return "U";
        return email[0].toUpperCase();
      }

      return (
        <>
          <Helmet>
            <title>Dashboard | SKN Bridge Trade</title>
            <meta name="description" content="Your personal dashboard on SKN Bridge Trade." />
          </Helmet>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
            <div className="container mx-auto px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-12"
              >
                <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-slate-600 text-lg">Welcome back, {profile?.full_name || user?.email}!</p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Debug Component - Remove after testing */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.05 }}
                  className="lg:col-span-3 mb-6"
                >
                  <DashboardDebug />
                </motion.div>
 
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="lg:col-span-1"
                >
                  <Card>
                    <CardHeader className="items-center">
                      <Avatar className="w-24 h-24 mb-4">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback className="text-4xl">{getAvatarFallback(user?.email)}</AvatarFallback>
                      </Avatar>
                      <CardTitle>{profile?.full_name || user?.email}</CardTitle>
                      <CardDescription>{user?.email}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-center text-muted-foreground">Member since {new Date(user?.created_at).toLocaleDateString()}</p>
                      {vendor ? (
                        <div className="mt-4 text-center">
                          <p className="text-sm font-medium">Store: {vendor.name}</p>
                          <p className="text-sm text-muted-foreground">Onboarding: {vendor.onboarding_status || 'not started'}</p>
                          <div className="mt-3 flex justify-center gap-2">
                            <a href={`/dashboard/onboarding`} className="text-sm underline">Open Onboarding Dashboard</a>
                            <Button
                              size="sm"
                              variant="secondary"
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
                        <p className="text-sm text-center text-muted-foreground mt-4">No store connected yet.</p>
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{counts.activeListings}</p>
                            <p className="text-sm text-muted-foreground">Active Listings</p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{counts.itemsSold}</p>
                            <p className="text-sm text-muted-foreground">Items Sold</p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">{counts.itemsBought}</p>
                            <p className="text-sm text-muted-foreground">Items Bought</p>
                          </div>
                      </div>
                        <div className="mt-6 pt-6 border-t">
                          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Button
                              variant="outline"
                              className="justify-start"
                              onClick={() => navigate('/orders')}
                            >
                              📦 View Order History
                            </Button>
                            <Button
                              variant="outline"
                              className="justify-start"
                              onClick={() => navigate('/marketplace')}
                            >
                              🛍️ Continue Shopping
                            </Button>
                            {(user?.user_metadata?.role === 'admin' || profile?.role === 'admin') && (
                              <>
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => navigate('/dashboard/admin')}
                                >
                                  ⚙️ Admin Dashboard
                                </Button>
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => navigate('/admin/analytics')}
                                >
                                  📊 Admin Analytics
                                </Button>
                              </>
                            )}
                            {(profile?.role === 'vendor' || user?.user_metadata?.roles?.includes('vendor')) && (
                              <>
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => navigate('/dashboard/vendor')}
                                >
                                  🏪 Manage Store
                                </Button>
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => navigate('/inventory')}
                                >
                                  📦 Inventory Management
                                </Button>
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => navigate('/vendor/analytics')}
                                >
                                  📊 Vendor Analytics
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
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
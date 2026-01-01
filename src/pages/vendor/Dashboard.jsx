import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getVendorDashboardData, getVendorByOwner } from '@/api/EcommerceApi';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user, refreshProfile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id) {
        console.log('[VENDOR_DASHBOARD] No user ID available');
        return;
      }

      console.log('[VENDOR_DASHBOARD] Starting dashboard data fetch for user:', user.id);
      setLoading(true);
      try {
        // Ensure profile is fresh
        if (refreshProfile) {
          console.log('[VENDOR_DASHBOARD] Refreshing profile');
          await refreshProfile(user.id);
        }

        // Resolve vendor by owner id first
        console.log('[VENDOR_DASHBOARD] Fetching vendor by owner ID:', user.id);
        const vendorData = await getVendorByOwner(user.id);
        console.log('[VENDOR_DASHBOARD] Vendor lookup result:', vendorData);
        if (vendorData) {
          console.log('[VENDOR_DASHBOARD] Vendor onboarding_status:', vendorData.onboarding_status);
          console.log('[VENDOR_DASHBOARD] Full vendor object:', JSON.stringify(vendorData, null, 2));
        }

        if (!vendorData) {
          console.warn('[VENDOR_DASHBOARD] No vendor data returned.');
          setDashboardData({
            totalRevenue: 0,
            totalOrders: 0,
            averageOrderValue: 0
          });
          setVendor(null);
          return;
        }

        // Store vendor data if available
        if (vendorData) {
          setVendor(vendorData);
        }

        console.log('[VENDOR_DASHBOARD] Fetching dashboard data for vendor ID:', vendorData.id);
        const data = await getVendorDashboardData(vendorData.id);
        console.log('[VENDOR_DASHBOARD] Dashboard data received:', data);
        setDashboardData(data || { totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 });
      } catch (error) {
        console.error('[VENDOR_DASHBOARD] Failed to fetch dashboard data', error);
        setDashboardData({ totalRevenue: 0, totalOrders: 0, averageOrderValue: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, refreshProfile]);

  const {
    totalRevenue = 0,
    totalOrders = 0,
    averageOrderValue = 0,
    activeProducts = 0,
    totalInventory = 0,
    lowStockItems = 0,
    pendingOrders = 0,
    completedOrders = 0,
  } = dashboardData || {};

  // Use vendor's onboarding status (original approach)
  const onboardingStatus = vendor?.onboarding_status || 'not_started';

  // Calculate progress: 0 = not_started, 1 = started, 2 = kyc_in_progress, 3 = approved
  const getProgressStep = () => {
    if (onboardingStatus === 'approved') return 3;
    if (onboardingStatus === 'pending' || onboardingStatus === 'kyc_in_progress') return 2;
    if (onboardingStatus === 'started') return 1;
    return 0;
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Not Started';
    if (status === 'approved') return 'Approved';
    if (status === 'pending') return 'Under Review';
    if (status === 'kyc_in_progress') return 'KYC In Progress';
    if (status === 'started') return 'Setup Complete';
    if (status === 'not_started') return 'Not Started';
    if (status === 'rejected') return 'Rejected';
    // Replace underscores with spaces and capitalize
    return status.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return 'bg-green-50 border-green-200';
    if (status === 'rejected') return 'bg-red-50 border-red-200';
    if (status === 'pending' || status === 'kyc_in_progress') return 'bg-yellow-50 border-yellow-200';
    return 'bg-blue-50 border-blue-200';
  };

  const progressStep = getProgressStep();
  const progressPercent = (progressStep / 3) * 100;

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Onboarding Status Card */}
      {vendor ? (
        <Card className={`border-2 ${getStatusColor(onboardingStatus)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Onboarding Status</CardTitle>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                onboardingStatus === 'approved' ? 'bg-green-200 text-green-800' :
                onboardingStatus === 'rejected' ? 'bg-red-200 text-red-800' :
                onboardingStatus === 'pending' || onboardingStatus === 'kyc_in_progress' ? 'bg-yellow-200 text-yellow-800' :
                'bg-blue-200 text-blue-800'
              }`}>
                {getStatusLabel(onboardingStatus)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Progress</span>
                <span className="text-sm font-semibold">{progressStep} of 3</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Progress Steps */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${progressStep >= 1 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {progressStep >= 1 ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <span className="text-gray-400 font-semibold">1</span>
                  )}
                </div>
                <span className="text-xs text-center text-gray-600">Account Created</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  progressStep >= 2 
                    ? (progressStep > 2 ? 'bg-green-100' : 'bg-yellow-100')
                    : 'bg-gray-100'
                }`}>
                  {progressStep > 2 ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : progressStep === 2 ? (
                    <Clock className="w-6 h-6 text-yellow-600 animate-spin" />
                  ) : (
                    <span className="text-gray-400 font-semibold">2</span>
                  )}
                </div>
                <span className="text-xs text-center text-gray-600">KYC Verification</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${progressStep >= 3 ? 'bg-green-100' : 'bg-gray-100'}`}>
                  {progressStep >= 3 ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <span className="text-gray-400 font-semibold">3</span>
                  )}
                </div>
                <span className="text-xs text-center text-gray-600">Approval</span>
              </div>
            </div>

            {/* Continue Onboarding Button */}
            {onboardingStatus !== 'approved' && (
              <div className="pt-2">
                <a 
                  href="/onboarding" 
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                >
                  Continue Onboarding
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Onboarding Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">No user profile found. Please complete registration to continue.</p>
            <a href="/onboarding" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Start Onboarding
            </a>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Overview */}
      <div>
        <h2 className="text-2xl font-bold mb-6">📊 Business Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/dashboard/vendor/orders'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Lifetime earnings • Click for orders</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/dashboard/vendor/orders'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground">Completed: {completedOrders} | Pending: {pendingOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(averageOrderValue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Per order average</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">N/A</div>
              <p className="text-xs text-muted-foreground">
                Not yet implemented
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Inventory & Products Overview */}
      <div>
        <h2 className="text-2xl font-bold mb-6">📦 Inventory & Products</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/dashboard/vendor/products'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Products</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 7 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProducts}</div>
              <p className="text-xs text-muted-foreground">Listed products • Click to manage</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/dashboard/vendor/inventory'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M3 7V6a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v1" />
                <path d="M21 9v2a2 2 0 0 1-2 2h-1" />
                <path d="M7 19h10" />
                <path d="M7 15v-2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInventory}</div>
              <p className="text-xs text-muted-foreground">Total stock across all products • Click to manage</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => window.location.href = '/dashboard/vendor/inventory'}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M10.268 21l-.553-4" />
                <path d="M13.732 21l.553-4" />
                <path d="M12 17c-.6 0-1-.4-1-1V4.5C11 3.7 11.7 3 12.5 3s1.5.7 1.5 1.5V16c0 .6-.4 1-1 1z" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${lowStockItems > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {lowStockItems}
              </div>
              <p className="text-xs text-muted-foreground">
                Items with low stock • Click to manage
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">⚡ Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/dashboard/vendor/products'}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-3xl mb-2">📦</div>
              <h3 className="font-semibold text-center">Add New Product</h3>
              <p className="text-sm text-muted-foreground text-center">Create and list new items</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/dashboard/vendor/inventory'}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-3xl mb-2">📊</div>
              <h3 className="font-semibold text-center">Check Inventory</h3>
              <p className="text-sm text-muted-foreground text-center">Manage stock levels</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/dashboard/vendor/orders'}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-3xl mb-2">📋</div>
              <h3 className="font-semibold text-center">View Orders</h3>
              <p className="text-sm text-muted-foreground text-center">Track customer orders</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => window.location.href = '/dashboard/vendor/store'}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <div className="text-3xl mb-2">🏪</div>
              <h3 className="font-semibold text-center">Store Settings</h3>
              <p className="text-sm text-muted-foreground text-center">Update store profile</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

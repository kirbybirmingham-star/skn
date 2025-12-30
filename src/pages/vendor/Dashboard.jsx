import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getVendorDashboardData, getVendorByOwner } from '@/api/EcommerceApi';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const ownerId = profile?.id || user?.id;
      console.log('[Vendor Dashboard] Owner ID:', ownerId);
      
      if (!ownerId) {
        console.warn('[Vendor Dashboard] No owner ID available');
        setLoading(false);
        return;
      }

      try {
        console.log('[Vendor Dashboard] Fetching vendor data for owner:', ownerId);
        const vendorData = await getVendorByOwner(ownerId);
        console.log('[Vendor Dashboard] Vendor data retrieved:', vendorData);
        setVendor(vendorData);
        
        if (vendorData?.id) {
          console.log('[Vendor Dashboard] Fetching dashboard data for vendor:', vendorData.id);
          const data = await getVendorDashboardData(vendorData.id);
          console.log('[Vendor Dashboard] Dashboard data retrieved:', data);
          setDashboardData(data);
        } else {
          console.warn('[Vendor Dashboard] No vendor ID found in vendor data');
        }
      } catch (error) {
        console.error('[Vendor Dashboard] Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, profile]);

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  const totalRevenue = dashboardData?.totalRevenue || 0;
  const totalOrders = dashboardData?.totalOrders || 0;
  const averageOrderValue = dashboardData?.averageOrderValue || 0;
  const onboardingStatus = vendor?.onboarding_status || null;

  console.log('[Dashboard] Vendor onboarding status:', onboardingStatus);

  // Calculate progress step based on actual status values
  const getProgressStep = () => {
    if (!onboardingStatus) return 0;
    if (onboardingStatus === 'approved') return 3;
    if (onboardingStatus === 'pending' || onboardingStatus === 'kyc_in_progress') return 2;
    if (onboardingStatus === 'started') return 1;
    return 0;
  };

  const progressStep = getProgressStep();
  const progressPercent = (progressStep / 3) * 100;

  const getStatusColor = () => {
    if (!onboardingStatus) return 'bg-slate-50 border-slate-200';
    if (onboardingStatus === 'approved') return 'bg-green-50 border-green-200';
    if (onboardingStatus === 'pending' || onboardingStatus === 'kyc_in_progress') return 'bg-yellow-50 border-yellow-200';
    if (onboardingStatus === 'rejected') return 'bg-red-50 border-red-200';
    return 'bg-blue-50 border-blue-100';
  };

  const getStatusIcon = () => {
    if (!onboardingStatus) return <AlertCircle className="w-5 h-5 text-slate-600" />;
    if (onboardingStatus === 'approved') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (onboardingStatus === 'pending' || onboardingStatus === 'kyc_in_progress') return <Clock className="w-5 h-5 text-yellow-600" />;
    if (onboardingStatus === 'rejected') return <AlertCircle className="w-5 h-5 text-red-600" />;
    return <AlertCircle className="w-5 h-5 text-slate-600" />;
  };

  const getStatusLabel = () => {
    if (!onboardingStatus) return 'Not Started';
    if (onboardingStatus === 'approved') return 'Approved';
    if (onboardingStatus === 'pending') return 'Under Review';
    if (onboardingStatus === 'kyc_in_progress') return 'KYC In Progress';
    if (onboardingStatus === 'started') return 'Setup Complete';
    if (onboardingStatus === 'rejected') return 'Rejected';
    return onboardingStatus.charAt(0).toUpperCase() + onboardingStatus.slice(1);
  };

  return (
    <div className="space-y-6">
      {vendor && (
        <div className={`border-2 rounded-lg p-6 ${getStatusColor()}`}>
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{vendor.name}</h2>
                <p className="text-slate-600 text-sm">{vendor.description || 'No description'}</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-slate-200">
                {getStatusIcon()}
                <span className="text-xs font-semibold text-slate-700">{getStatusLabel()}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">Onboarding Progress</p>
                <p className="text-xs font-semibold text-slate-600">{progressStep} of 3</p>
              </div>
              <div className="w-full bg-slate-300 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-3 gap-3">
              {/* Step 1 */}
              <div className="text-center p-3 rounded-lg bg-white bg-opacity-60">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full mx-auto mb-2 text-sm font-bold ${
                  progressStep >= 1 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {progressStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
                </div>
                <p className="text-xs font-semibold text-slate-700">Account</p>
              </div>

              {/* Step 2 */}
              <div className="text-center p-3 rounded-lg bg-white bg-opacity-60">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full mx-auto mb-2 text-sm font-bold ${
                  progressStep >= 2 
                    ? progressStep > 2 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-yellow-100 text-yellow-600'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {progressStep > 2 ? <CheckCircle className="w-5 h-5" /> : progressStep === 2 ? <Clock className="w-5 h-5" /> : '2'}
                </div>
                <p className="text-xs font-semibold text-slate-700">KYC</p>
              </div>

              {/* Step 3 */}
              <div className="text-center p-3 rounded-lg bg-white bg-opacity-60">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full mx-auto mb-2 text-sm font-bold ${
                  progressStep >= 3 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                }`}>
                  {progressStep >= 3 ? <CheckCircle className="w-5 h-5" /> : '3'}
                </div>
                <p className="text-xs font-semibold text-slate-700">Approved</p>
              </div>
            </div>

            {/* Action Button */}
            {onboardingStatus !== 'approved' && (
              <div className="pt-2">
                <a 
                  href="/dashboard/onboarding" 
                  className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition"
                >
                  Continue Onboarding →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
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
          </CardContent>
        </Card>
        <Card>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(averageOrderValue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Average per order</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">N/A</div>
            <p className="text-xs text-muted-foreground mt-1">Coming soon</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getVendorDashboardData, getVendorByOwner } from '@/api/EcommerceApi';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const ownerId = profile?.id || user?.id;
      if (!ownerId) {
        setLoading(false);
        return;
      }

      try {
        const vendorData = await getVendorByOwner(ownerId);
        setVendor(vendorData);
        
        if (vendorData?.id) {
          const data = await getVendorDashboardData(vendorData.id);
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
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
  const onboardingStatus = vendor?.onboarding_status || 'not started';

  return (
    <div className="space-y-6">
      {vendor && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
          <h2 className="text-xl font-bold mb-2">{vendor.name}</h2>
          <p className="text-slate-600 mb-3 text-sm">{vendor.description || 'No description'}</p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-600">Onboarding Status:</span>
              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${
                onboardingStatus === 'completed' ? 'bg-green-100 text-green-800' :
                onboardingStatus === 'started' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {onboardingStatus}
              </span>
            </div>
            {onboardingStatus !== 'completed' && (
              <a href="/dashboard/onboarding" className="text-sm text-blue-600 hover:underline font-medium">
                Continue Onboarding →
              </a>
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

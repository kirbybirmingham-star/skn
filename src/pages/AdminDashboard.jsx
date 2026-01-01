import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import RequireRole from '@/components/RequireRole';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminVendors from '@/components/admin/AdminVendors';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminSettings from '@/components/admin/AdminSettings';
import { Loader2 } from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  console.log('[ADMIN_DASHBOARD] Component rendered');
  console.log('[ADMIN_DASHBOARD] User object:', user);
  console.log('[ADMIN_DASHBOARD] Active tab:', activeTab);

  const tabs = {
    overview: AdminOverview,
    users: AdminUsers,
    vendors: AdminVendors,
    analytics: AdminAnalytics,
    settings: AdminSettings,
  };

  const ActiveComponent = tabs[activeTab];

  return (
    <RequireRole role="admin">
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          {/* Sidebar */}
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Main Content */}
          <div className="flex-1">
            <div className="p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600 mt-2">Manage users, vendors, and platform settings</p>
              </div>

              <ActiveComponent />
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
};

export default AdminDashboard;
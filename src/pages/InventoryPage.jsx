import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import InventoryManager from '../components/inventory/InventoryManager';
import InventoryAlerts from '../components/inventory/InventoryAlerts';
import InventorySettings from '../components/inventory/InventorySettings';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { getVendorByOwner } from '../api/EcommerceApi';

export default function InventoryPage() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const loadVendor = async () => {
      if (user) {
        try {
          const vendorData = await getVendorByOwner(user.id);
          setVendor(vendorData);
        } catch (error) {
          console.error('Failed to load vendor:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadVendor();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p>Please log in to access inventory management.</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Vendor Account Required</h2>
          <p>You need a vendor account to manage inventory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your product stock levels, track inventory changes, and monitor alerts.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <InventoryManager vendorId={vendor.id} />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <InventoryAlerts vendorId={vendor.id} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <InventorySettings vendorId={vendor.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
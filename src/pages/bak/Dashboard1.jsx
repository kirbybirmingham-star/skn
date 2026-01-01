import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AvatarManager from '@/components/profile/AvatarManager';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Dashboard = () => {
  const { user } = useAuth();
  const isSeller = user?.user_metadata?.role === 'seller';
  const isAdmin = user?.user_metadata?.role === 'admin';

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">User Dashboard</h1>

      <div className="grid gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <AvatarManager />
          </CardContent>
        </Card>

        {/* Additional sections based on user role */}
        {(isSeller || isAdmin) && (
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Manage your products and listings here. You can upload product images and update product details.
              </p>
              <Button variant="outline" asChild>
                <Link to="/vendor/products">Go to Product Management</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
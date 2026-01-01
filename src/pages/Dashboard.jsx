import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AvatarManager from '@/components/profile/AvatarManager';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Store,
  Package,
  BarChart3,
  Settings,
  ShoppingBag,
  User,
  Shield,
  Crown
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check for multiple roles - updated role checking logic
  const userRoles = user?.user_metadata?.roles || [];
  const primaryRole = user?.user_metadata?.role;
  const isSeller = primaryRole === 'seller' || userRoles.includes('vendor') || primaryRole === 'vendor';
  const isAdmin = primaryRole === 'admin' || userRoles.includes('admin');

  console.log('[DASHBOARD] Component rendered');
  console.log('[DASHBOARD] User object:', user);
  console.log('[DASHBOARD] User metadata:', user?.user_metadata);
  console.log('[DASHBOARD] Primary role:', primaryRole);
  console.log('[DASHBOARD] User roles array:', userRoles);
  console.log('[DASHBOARD] Role determinations - isSeller:', isSeller, 'isAdmin:', isAdmin);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
          </div>

          {/* Role badges */}
          <div className="flex gap-2">
            {isAdmin && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Admin
              </Badge>
            )}
            {isSeller && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Store className="w-3 h-3" />
                Vendor
              </Badge>
            )}
            {!isAdmin && !isSeller && (
              <Badge variant="outline" className="flex items-center gap-1">
                <User className="w-3 h-3" />
                Customer
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AvatarManager />
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isSeller && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/dashboard/vendor')}
                >
                  <Store className="w-4 h-4 mr-2" />
                  Vendor Dashboard
                </Button>
              )}

              {isAdmin && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/admin')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/orders')}
              >
                <Package className="w-4 h-4 mr-2" />
                My Orders
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/account-settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Account Settings
              </Button>
            </CardContent>
          </Card>

          {/* Vendor Card */}
          {isSeller && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Vendor Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage your store, products, and orders.
                </p>
                <Button size="sm" onClick={() => navigate('/dashboard/vendor')} className="w-full">
                  Go to Vendor Dashboard
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Admin Card */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Admin Panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage the platform, users, and analytics.
                </p>
                <Button size="sm" onClick={() => navigate('/admin')} className="w-full">
                  Open Admin Panel
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Browse Marketplace */}
          {!isSeller && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Marketplace
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover amazing products from sellers.
                </p>
                <Button size="sm" onClick={() => navigate('/marketplace')} className="w-full">
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Become Seller */}
          {!isSeller && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5" />
                  Become a Seller
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Start selling your products on our platform.
                </p>
                <Button size="sm" onClick={() => navigate('/become-seller')} className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
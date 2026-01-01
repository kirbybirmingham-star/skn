import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Store,
  TrendingUp,
  Shield,
  Settings,
  Activity,
  AlertTriangle,
  DollarSign,
  Package,
  BarChart3,
  ChevronRight,
  UserCheck,
  Ban,
  Eye,
  Edit
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, profile, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    activeOrders: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentVendors, setRecentVendors] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mobile navigation
  const bottomTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'vendors', label: 'Vendors', icon: Store },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  useEffect(() => {
    loadDashboardData();
  }, [session]);

  const loadDashboardData = async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);

      // Load platform statistics
      const statsResponse = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const statsData = await statsResponse.json();
      setStats(statsData.stats || stats);

      // Load recent users
      const usersResponse = await fetch('/api/admin/users/recent', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const usersData = await usersResponse.json();
      setRecentUsers(usersData.users || []);

      // Load recent vendors
      const vendorsResponse = await fetch('/api/admin/vendors/recent', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const vendorsData = await vendorsResponse.json();
      setRecentVendors(vendorsData.vendors || []);

      // Load system alerts
      const alertsResponse = await fetch('/api/admin/alerts', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const alertsData = await alertsResponse.json();
      setSystemAlerts(alertsData.alerts || []);

    } catch (error) {
      console.error('Error loading admin dashboard data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };

  const QuickStats = () => (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 text-center">
          <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
          <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Store className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-primary">{stats.totalVendors}</div>
          <div className="text-sm text-muted-foreground">Active Vendors</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Package className="w-8 h-8 mx-auto mb-2 text-purple-600" />
          <div className="text-2xl font-bold text-primary">{stats.totalProducts}</div>
          <div className="text-sm text-muted-foreground">Total Products</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <div className="text-2xl font-bold text-primary">${(stats.totalRevenue / 100 || 0).toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">Platform Revenue</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Shield className="w-8 h-8 mx-auto mb-2 text-orange-600" />
          <div className="text-2xl font-bold text-primary">{stats.pendingVerifications}</div>
          <div className="text-sm text-muted-foreground">Pending KYC</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <Activity className="w-8 h-8 mx-auto mb-2 text-red-600" />
          <div className="text-2xl font-bold text-primary">{stats.activeOrders}</div>
          <div className="text-sm text-muted-foreground">Active Orders</div>
        </CardContent>
      </Card>
    </div>
  );

  const QuickActions = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          className="w-full h-16 flex-col gap-1"
          onClick={() => navigate('/admin/analytics')}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-xs">Analytics</span>
        </Button>
      </motion.div>

      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          className="w-full h-16 flex-col gap-1"
          onClick={() => setActiveTab('users')}
        >
          <Users className="w-5 h-5" />
          <span className="text-xs">Users</span>
        </Button>
      </motion.div>

      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          className="w-full h-16 flex-col gap-1"
          onClick={() => setActiveTab('vendors')}
        >
          <Store className="w-5 h-5" />
          <span className="text-xs">Vendors</span>
        </Button>
      </motion.div>

      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          className="w-full h-16 flex-col gap-1"
          onClick={() => navigate('/admin/settings')}
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs">Settings</span>
        </Button>
      </motion.div>
    </div>
  );

  const RecentUsers = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent User Registrations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentUsers.slice(0, 5).map((user) => (
          <motion.div
            key={user.id}
            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/admin/users/${user.id}`)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="text-sm">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{user.full_name || user.email}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {user.role || 'customer'}
              </Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
        {recentUsers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent users</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const RecentVendors = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Vendor Applications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentVendors.slice(0, 5).map((vendor) => (
          <motion.div
            key={vendor.id}
            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/admin/vendors/${vendor.id}`)}
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={vendor.logo_url} />
                <AvatarFallback className="text-sm">
                  <Store className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{vendor.name}</div>
                <div className="text-sm text-muted-foreground">
                  {vendor.owner_email} • {new Date(vendor.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {vendor.onboarding_status || 'pending'}
              </Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
        {recentVendors.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No recent vendors</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const SystemAlerts = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          System Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {systemAlerts.length > 0 ? (
          <div className="space-y-3">
            {systemAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm text-muted-foreground">{alert.description}</div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(alert.actionUrl)}
                >
                  {alert.actionText}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>All systems operational</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const AdminProfile = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback>
              <Shield className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">
              {profile?.full_name || user?.email}
            </h3>
            <p className="text-muted-foreground">Platform Administrator</p>
            <Badge variant="destructive" className="mt-1">
              Admin
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/admin/analytics')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Platform Analytics
          </Button>

          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/admin/settings')}
          >
            <Settings className="w-4 h-4 mr-2" />
            System Settings
          </Button>

          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/admin/users')}
          >
            <Users className="w-4 h-4 mr-2" />
            User Management
          </Button>

          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/admin/vendors')}
          >
            <Store className="w-4 h-4 mr-2" />
            Vendor Oversight
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Header */}
      <div className="hidden sm:block border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-sm">
                  <Shield className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {profile?.full_name || user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="overview" className="space-y-6">
              <QuickActions />
              <QuickStats />
              <SystemAlerts />
              <RecentUsers />
              <RecentVendors />
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">User Management</h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/users')}>
                  Manage All
                </Button>
              </div>
              <RecentUsers />
            </TabsContent>

            <TabsContent value="vendors" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Vendor Oversight</h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/admin/vendors')}>
                  Manage All
                </Button>
              </div>
              <RecentVendors />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <h2 className="text-xl font-semibold">Platform Analytics</h2>
              <QuickStats />
            </TabsContent>
          </Tabs>

          {/* Mobile Bottom Navigation */}
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-2 sm:hidden">
            <div className="flex justify-around">
              {bottomTabs.map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mb-1" />
                    <span className="text-xs">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add bottom padding for mobile nav */}
          <div className="pb-20 sm:hidden" />
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:block space-y-6">
          <QuickActions />
          <QuickStats />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentUsers />
            <RecentVendors />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SystemAlerts />
            <AdminProfile />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
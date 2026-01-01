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
  ShoppingBag,
  Package,
  Heart,
  Settings,
  CreditCard,
  MapPin,
  Bell,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  Star
} from 'lucide-react';

const CustomerDashboard = () => {
  const { user, profile, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    itemsInCart: 0,
    wishlistItems: 0
  });

  // Mobile navigation
  const bottomTabs = [
    { id: 'overview', label: 'Home', icon: ShoppingBag },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'account', label: 'Account', icon: Settings }
  ];

  useEffect(() => {
    loadDashboardData();
  }, [session]);

  const loadDashboardData = async () => {
    if (!session?.access_token) return;

    try {
      setLoading(true);

      // Load orders
      const ordersResponse = await fetch('/api/orders/customer', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const ordersData = await ordersResponse.json();
      setOrders(ordersData.orders || []);

      // Load favorites/wishlist
      const favoritesResponse = await fetch('/api/customer/favorites', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const favoritesData = await favoritesResponse.json();
      setFavorites(favoritesData.favorites || []);

      // Load stats
      const statsResponse = await fetch('/api/customer/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const statsData = await statsResponse.json();
      setStats(statsData.stats || stats);

      // Load recent activity
      const activityResponse = await fetch('/api/customer/activity', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const activityData = await activityResponse.json();
      setRecentActivity(activityData.activities || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load dashboard data'
      });
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      shipped: 'bg-purple-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getOrderStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      shipped: Truck,
      delivered: CheckCircle,
      cancelled: RotateCcw
    };
    return icons[status] || Clock;
  };

  const QuickActions = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          className="w-full h-16 flex-col gap-1"
          onClick={() => navigate('/marketplace')}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-xs">Shop Now</span>
        </Button>
      </motion.div>

      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          className="w-full h-16 flex-col gap-1"
          onClick={() => setActiveTab('orders')}
        >
          <Package className="w-5 h-5" />
          <span className="text-xs">My Orders</span>
        </Button>
      </motion.div>

      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          className="w-full h-16 flex-col gap-1"
          onClick={() => setActiveTab('favorites')}
        >
          <Heart className="w-5 h-5" />
          <span className="text-xs">Favorites</span>
        </Button>
      </motion.div>

      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          className="w-full h-16 flex-col gap-1"
          onClick={() => navigate('/account-settings')}
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs">Settings</span>
        </Button>
      </motion.div>
    </div>
  );

  const StatsCards = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.totalOrders}</div>
          <div className="text-sm text-muted-foreground">Total Orders</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">${stats.totalSpent}</div>
          <div className="text-sm text-muted-foreground">Total Spent</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.itemsInCart}</div>
          <div className="text-sm text-muted-foreground">Items in Cart</div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 text-center">
          <div className="text-2xl font-bold text-primary">{stats.wishlistItems}</div>
          <div className="text-sm text-muted-foreground">Wishlist Items</div>
        </CardContent>
      </Card>
    </div>
  );

  const RecentOrders = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.slice(0, 3).map((order) => {
          const StatusIcon = getOrderStatusIcon(order.status);
          return (
            <motion.div
              key={order.id}
              className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${getOrderStatusColor(order.status)}`} />
                <div>
                  <div className="font-medium">Order #{order.id.slice(-8)}</div>
                  <div className="text-sm text-muted-foreground">
                    {order.items?.length || 0} items • ${order.total || 0}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {order.status}
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.div>
          );
        })}
        {orders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No orders yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => navigate('/marketplace')}
            >
              Start Shopping
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const FavoriteItems = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Favorite Items</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {favorites.slice(0, 6).map((item) => (
            <motion.div
              key={item.id}
              className="aspect-square bg-muted rounded-lg cursor-pointer overflow-hidden"
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/product/${item.product_id}`)}
            >
              <img
                src={item.image_url || '/placeholder-product.jpg'}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>
        {favorites.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No favorite items yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => navigate('/marketplace')}
            >
              Browse Products
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const AccountOverview = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {profile?.full_name || user?.email}
              </h3>
              <p className="text-muted-foreground">{user?.email}</p>
              <Badge variant="outline" className="mt-1">
                Customer
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/account-settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Account Settings
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/account-settings')}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Addresses
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/account-settings')}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Payment Methods
            </Button>

            <Button
              variant="outline"
              className="justify-start"
              onClick={() => navigate('/account-settings')}
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">KYC Verification</div>
              <div className="text-sm text-muted-foreground">
                {profile?.kyc_status === 'approved' ? 'Verified' :
                 profile?.kyc_status === 'pending_documents' ? 'Documents submitted' :
                 'Not verified'}
              </div>
            </div>
            <Badge variant={profile?.kyc_status === 'approved' ? 'default' : 'outline'}>
              {profile?.kyc_status || 'not_started'}
            </Badge>
          </div>

          {profile?.kyc_status !== 'approved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/kyc-verification')}
            >
              Complete Verification
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
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
            <h1 className="text-2xl font-bold">My Dashboard</h1>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-sm">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
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
              <StatsCards />
              <RecentOrders />
              <FavoriteItems />
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Orders</h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/orders')}>
                  View All
                </Button>
              </div>
              <RecentOrders />
            </TabsContent>

            <TabsContent value="favorites" className="space-y-6">
              <h2 className="text-xl font-semibold">Favorite Items</h2>
              <FavoriteItems />
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <h2 className="text-xl font-semibold">Account Settings</h2>
              <AccountOverview />
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
          <StatsCards />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentOrders />
            <FavoriteItems />
          </div>

          <AccountOverview />
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { getVendorDashboardData, getVendorByOwner } from '@/api/EcommerceApi';
import {
  Card, CardContent, CardHeader, CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Plus,
  Settings,
  Store,
  BarChart3,
  ChevronRight,
  Users,
  Star,
  ShoppingCart,
  Truck,
  RefreshCw
} from 'lucide-react';

const VendorDashboard = () => {
  const { user, profile, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  // Mobile navigation
  const bottomTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'store', label: 'Store', icon: Store }
  ];

  useEffect(() => {
    loadDashboardData();
  }, [session]);

  const loadDashboardData = async () => {
    if (!session?.access_token || !user?.id) return;

    try {
      setLoading(true);

      // Get vendor information
      const vendorData = await getVendorByOwner(user.id);
      if (vendorData) {
        setVendor(vendorData);

        // Get dashboard data
        const data = await getVendorDashboardData(vendorData.id);
        setDashboardData(data);

        // Load recent orders
        const ordersResponse = await fetch('/api/orders/vendor/recent', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const ordersData = await ordersResponse.json();
        setRecentOrders(ordersData.orders || []);

        // Load top products
        const productsResponse = await fetch('/api/vendor/products/top', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const productsData = await productsResponse.json();
        setTopProducts(productsData.products || []);
      }

    } catch (error) {
      console.error('Error loading vendor dashboard data:', error);
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

  const QuickStats = () => {
    const stats = dashboardData || {};

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold text-primary">
              ${(stats.totalRevenue / 100 || 0).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold text-primary">{stats.totalOrders || 0}</div>
            <div className="text-sm text-muted-foreground">Total Orders</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Package className="w-8 h-8 mx-auto mb-2 text-purple-600" />
            <div className="text-2xl font-bold text-primary">{stats.activeProducts || 0}</div>
            <div className="text-sm text-muted-foreground">Active Products</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold text-primary">{stats.lowStockItems || 0}</div>
            <div className="text-sm text-muted-foreground">Low Stock Alerts</div>
          </CardContent>
        </Card>
    </div>
    );
  };

  const QuickActions = () => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          className="w-full h-16 flex-col gap-1"
          onClick={() => navigate('/dashboard/vendor/products')}
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs">Add Product</span>
        </Button>
      </motion.div>

      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          className="w-full h-16 flex-col gap-1"
          onClick={() => navigate('/dashboard/vendor/inventory')}
        >
          <Package className="w-5 h-5" />
          <span className="text-xs">Inventory</span>
        </Button>
      </motion.div>

      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          className="w-full h-16 flex-col gap-1"
          onClick={() => navigate('/dashboard/vendor/orders')}
        >
          <Truck className="w-5 h-5" />
          <span className="text-xs">Orders</span>
        </Button>
      </motion.div>

      <motion.div whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          className="w-full h-16 flex-col gap-1"
          onClick={() => navigate('/dashboard/vendor/store')}
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs">Store</span>
        </Button>
      </motion.div>
    </div>
  );

  const RecentOrders = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentOrders.slice(0, 5).map((order) => (
          <motion.div
            key={order.id}
            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/dashboard/vendor/orders/${order.id}`)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${getOrderStatusColor(order.status)}`} />
              <div>
                <div className="font-medium">Order #{order.id.slice(-8)}</div>
                <div className="text-sm text-muted-foreground">
                  {order.customer_email} • ${order.total / 100}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {order.status}
              </Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
        {recentOrders.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No orders yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => navigate('/dashboard/vendor/products')}
            >
              Add Products
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const TopProducts = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Top Performing Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topProducts.slice(0, 5).map((product, index) => (
            <motion.div
              key={product.id}
              className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/dashboard/vendor/products/${product.id}`)}
            >
              <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                <img
                  src={product.image_url || '/placeholder-product.jpg'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{product.title}</div>
                <div className="text-sm text-muted-foreground">
                  {product.sales || 0} sold • ${(product.price / 100).toFixed(2)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  #{index + 1}
                </Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.div>
          ))}
        </div>
        {topProducts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No products yet</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => navigate('/dashboard/vendor/products')}
            >
              Add Your First Product
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const InventoryAlerts = () => {
    const lowStockItems = dashboardData?.lowStockItems || 0;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Inventory Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowStockItems > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="font-medium">Low Stock Alert</div>
                    <div className="text-sm text-muted-foreground">
                      {lowStockItems} products are running low
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/dashboard/vendor/inventory')}
                >
                  Review
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>All products are well stocked!</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const VendorProfile = () => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={vendor?.logo_url} />
            <AvatarFallback>
              <Store className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{vendor?.name || 'Your Store'}</h3>
            <p className="text-muted-foreground">{user?.email}</p>
            <Badge variant="outline" className="mt-1">
              Vendor
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/dashboard/vendor/store')}
          >
            <Store className="w-4 h-4 mr-2" />
            Store Settings
          </Button>

          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/dashboard/vendor/verification')}
          >
            <Star className="w-4 h-4 mr-2" />
            Verification Status
          </Button>

          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/dashboard/vendor/analytics')}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>

          <Button
            variant="outline"
            className="justify-start"
            onClick={() => navigate('/dashboard/vendor/assets')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Asset Management
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
            <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={vendor?.logo_url} />
                <AvatarFallback className="text-sm">
                  <Store className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">
                {vendor?.name || 'Your Store'}
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
              <InventoryAlerts />
              <RecentOrders />
              <TopProducts />
            </TabsContent>

            <TabsContent value="products" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Products</h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/vendor/products')}>
                  Manage All
                </Button>
              </div>
              <TopProducts />
            </TabsContent>

            <TabsContent value="orders" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Orders</h2>
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/vendor/orders')}>
                  View All
                </Button>
              </div>
              <RecentOrders />
            </TabsContent>

            <TabsContent value="store" className="space-y-6">
              <h2 className="text-xl font-semibold">Store Management</h2>
              <VendorProfile />
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
            <RecentOrders />
            <TopProducts />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InventoryAlerts />
            <VendorProfile />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
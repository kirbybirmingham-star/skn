import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import VendorOrderList from './VendorOrderList';
import VendorOrderAnalytics from './VendorOrderAnalytics';
import VendorOrderActions from './VendorOrderActions';

const VendorOrderDashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user && profile?.role === 'vendor') {
      fetchVendorOrders();
      fetchAnalytics();
    }
  }, [user, profile]);

  const fetchVendorOrders = async () => {
    try {
      const response = await fetch('/api/vendor/orders?limit=50&sort_by=created_at&sort_order=desc', {
        headers: {
          'Authorization': `Bearer ${user.access_token || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        throw new Error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load orders. Please try again."
      });
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/vendor/orders/analytics?period=30', {
        headers: {
          'Authorization': `Bearer ${user.access_token || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderUpdate = (updatedOrder) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === updatedOrder.id ? updatedOrder : order
      )
    );
    // Refresh analytics after order update
    fetchAnalytics();
  };

  const handleBulkAction = async (action, orderIds) => {
    try {
      // Implement bulk actions here
      toast({
        title: "Bulk Action",
        description: `${action} applied to ${orderIds.length} orders`
      });

      // Refresh orders and analytics
      await fetchVendorOrders();
      await fetchAnalytics();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Bulk action failed. Please try again."
      });
    }
  };

  if (!user || profile?.role !== 'vendor') {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">This dashboard is only available to vendors.</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-24 animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const pendingOrders = orders.filter(order => order.order_status === 'pending' || order.order_status === 'confirmed');
  const processingOrders = orders.filter(order => order.order_status === 'processing');
  const shippedOrders = orders.filter(order => order.order_status === 'shipped');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendor Order Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage and track your product orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchVendorOrders}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📦</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Badge variant="secondary">{pendingOrders.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Badge variant="secondary">{processingOrders.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{processingOrders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped</CardTitle>
            <Badge variant="secondary">{shippedOrders.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{shippedOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Order #{order.id.slice(-8)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(order.order_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          order.order_status === 'pending' ? 'secondary' :
                          order.order_status === 'processing' ? 'default' :
                          order.order_status === 'shipped' ? 'default' : 'outline'
                        }>
                          {order.order_status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          ${(order.total_price / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No orders yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('orders')}
                >
                  📋 Manage Orders
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setActiveTab('analytics')}
                >
                  📊 View Analytics
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  disabled={orders.length === 0}
                >
                  🔔 Notification Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <VendorOrderList
            orders={orders}
            onOrderUpdate={handleOrderUpdate}
            onBulkAction={handleBulkAction}
            onRefresh={fetchVendorOrders}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <VendorOrderAnalytics analytics={analytics} />
        </TabsContent>
      </Tabs>

      {/* Action Modal */}
      <VendorOrderActions />
    </div>
  );
};

export default VendorOrderDashboard;
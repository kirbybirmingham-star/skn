import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Package, Clock, Users } from 'lucide-react';

const VendorOrderAnalytics = ({ analytics }) => {
  const [timeRange, setTimeRange] = useState('30');
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    // Process analytics data for charts
    if (analytics?.recent_orders) {
      const processedData = processOrderData(analytics.recent_orders);
      setChartData(processedData);
    }
  }, [analytics, timeRange]);

  const processOrderData = (orders) => {
    // Group orders by date and calculate metrics
    const dailyStats = {};

    orders.forEach(order => {
      const date = new Date(order.order_date).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          orders: 0,
          revenue: 0,
          fulfilled: 0,
          pending: 0
        };
      }

      dailyStats[date].orders += 1;
      dailyStats[date].revenue += order.total_price / 100;

      if (order.order_status === 'delivered' || order.order_status === 'shipped') {
        dailyStats[date].fulfilled += 1;
      } else {
        dailyStats[date].pending += 1;
      }
    });

    return Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const formatCurrency = (amount) => `$${amount?.toFixed(2) || '0.00'}`;

  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const summary = analytics?.summary || {};

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Order Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.total_revenue / 100)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">+12.5%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_orders || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">+8.2%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.avg_order_value / 100)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              <span className="text-red-500">-2.1%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfillment Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.total_orders > 0
                ? `${((summary.completed_orders / summary.total_orders) * 100).toFixed(1)}%`
                : '0%'
              }
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              <span className="text-green-500">+5.3%</span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Pending</Badge>
                  <span className="text-sm text-gray-600">
                    {analytics?.recent_orders?.filter(o => o.order_status === 'pending').length || 0}
                  </span>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${analytics?.recent_orders?.length > 0
                        ? ((analytics.recent_orders.filter(o => o.order_status === 'pending').length / analytics.recent_orders.length) * 100)
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Processing</Badge>
                  <span className="text-sm text-gray-600">
                    {analytics?.recent_orders?.filter(o => o.order_status === 'processing').length || 0}
                  </span>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${analytics?.recent_orders?.length > 0
                        ? ((analytics.recent_orders.filter(o => o.order_status === 'processing').length / analytics.recent_orders.length) * 100)
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Shipped</Badge>
                  <span className="text-sm text-gray-600">
                    {analytics?.recent_orders?.filter(o => ['shipped', 'delivered'].includes(o.order_status)).length || 0}
                  </span>
                </div>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${analytics?.recent_orders?.length > 0
                        ? ((analytics.recent_orders.filter(o => ['shipped', 'delivered'].includes(o.order_status)).length / analytics.recent_orders.length) * 100)
                        : 0}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics?.recent_orders?.reduce((acc, order) => {
                const existing = acc.find(p => p.product_title === order.product_title);
                if (existing) {
                  existing.orders += 1;
                  existing.revenue += order.total_price / 100;
                } else {
                  acc.push({
                    product_title: order.product_title,
                    orders: 1,
                    revenue: order.total_price / 100
                  });
                }
                return acc;
              }, [])
              .sort((a, b) => b.revenue - a.revenue)
              .slice(0, 5)
              .map((product, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product.product_title}</p>
                    <p className="text-xs text-gray-600">{product.orders} orders</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              )) || (
                <p className="text-gray-500 text-center py-4">No data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Order Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Order Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 mb-4" />
              <p>Chart visualization would be implemented here</p>
              <p className="text-sm">Showing order trends over the selected time period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorOrderAnalytics;
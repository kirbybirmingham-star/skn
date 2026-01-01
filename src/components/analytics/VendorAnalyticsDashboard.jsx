import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Download, TrendingUp, Package, DollarSign, Target } from 'lucide-react';

const VendorAnalyticsDashboard = ({ vendorId }) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({});
  const [revenueTrends, setRevenueTrends] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  });
  const [period, setPeriod] = useState('daily');

  useEffect(() => {
    if (vendorId) {
      fetchAnalytics();
    }
  }, [vendorId, dateRange, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        start_date: dateRange.from?.toISOString(),
        end_date: dateRange.to?.toISOString(),
        period
      });

      // Fetch vendor metrics
      const metricsResponse = await fetch(`/api/analytics/vendor/${vendorId}/metrics?${params}`);
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);

      // Fetch vendor revenue trends
      const trendsResponse = await fetch(`/api/analytics/vendor/${vendorId}/revenue-trends?${params}`);
      const trendsData = await trendsResponse.json();
      setRevenueTrends(trendsData.trends);

      // Fetch vendor top products
      const productsResponse = await fetch(`/api/analytics/vendor/${vendorId}/top-products?${params}`);
      const productsData = await productsResponse.json();
      setTopProducts(productsData);

    } catch (error) {
      console.error('Error fetching vendor analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (type) => {
    try {
      const response = await fetch(`/api/analytics/export/${type}?vendor_id=${vendorId}&start_date=${dateRange.from?.toISOString()}&end_date=${dateRange.to?.toISOString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-analytics.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value / 100); // Assuming values are in cents
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendor Analytics</h1>
          <p className="text-gray-600 mt-2">Performance insights for your store</p>
        </div>
        <div className="flex gap-4">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
          />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              From {metrics.uniqueOrders || 0} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.averageOrderValue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Per order performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfillment Rate</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.fulfillmentRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Orders successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipping Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.shippingRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Orders shipped on time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Performance</CardTitle>
              <CardDescription>
                Your revenue trends over time ({period} view)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={revenueTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Your Best Performing Products</CardTitle>
              <CardDescription>
                Products driving the most revenue for your store
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topProducts.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="productName" angle={-45} textAnchor="end" height={100} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Legend />
                  <Bar dataKey="totalRevenue" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Volume</CardTitle>
                <CardDescription>
                  Total quantity sold across your products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {metrics.totalQuantity || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Units sold in selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unique Orders</CardTitle>
                <CardDescription>
                  Number of distinct orders containing your products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {metrics.uniqueOrders || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Customer transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Order Value</CardTitle>
                <CardDescription>
                  Revenue per order for your products
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {formatCurrency(metrics.averageOrderValue || 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Average value per order
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fulfillment Metrics</CardTitle>
                <CardDescription>
                  Order processing and delivery performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Fulfillment Rate</span>
                    <Badge variant={metrics.fulfillmentRate > 90 ? "default" : "secondary"}>
                      {(metrics.fulfillmentRate || 0).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Shipping Rate</span>
                    <Badge variant={metrics.shippingRate > 85 ? "default" : "secondary"}>
                      {(metrics.shippingRate || 0).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Your Analytics</CardTitle>
              <CardDescription>
                Download your performance data for external analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => exportData('revenue-trends')} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Revenue Trends CSV
                </Button>
                <Button onClick={() => exportData('top-products')} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Top Products CSV
                </Button>
                <Button onClick={() => exportData('orders')} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Orders Data CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorAnalyticsDashboard;
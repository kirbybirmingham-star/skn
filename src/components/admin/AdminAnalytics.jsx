import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  ShoppingCart,
  Store,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AdminAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalProducts: 0,
    totalRevenue: 0,
    userGrowth: 0,
    vendorGrowth: 0,
    revenueGrowth: 0,
    userRegistrations: [],
    revenueData: [],
    userRoles: [],
    topProducts: [],
    topCategories: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch users data
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*');

      const { data: vendors, error: vendorsError } = await supabase
        .from('vendors')
        .select('*');

      const { data: products, error: productsError } = await supabase
        .from('vendor_products')
        .select('*');

      // Calculate metrics
      const totalUsers = users?.length || 0;
      const totalVendors = vendors?.length || 0;
      const totalProducts = products?.length || 0;

      // User registrations over time (mock data for now)
      const userRegistrations = generateMockRegistrationData();

      // Revenue data (mock for now since no real orders)
      const revenueData = generateMockRevenueData();

      // User roles breakdown
      const userRoles = calculateUserRoles(users || []);

      // Top products (mock data)
      const topProducts = generateMockTopProducts();

      // Top categories (mock data)
      const topCategories = generateMockTopCategories();

      setAnalyticsData({
        totalUsers,
        totalVendors,
        totalProducts,
        totalRevenue: 0, // Real data when orders exist
        userGrowth: 0, // Calculate from date ranges
        vendorGrowth: 0,
        revenueGrowth: 0,
        userRegistrations,
        revenueData,
        userRoles,
        topProducts,
        topCategories
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockRegistrationData = () => [
    { date: '2024-11-01', count: 2 },
    { date: '2024-11-02', count: 1 },
    { date: '2024-11-03', count: 3 },
    { date: '2024-11-04', count: 1 },
    { date: '2024-11-05', count: 2 },
    { date: '2024-11-06', count: 4 },
    { date: '2024-11-07', count: 1 }
  ];

  const generateMockRevenueData = () => [
    { month: 'Aug', revenue: 0 },
    { month: 'Sep', revenue: 0 },
    { month: 'Oct', revenue: 0 },
    { month: 'Nov', revenue: 1200 }
  ];

  const calculateUserRoles = (users) => {
    const roles = users.reduce((acc, user) => {
      const role = user.role || 'buyer';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(roles).map(([role, count]) => ({
      role: role.charAt(0).toUpperCase() + role.slice(1),
      count,
      percentage: ((count / users.length) * 100).toFixed(1)
    }));
  };

  const generateMockTopProducts = () => [
    { name: 'Laptop', sales: 15, revenue: 22500 },
    { name: 'T-Shirt', sales: 8, revenue: 1200 },
    { name: 'Coffee Mug', sales: 12, revenue: 600 },
    { name: 'Smartphone', sales: 6, revenue: 4800 },
    { name: 'Jeans', sales: 10, revenue: 2000 }
  ];

  const generateMockTopCategories = () => [
    { name: 'Electronics', count: 21, percentage: 42 },
    { name: 'Clothing', count: 18, percentage: 36 },
    { name: 'Home & Garden', count: 8, percentage: 16 },
    { name: 'Books', count: 3, percentage: 6 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
        <div className="flex items-center space-x-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={fetchAnalyticsData}
            className="p-2 text-gray-600 hover:text-gray-800"
            title="Refresh data"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm"
            title="Export data"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${analyticsData.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600">+{analyticsData.revenueGrowth}% from last month</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalUsers}</p>
              <p className="text-sm text-blue-600">+{analyticsData.userGrowth}% from last month</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Vendors</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalVendors}</p>
              <p className="text-sm text-purple-600">+{analyticsData.vendorGrowth}% from last month</p>
            </div>
            <Store className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalProducts}</p>
              <p className="text-sm text-orange-600">Live products</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registrations Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Registrations</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData.userRegistrations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Roles Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analyticsData.userRoles}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ role, percentage }) => `${role}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analyticsData.userRoles.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {analyticsData.topProducts.slice(0, 5).map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.sales} sales</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">${product.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Categories</h3>
          <div className="space-y-3">
            {analyticsData.topCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{category.name}</p>
                  <p className="text-xs text-gray-500">{category.count} products</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{category.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Export Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Export</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">User Data</h4>
                <p className="text-sm text-gray-500">Export all user information</p>
              </div>
            </div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Vendor Data</h4>
                <p className="text-sm text-gray-500">Export vendor and product data</p>
              </div>
            </div>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Sales Data</h4>
                <p className="text-sm text-gray-500">Export order and transaction data</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
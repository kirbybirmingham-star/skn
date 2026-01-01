import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/SupabaseAuthContext';
import OrderCard from '../components/orders/OrderCard';
import OrderFilters from '../components/orders/OrderFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

// Mock API calls - will be replaced with actual API integration
const mockFetchOrders = async (filters) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock data - replace with actual API call
  const mockOrders = [
    {
      id: 'ord_123456789',
      status: 'delivered',
      total_amount: 12999, // $129.99
      created_at: '2024-11-10T14:30:00Z',
      order_items: [
        {
          id: 'item_1',
          quantity: 2,
          unit_price: 6499, // $64.99
          total_price: 12998,
          products: {
            title: 'Premium Wireless Headphones',
            images: ['https://via.placeholder.com/100']
          }
        }
      ],
      tracking_number: 'TRK123456789'
    },
    {
      id: 'ord_987654321',
      status: 'shipped',
      total_amount: 8999, // $89.99
      created_at: '2024-11-08T09:15:00Z',
      order_items: [
        {
          id: 'item_2',
          quantity: 1,
          unit_price: 8999,
          total_price: 8999,
          products: {
            title: 'Smart Fitness Watch',
            images: ['https://via.placeholder.com/100']
          }
        }
      ],
      tracking_number: 'TRK987654321'
    }
  ];

  // Apply filters
  let filteredOrders = [...mockOrders];

  if (filters.status) {
    filteredOrders = filteredOrders.filter(order => order.status === filters.status);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredOrders = filteredOrders.filter(order =>
      order.id.toLowerCase().includes(searchLower) ||
      order.order_items.some(item =>
        item.products.title.toLowerCase().includes(searchLower)
      )
    );
  }

  // Apply sorting
  filteredOrders.sort((a, b) => {
    let aValue, bValue;

    switch (filters.sort_by) {
      case 'created_at':
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
        break;
      case 'total_amount':
        aValue = a.total_amount;
        bValue = b.total_amount;
        break;
      default:
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
    }

    if (filters.sort_order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Apply pagination
  const startIndex = (filters.page - 1) * filters.limit;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + filters.limit);

  return {
    orders: paginatedOrders,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: filteredOrders.length,
      total_pages: Math.ceil(filteredOrders.length / filters.limit)
    }
  };
};

const OrderHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  });

  const [filters, setFilters] = useState({
    status: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    limit: 20
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await mockFetchOrders(filters);

      setOrders(response.orders);
      setPagination(response.pagination);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again.');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load orders. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, filters]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleViewOrderDetails = (orderId) => {
    navigate(`/orders/${orderId}`);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Please Sign In</h2>
              <p className="text-gray-600 mb-4">
                You need to be signed in to view your order history.
              </p>
              <Button onClick={() => navigate('/login')}>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Order History</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <OrderFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalOrders={pagination.total}
          isLoading={loading}
        />

        {/* Orders List */}
        <div className="mt-8">
          {loading && orders.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Orders</h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={fetchOrders}>Try Again</Button>
                </div>
              </CardContent>
            </Card>
          ) : orders.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                  <p className="text-gray-600 mb-4">
                    {filters.status || filters.search
                      ? 'Try adjusting your filters to see more orders.'
                      : 'You haven\'t placed any orders yet.'
                    }
                  </p>
                  {!filters.status && !filters.search && (
                    <Button onClick={() => navigate('/marketplace')}>
                      Start Shopping
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Orders Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onViewDetails={handleViewOrderDetails}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} orders
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.total_pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.total_pages - 2) {
                          pageNum = pagination.total_pages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }

                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className="w-8 h-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.total_pages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryPage;
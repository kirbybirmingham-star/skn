import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import VendorOrderCard from './VendorOrderCard';
import OrderFulfillmentModal from './OrderFulfillmentModal';

const VendorOrderList = ({ orders, onOrderUpdate, onBulkAction, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFulfillmentModal, setShowFulfillmentModal] = useState(false);
  const [selectedOrderForFulfillment, setSelectedOrderForFulfillment] = useState(null);

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter(order => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.product_title?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.order_status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'order_date':
          aValue = new Date(a.order_date);
          bValue = new Date(b.order_date);
          break;
        case 'total_price':
          aValue = a.total_price;
          bValue = b.total_price;
          break;
        case 'order_status':
          aValue = a.order_status;
          bValue = b.order_status;
          break;
        default:
          aValue = a.order_date;
          bValue = b.order_date;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleOrderSelect = (orderId, isSelected) => {
    setSelectedOrders(prev =>
      isSelected
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    );
  };

  const handleSelectAll = (isSelected) => {
    setSelectedOrders(isSelected ? filteredAndSortedOrders.map(order => order.id) : []);
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrders.length === 0) return;

    await onBulkAction(`status_update_${newStatus}`, selectedOrders);
    setSelectedOrders([]);
  };

  const handleFulfillOrder = (order) => {
    setSelectedOrderForFulfillment(order);
    setShowFulfillmentModal(true);
  };

  const handleFulfillmentComplete = (updatedOrder) => {
    onOrderUpdate(updatedOrder);
    setShowFulfillmentModal(false);
    setSelectedOrderForFulfillment(null);
  };

  const formatCurrency = (amount) => `$${(amount / 100).toFixed(2)}`;

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'processing': return 'default';
      case 'packed': return 'default';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'destructive';
      case 'refunded': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                placeholder="Search orders by ID, customer, or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="packed">Packed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="order_date">Order Date</SelectItem>
                <SelectItem value="total_price">Total Price</SelectItem>
                <SelectItem value="order_status">Status</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>

            {/* Refresh */}
            <Button variant="outline" onClick={onRefresh}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium">
                {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
              </span>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('processing')}
                >
                  Mark Processing
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('shipped')}
                >
                  Mark Shipped
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkStatusUpdate('cancelled')}
                >
                  Cancel Orders
                </Button>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedOrders([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {filteredAndSortedOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                {orders.length === 0 ? 'No orders found.' : 'No orders match your filters.'}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-2 px-4">
              <Checkbox
                checked={selectedOrders.length === filteredAndSortedOrders.length && filteredAndSortedOrders.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label className="text-sm font-medium">
                Select All ({filteredAndSortedOrders.length} orders)
              </label>
            </div>

            {/* Order Cards */}
            {filteredAndSortedOrders.map((order) => (
              <VendorOrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrders.includes(order.id)}
                onSelect={handleOrderSelect}
                onFulfill={handleFulfillOrder}
                onUpdate={onOrderUpdate}
              />
            ))}
          </>
        )}
      </div>

      {/* Pagination could be added here */}

      {/* Fulfillment Modal */}
      {showFulfillmentModal && selectedOrderForFulfillment && (
        <OrderFulfillmentModal
          order={selectedOrderForFulfillment}
          onClose={() => {
            setShowFulfillmentModal(false);
            setSelectedOrderForFulfillment(null);
          }}
          onComplete={handleFulfillmentComplete}
        />
      )}
    </div>
  );
};

export default VendorOrderList;
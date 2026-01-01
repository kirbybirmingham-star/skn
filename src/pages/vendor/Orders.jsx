import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getVendorByOwner } from '@/api/EcommerceApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const VendorOrders = () => {
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        // Get vendor info
        const vendorData = await getVendorByOwner(user.id);
        setVendor(vendorData);

        // Mock orders data for now (since we don't have order management backend yet)
        const mockOrders = [
          {
            id: 'ORD-001',
            customer: 'John Smith',
            total: 125.99,
            status: 'pending',
            items: 3,
            date: '2025-11-16',
            products: ['Mango Passion Smoothie', 'Pineapple Ginger Cooler']
          },
          {
            id: 'ORD-002',
            customer: 'Jane Doe',
            total: 89.50,
            status: 'fulfilled',
            items: 2,
            date: '2025-11-15',
            products: ['Caribbean Bead Necklace']
          },
          {
            id: 'ORD-003',
            customer: 'Bob Johnson',
            total: 45.00,
            status: 'shipped',
            items: 1,
            date: '2025-11-14',
            products: ['Fresh Caribbean Mangoes']
          }
        ];

        setOrders(mockOrders);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'fulfilled': return 'bg-green-500';
      case 'shipped': return 'bg-blue-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <p className="text-gray-600 mt-1">View and manage your customer orders</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders yet</h3>
              <p className="text-gray-500 text-center">When customers purchase your products, their orders will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                    <p className="text-sm text-gray-600">{order.customer} • {order.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    <span className="text-lg font-bold">${order.total}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Items: {order.items}</span>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline">Mark as Fulfilled</Button>
                          <Button size="sm">Ship Order</Button>
                        </>
                      )}
                      {order.status === 'fulfilled' && (
                        <Button size="sm">Mark as Shipped</Button>
                      )}
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <strong>Products:</strong> {order.products.join(', ')}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {orders.length > 0 && (
        <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
          <span>Showing {orders.length} orders</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorOrders;

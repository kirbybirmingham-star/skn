import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getVendorByOwner, getVendorOrders } from '@/api/EcommerceApi';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const VendorOrders = () => {
  const { user, profile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadOrders = async () => {
      const ownerId = profile?.id || user?.id;
      if (!ownerId) {
        setLoading(false);
        return;
      }

      try {
        console.log('[VendorOrders] Loading for owner:', ownerId);
        const vendorData = await getVendorByOwner(ownerId);
        console.log('[VendorOrders] Vendor data:', vendorData);
        setVendor(vendorData);
        
        if (vendorData?.id) {
          const ordersData = await getVendorOrders(vendorData.id);
          console.log('[VendorOrders] Orders data:', ordersData);
          setOrders(ordersData);
        }
      } catch (err) {
        console.error('Failed to load orders', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [user, profile]);

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Orders</h1>
          <p className="text-slate-600">Manage and track your customer orders</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading orders...</div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <p className="text-slate-500 mb-4">No orders yet</p>
            <p className="text-sm text-slate-400">When customers purchase your products, orders will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Order ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold">Total</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-blue-600">{order.orderId}</td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">Customer {order.userId?.slice(0, 8)}</p>
                          <p className="text-xs text-slate-500">{order.userEmail}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold">${(order.totalPrice / 100).toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VendorOrders;

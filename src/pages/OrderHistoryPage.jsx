import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import ordersApi from '@/api/ordersApi';
import { Package, ChevronRight, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Confirmed' },
  processing: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Processing' },
  shipped: { icon: Package, color: 'text-green-600', bg: 'bg-green-50', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Delivered' },
  cancelled: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelled' },
  refunded: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Refunded' }
};

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await ordersApi.getMyOrders();
      setOrders(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => order.status === filter);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (cents) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 p-4">
      <Helmet>
        <title>Order History - SKN Bridge Trade</title>
        <meta name="description" content="View your order history" />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
            <Package className="w-10 h-10 text-blue-600" />
            Order History
          </h1>
          <p className="text-slate-600">Track and manage all your orders</p>
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg p-12 text-center"
          >
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No orders found</h3>
            <p className="text-slate-500 mb-6">
              {filter === 'all'
                ? "You haven't placed any orders yet."
                : `No ${filter} orders found.`}
            </p>
            <Button
              onClick={() => navigate('/marketplace')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue Shopping
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, index) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const Icon = config.icon;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`${config.bg} p-3 rounded-lg`}>
                        <Icon className={`w-6 h-6 ${config.color}`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-slate-800">Order #{order.id.slice(0, 8)}</h3>
                          <span className={`text-sm font-medium px-2 py-1 rounded ${config.bg} ${config.color}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          Ordered on {formatDate(order.created_at)}
                        </p>
                        {order.items && (
                          <p className="text-sm text-slate-600 mt-1">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-800 mb-2">
                        {formatPrice(order.total_amount_cents)}
                      </p>
                      <ChevronRight className="w-6 h-6 text-slate-400" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

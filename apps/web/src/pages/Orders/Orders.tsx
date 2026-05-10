import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { orderApi } from '../../services/endpoints';
import { useSocket } from '../../hooks/useSocket';
import type { IOrder } from 'shared-types';
import toast from 'react-hot-toast';
import './Orders.css';

const STATUS_LABELS: Record<string, string> = {
  pending: '⏳ Pending',
  accepted: '✅ Accepted',
  preparing: '👨‍🍳 Preparing',
  ready: '📦 Ready',
  courier_assigned: '🚴 Courier Assigned',
  in_transit: '🛵 On the Way',
  delivered: '✅ Delivered',
  cancelled: '❌ Cancelled',
};

export const Orders = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { onOrderStatusUpdate } = useSocket();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const unsubscribe = onOrderStatusUpdate((data) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === data.orderId ? { ...o, status: data.status } : o
        )
      );
      toast.success(`Order updated: ${STATUS_LABELS[data.status] || data.status}`);
    });
    return unsubscribe;
  }, [onOrderStatusUpdate]);

  const fetchOrders = async () => {
    try {
      const { data } = await orderApi.getMyOrders(1, 20);
      setOrders(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page container orders-loading">
        <Loader2 size={32} className="spin" />
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page page">
      <div className="container">
        <h1>My Orders</h1>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <Package size={64} strokeWidth={1} />
            <h2>No orders yet</h2>
            <p>Start ordering from your favorite restaurants!</p>
            <Link to="/discover" className="btn btn-primary">Browse Restaurants</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <Link to={`/orders/${order._id}`} key={order._id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-number">{order.orderNumber}</span>
                    <span className="order-date">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <span className={`badge status-${order.status}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                <div className="order-card-body">
                  <div className="order-items-preview">
                    {order.items.slice(0, 3).map((item, i) => (
                      <span key={i}>{item.name} × {item.quantity}</span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="more-items">+{order.items.length - 3} more</span>
                    )}
                  </div>
                  <div className="order-card-footer">
                    <span className="order-total">₹{order.total.toFixed(2)}</span>
                    <span className="order-type badge badge-info">{order.type}</span>
                    <ChevronRight size={18} className="order-arrow" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

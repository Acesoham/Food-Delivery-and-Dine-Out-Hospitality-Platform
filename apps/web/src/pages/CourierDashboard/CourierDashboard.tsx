import { useState, useEffect, useCallback } from 'react';
import {
  Bike, MapPin, Package, RefreshCw, CheckCircle, Loader2,
  TrendingUp, Truck, IndianRupee, Navigation,
} from 'lucide-react';
import { orderApi } from '../../services/endpoints';
import { useAuthStore } from '../../store/authStore';
import type { IOrder } from 'shared-types';
import toast from 'react-hot-toast';
import './CourierDashboard.css';

/* ── Extended order type with courier extras ── */
interface CourierOrder extends IOrder {
  _distanceKm?: number;
  _estimatedEarnings?: number;
  restaurantId: any;
  consumerId: any;
  courierId: any;
}

/* ── Helpers ── */
const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const statusLabel: Record<string, string> = {
  pending:          '⏳ Just Placed',
  accepted:         '✅ Confirmed',
  preparing:        '👨‍🍳 Preparing',
  ready:            '📦 Ready',
  courier_assigned: 'Accepted',
  in_transit:       'In Transit',
  delivered:        'Delivered',
};

// Color class for status pill
const statusPillClass: Record<string, string> = {
  pending:          'pill-pending',
  accepted:         'pill-accepted',
  preparing:        'pill-preparing',
  ready:            'pill-ready',
};

/* ── Component ── */
export const CourierDashboard = () => {
  const { user } = useAuthStore();

  const [tab, setTab] = useState<'available' | 'active' | 'history'>('available');

  // Location
  const [lat, setLat] = useState(19.9975);
  const [lng, setLng] = useState(73.7898);
  const [locationText, setLocationText] = useState('Nashik, Maharashtra (default)');
  const [locating, setLocating] = useState(false);

  // Data
  const [available, setAvailable] = useState<CourierOrder[]>([]);
  const [myOrders, setMyOrders] = useState<CourierOrder[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [loadingMy, setLoadingMy] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  /* ── Fetch available deliveries ── */
  const fetchAvailable = useCallback(async () => {
    setLoadingAvail(true);
    try {
      const { data } = await orderApi.getAvailableDeliveries(lat, lng);
      setAvailable((data.data as CourierOrder[]) || []);
    } catch {
      toast.error('Could not load available orders');
    } finally {
      setLoadingAvail(false);
    }
  }, [lat, lng]);

  /* ── Fetch my deliveries ── */
  const fetchMyOrders = useCallback(async () => {
    setLoadingMy(true);
    try {
      const { data } = await orderApi.getMyCourierDeliveries();
      setMyOrders((data.data as CourierOrder[]) || []);
    } catch {
      toast.error('Could not load your deliveries');
    } finally {
      setLoadingMy(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailable();
    fetchMyOrders();
  }, [fetchAvailable, fetchMyOrders]);

  /* ── Get real geolocation ── */
  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationText(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setLocating(false);
        toast.success('Location updated!');
        fetchAvailable();
      },
      () => {
        setLocating(false);
        toast.error('Could not get location. Using default.');
      }
    );
  };

  /* ── Accept delivery ── */
  const acceptDelivery = async (order: CourierOrder) => {
    setAcceptingId(order._id);
    try {
      const { data } = await orderApi.acceptDelivery(order._id);
      toast.success(`🛵 You're delivering from ${order.restaurantId?.name || 'restaurant'}!`);
      setAvailable((prev) => prev.filter((o) => o._id !== order._id));
      setMyOrders((prev) => [data.data as CourierOrder, ...prev]);
      setTab('active');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to accept delivery');
    } finally {
      setAcceptingId(null);
    }
  };

  /* ── Update delivery status ── */
  const updateStatus = async (orderId: string, status: 'in_transit' | 'delivered') => {
    setUpdatingId(orderId);
    try {
      const { data } = await orderApi.updateDeliveryStatus(orderId, status);
      setMyOrders((prev) => prev.map((o) => (o._id === orderId ? (data.data as CourierOrder) : o)));
      const msgs: Record<string, string> = {
        in_transit: '🚀 Marked as In Transit!',
        delivered: '🎉 Order delivered! Great work!',
      };
      toast.success(msgs[status] || 'Status updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  /* ── Computed stats ── */
  const delivered = myOrders.filter((o) => o.status === 'delivered');
  const active = myOrders.filter((o) => ['courier_assigned', 'in_transit'].includes(o.status));
  const totalEarnings = delivered.reduce((acc, o) => acc + ((o as any)._estimatedEarnings || 30), 0);
  const totalKm = delivered.reduce((acc, o) => acc + ((o as any)._distanceKm || 0), 0);

  const firstName = user?.profile?.firstName || 'Courier';
  const initials = `${user?.profile?.firstName?.[0] || ''}${user?.profile?.lastName?.[0] || ''}`.toUpperCase() || 'C';

  return (
    <div className="courier-page">
      {/* ── Hero ── */}
      <div className="courier-hero">
        <div className="courier-hero-inner">
          <div className="courier-hero-left">
            <div className="courier-avatar">{initials}</div>
            <div>
              <h1 className="courier-hero-title">Welcome, {firstName}! 👋</h1>
              <p className="courier-hero-sub">Courier Dashboard · Real-time delivery management</p>
            </div>
          </div>
          <div className="courier-online-badge">
            <span className="courier-online-dot" />
            Online & Ready
          </div>
        </div>
      </div>

      <div className="courier-main">
        {/* ── Stats ── */}
        <div className="courier-stats">
          <div className="courier-stat-card stat-earnings">
            <span className="courier-stat-label">Today's Earnings</span>
            <span className="courier-stat-value">₹{totalEarnings}</span>
            <span className="courier-stat-sub">{delivered.length} deliveries</span>
          </div>
          <div className="courier-stat-card stat-deliveries">
            <span className="courier-stat-label">Total Delivered</span>
            <span className="courier-stat-value">{delivered.length}</span>
            <span className="courier-stat-sub">lifetime orders</span>
          </div>
          <div className="courier-stat-card stat-active">
            <span className="courier-stat-label">Active Now</span>
            <span className="courier-stat-value">{active.length}</span>
            <span className="courier-stat-sub">in progress</span>
          </div>
          <div className="courier-stat-card stat-km">
            <span className="courier-stat-label">Km Covered</span>
            <span className="courier-stat-value">{totalKm.toFixed(1)}</span>
            <span className="courier-stat-sub">total distance</span>
          </div>
        </div>

        {/* ── Location Bar ── */}
        <div className="courier-location-bar">
          <MapPin size={16} />
          <span style={{ flex: 1 }}>📍 {locationText}</span>
          <button className="courier-location-btn" onClick={getLocation} disabled={locating}>
            {locating ? <Loader2 size={14} className="spin" /> : <Navigation size={14} />}
            {locating ? 'Getting location…' : 'Use My Location'}
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="courier-tabs">
          <button
            className={`courier-tab-btn ${tab === 'available' ? 'active' : ''}`}
            onClick={() => { setTab('available'); fetchAvailable(); }}
          >
            <Package size={16} />
            Available
            {available.length > 0 && (
              <span className="courier-tab-badge">{available.length}</span>
            )}
          </button>
          <button
            className={`courier-tab-btn ${tab === 'active' ? 'active' : ''}`}
            onClick={() => { setTab('active'); fetchMyOrders(); }}
          >
            <Truck size={16} />
            Active
            {active.length > 0 && (
              <span className="courier-tab-badge">{active.length}</span>
            )}
          </button>
          <button
            className={`courier-tab-btn ${tab === 'history' ? 'active' : ''}`}
            onClick={() => { setTab('history'); fetchMyOrders(); }}
          >
            <TrendingUp size={16} />
            History
          </button>
        </div>

        {/* ══ AVAILABLE ORDERS ═════════════════════════════════════ */}
        {tab === 'available' && (
          <>
            <div className="courier-section-header">
              <h2 className="courier-section-title">🛵 Available Orders Nearby</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="courier-section-count">{available.length} order{available.length !== 1 ? 's' : ''} near you</span>
                <button className="courier-refresh-btn" onClick={fetchAvailable}>
                  <RefreshCw size={14} />
                  Refresh
                </button>
              </div>
            </div>

            {loadingAvail ? (
              <div className="courier-loading">
                <Loader2 size={32} className="spin" />
                <span>Finding orders near you…</span>
              </div>
            ) : available.length === 0 ? (
              <div className="courier-empty">
                <Package size={48} />
                <h3>No orders near you right now</h3>
                <p>Orders appear here as soon as customers place them. Check back soon!</p>
                <button className="courier-refresh-btn" onClick={fetchAvailable}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>
            ) : (
              <div className="courier-orders-grid">
                {available.map((order) => {
                  const rest = order.restaurantId;
                  const restName = rest?.name || 'Restaurant';
                  const restAddr = [rest?.address?.street, rest?.address?.city].filter(Boolean).join(', ');
                  const dist = order._distanceKm ?? 0;
                  const earn = order._estimatedEarnings ?? 30;

                  return (
                    <div key={order._id} className="courier-order-card">
                      <div className="courier-order-top">
                        <div className="courier-order-meta">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <span className="courier-order-num">#{order.orderNumber}</span>
                            <span className={`courier-avail-status ${statusPillClass[order.status] || ''}`}>
                              {statusLabel[order.status] || order.status}
                            </span>
                          </div>
                          <span className="courier-order-rest">{restName}</span>
                          {restAddr && (
                            <span className="courier-order-addr">
                              <MapPin size={12} /> {restAddr}
                            </span>
                          )}
                          {order.deliveryAddress?.street && (
                            <span className="courier-order-addr">
                              → {order.deliveryAddress.street}
                            </span>
                          )}
                        </div>

                        <div className="courier-earnings-pill">
                          <span className="courier-earn-label">You earn</span>
                          <span className="courier-earn-value">₹{earn}</span>
                          <span className="courier-earn-dist">
                            {dist > 0 ? `~${dist} km` : 'est. delivery'}
                          </span>
                        </div>
                      </div>

                      <div className="courier-order-body">
                        <div className="courier-order-items">
                          {order.items.slice(0, 3).map((item, i) => (
                            <div key={i} className="courier-order-item-row">
                              <span>{item.quantity}×</span> {item.name} — <span>₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="courier-order-item-row" style={{ color: 'var(--text-muted)' }}>
                              +{order.items.length - 3} more items
                            </div>
                          )}
                          <div className="courier-order-total">
                            Order value: <strong>₹{order.total}</strong>
                            &nbsp;·&nbsp;
                            <span className="courier-time">{timeAgo(order.createdAt)}</span>
                          </div>
                        </div>

                        <button
                          className="courier-accept-btn"
                          onClick={() => acceptDelivery(order)}
                          disabled={acceptingId === order._id}
                        >
                          {acceptingId === order._id ? (
                            <Loader2 size={16} className="spin" />
                          ) : (
                            <CheckCircle size={16} />
                          )}
                          Accept & Deliver
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══ ACTIVE DELIVERIES ═══════════════════════════════════ */}
        {tab === 'active' && (
          <>
            <div className="courier-section-header">
              <h2 className="courier-section-title">🚀 Active Deliveries</h2>
              <button className="courier-refresh-btn" onClick={fetchMyOrders}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {loadingMy ? (
              <div className="courier-loading">
                <Loader2 size={32} className="spin" />
                <span>Loading your deliveries…</span>
              </div>
            ) : active.length === 0 ? (
              <div className="courier-empty">
                <Bike size={48} />
                <h3>No active deliveries</h3>
                <p>Accept an available order to start delivering!</p>
                <button className="courier-refresh-btn" onClick={() => setTab('available')}>
                  <Package size={14} /> View Available
                </button>
              </div>
            ) : (
              <div className="courier-orders-grid">
                {active.map((order) => {
                  const rest = order.restaurantId;
                  const consumer = order.consumerId;
                  const restName = rest?.name || 'Restaurant';
                  const customerName = consumer?.profile
                    ? `${consumer.profile.firstName} ${consumer.profile.lastName}`
                    : 'Customer';
                  const earn = (order as any)._estimatedEarnings ?? 30;
                  const dist = (order as any)._distanceKm ?? 0;

                  return (
                    <div key={order._id} className="courier-my-order-card">
                      <div className="courier-my-order-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span className="courier-my-order-rest">{restName}</span>
                          <span className={`courier-status-pill s-${order.status}`}>
                            {statusLabel[order.status] || order.status}
                          </span>
                        </div>
                        <span className="courier-my-order-details">
                          #{order.orderNumber} · {order.items.length} items · ₹{order.total}
                        </span>
                        <span className="courier-my-order-details">
                          🧑 Delivering to: <strong style={{ color: 'var(--text)' }}>{customerName}</strong>
                        </span>
                        {order.deliveryAddress?.street && (
                          <span className="courier-my-order-details">
                            📍 {order.deliveryAddress.street}
                          </span>
                        )}
                        {dist > 0 && (
                          <span className="courier-my-order-details">
                            🛣️ ~{dist} km delivery
                          </span>
                        )}
                        <span className="courier-time">{timeAgo(order.updatedAt)}</span>
                      </div>

                      <div className="courier-action-row">
                        <span className="courier-my-order-earn">₹{earn}</span>
                        {order.status === 'courier_assigned' && (
                          <button
                            className="courier-action-btn transit"
                            onClick={() => updateStatus(order._id, 'in_transit')}
                            disabled={updatingId === order._id}
                          >
                            {updatingId === order._id ? <Loader2 size={14} className="spin" /> : <Truck size={14} />}
                            Start Transit
                          </button>
                        )}
                        {order.status === 'in_transit' && (
                          <button
                            className="courier-action-btn deliver"
                            onClick={() => updateStatus(order._id, 'delivered')}
                            disabled={updatingId === order._id}
                          >
                            {updatingId === order._id ? <Loader2 size={14} className="spin" /> : <CheckCircle size={14} />}
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══ HISTORY ════════════════════════════════════════════ */}
        {tab === 'history' && (
          <>
            <div className="courier-section-header">
              <h2 className="courier-section-title">📋 Delivery History</h2>
              <span className="courier-section-count">{delivered.length} completed</span>
            </div>

            {loadingMy ? (
              <div className="courier-loading">
                <Loader2 size={32} className="spin" />
              </div>
            ) : delivered.length === 0 ? (
              <div className="courier-empty">
                <IndianRupee size={48} />
                <h3>No completed deliveries yet</h3>
                <p>Complete your first delivery to see your earnings history here.</p>
              </div>
            ) : (
              <div className="courier-orders-grid">
                {delivered.map((order) => {
                  const rest = order.restaurantId;
                  const earn = (order as any)._estimatedEarnings ?? 30;
                  const dist = (order as any)._distanceKm ?? 0;

                  return (
                    <div key={order._id} className="courier-my-order-card">
                      <div className="courier-my-order-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span className="courier-my-order-rest">{rest?.name || 'Restaurant'}</span>
                          <span className="courier-status-pill s-delivered">Delivered</span>
                        </div>
                        <span className="courier-my-order-details">
                          #{order.orderNumber} · {order.items.length} items · ₹{order.total} order value
                        </span>
                        {dist > 0 && (
                          <span className="courier-my-order-details">🛣️ {dist} km</span>
                        )}
                        <span className="courier-time">{timeAgo(order.updatedAt)}</span>
                      </div>
                      <span className="courier-my-order-earn" style={{ fontSize: '1.3rem' }}>+₹{earn}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Loader2, Bike, Star } from 'lucide-react';
import { orderApi } from '../../services/endpoints';
import { useSocket } from '../../hooks/useSocket';
import { GoogleMap, type MapPoint } from '../../components/GoogleMap/GoogleMap';
import { ReviewModal, type ReviewTarget } from '../../components/ReviewModal/ReviewModal';
import type { IOrder } from 'shared-types';
import toast from 'react-hot-toast';
import './Orders.css';

const STATUS_LABELS: Record<string, string> = {
  pending:          '⏳ Pending',
  accepted:         '✅ Accepted',
  preparing:        '👨‍🍳 Preparing',
  ready:            '📦 Ready',
  courier_assigned: '🛵 Courier Assigned',
  in_transit:       '🚀 On the Way',
  delivered:        '✅ Delivered',
  cancelled:        '❌ Cancelled',
};

/* Extended order type — omits string-typed ref fields, redefines as populated objects */
interface ExtOrder extends Omit<IOrder, 'courierId' | 'restaurantId'> {
  courierId?: { _id?: string; profile?: { firstName: string; lastName: string } } | null;
  restaurantId?: { _id?: string; name?: string; address?: any; location?: GeoPoint } | null;
  _courierName?: string;
}

type GeoPoint = { type: 'Point'; coordinates: [number, number] };
type CourierLocationMap = Record<string, MapPoint>;

const geoPointToMapPoint = (point: GeoPoint | undefined, label: string, title?: string): MapPoint | null => {
  const coordinates = point?.coordinates;
  if (!coordinates || coordinates.length !== 2) return null;
  const [lng, lat] = coordinates;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, label, title };
};

const compactPoints = (points: Array<MapPoint | null>) =>
  points.filter((point): point is MapPoint => Boolean(point));

export const Orders = () => {
  const [orders, setOrders] = useState<ExtOrder[]>([]);
  const [courierLocations, setCourierLocations] = useState<CourierLocationMap>({});
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  // Track which orders have been reviewed this session
  const [reviewedOrders, setReviewedOrders] = useState<Set<string>>(new Set());
  const { joinOrderRoom, leaveOrderRoom, onOrderStatusUpdate, onCourierLocationUpdate } = useSocket();

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await orderApi.getMyOrders(1, 20);
      setOrders((data.data as ExtOrder[]) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const trackableOrders = orders.filter((order) =>
      order.type === 'delivery' && !['delivered', 'cancelled'].includes(order.status)
    );
    trackableOrders.forEach((order) => joinOrderRoom(order._id));

    return () => {
      trackableOrders.forEach((order) => leaveOrderRoom(order._id));
    };
  }, [orders, joinOrderRoom, leaveOrderRoom]);

  /* ── Real-time order status updates ── */
  useEffect(() => {
    const unsubscribe = onOrderStatusUpdate((data: any) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o._id !== data.orderId) return o;
          const updated: ExtOrder = { ...o, status: data.status };
          if (data.courierName) {
            updated._courierName = data.courierName;
          }
          return updated;
        })
      );

      if (data.status === 'courier_assigned' && data.courierName) {
        toast.success(`🛵 ${data.courierName} is picking up your order!`, { duration: 5000 });
      } else {
        toast.success(`Order updated: ${STATUS_LABELS[data.status] || data.status}`);
      }
    });

    return () => { unsubscribe?.(); };
  }, [onOrderStatusUpdate]);

  useEffect(() => {
    const unsubscribe = onCourierLocationUpdate((data) => {
      setCourierLocations((prev) => ({
        ...prev,
        [data.orderId]: {
          lat: data.location.lat,
          lng: data.location.lng,
          label: 'D',
          title: 'Delivery partner',
        },
      }));
    });

    return () => { unsubscribe?.(); };
  }, [onCourierLocationUpdate]);

  /* ── Loading ── */
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
            {orders.map((order) => {
              const courierName =
                order._courierName ||
                (order.courierId?.profile
                  ? `${order.courierId.profile.firstName} ${order.courierId.profile.lastName}`
                  : null);

              const showCourierBanner =
                !!courierName && ['courier_assigned', 'in_transit'].includes(order.status);
              const restaurantPoint = geoPointToMapPoint(
                order.restaurantId?.location,
                'R',
                order.restaurantId?.name || 'Restaurant'
              );
              const courierPoint =
                courierLocations[order._id] ||
                geoPointToMapPoint(order.courierLocation as GeoPoint | undefined, 'D', 'Delivery partner');
              const deliveryPoint = geoPointToMapPoint(
                order.deliveryAddress?.location as GeoPoint | undefined,
                'Y',
                'Your delivery address'
              );
              const trackingMarkers = compactPoints([restaurantPoint, courierPoint, deliveryPoint]);
              const routePath = compactPoints([restaurantPoint, courierPoint, deliveryPoint]);
              const showTrackingMap = order.type === 'delivery' && trackingMarkers.length > 0;

              // Review CTA conditions
              const isDelivered = order.status === 'delivered';
              const alreadyReviewed = reviewedOrders.has(order._id);
              const hasCourier = !!order.courierId;

              return (
                <div key={order._id} className={`order-card-wrapper ${showTrackingMap ? 'has-map' : ''}`}>
                  {showCourierBanner && (
                    <div className="courier-banner">
                      <Bike size={15} />
                      <strong>{courierName}</strong> is delivering your order!
                    </div>
                  )}
                  <Link to={`/orders/${order._id}`} className="order-card">
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

                  {/* ── Review CTAs for delivered orders ── */}
                  {isDelivered && !alreadyReviewed && (
                    <div className="order-review-ctas">
                      <button
                        className="order-review-btn"
                        id={`review-order-${order._id}`}
                        onClick={() => setReviewTarget({
                          reviewType: 'order',
                          entityId: order._id,
                          entityName: (order.restaurantId as any)?.name || 'Restaurant',
                          restaurantId: (order.restaurantId as any)?._id || (order.restaurantId as any),
                        })}
                      >
                        <Star size={14} fill="currentColor" />
                        Review Restaurant · Earn up to 90 pts
                      </button>

                      {hasCourier && (
                        <button
                          className="order-review-btn order-review-btn--courier"
                          id={`review-courier-${order._id}`}
                          onClick={() => setReviewTarget({
                            reviewType: 'delivery_person',
                            entityId: order._id,
                            entityName: courierName ? `Delivery by ${courierName}` : 'Delivery Partner',
                          })}
                        >
                          <Bike size={14} />
                          Rate Delivery Partner
                        </button>
                      )}
                    </div>
                  )}

                  {isDelivered && alreadyReviewed && (
                    <div className="order-reviewed-badge">
                      ✅ Reviewed — Points Added!
                    </div>
                  )}

                  {showTrackingMap && (
                    <div className="order-map-panel">
                      <div className="order-map-header">
                        <span>{order.restaurantId?.name || 'Restaurant'}</span>
                        {courierPoint ? (
                          <span>{courierName || 'Delivery partner'} assigned</span>
                        ) : (
                          <span>Awaiting delivery partner</span>
                        )}
                      </div>
                      <GoogleMap
                        markers={trackingMarkers}
                        path={routePath}
                        height={260}
                        fallbackQuery={restaurantPoint ? `${restaurantPoint.lat},${restaurantPoint.lng}` : undefined}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Review Modal ── */}
      {reviewTarget && (
        <ReviewModal
          target={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={(pts) => {
            toast.success(`🎉 Review submitted! You earned ${pts} loyalty points!`, { duration: 5000 });
            // Mark as reviewed in session
            if (reviewTarget.reviewType === 'order' || reviewTarget.reviewType === 'delivery_person') {
              setReviewedOrders((prev) => new Set([...prev, reviewTarget.entityId]));
            }
            setReviewTarget(null);
          }}
        />
      )}
    </div>
  );
};

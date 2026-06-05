import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Store, Package, Settings, UtensilsCrossed, Loader2,
  Plus, Edit2, Trash2, X, ChevronRight, ToggleLeft, ToggleRight,
  Calendar, Users, Clock, CheckCircle, XCircle, Upload, ImageIcon,
  Star, Gift,
} from 'lucide-react';
import api from '../../services/api';
import { restaurantApi, orderApi, uploadApi } from '../../services/endpoints';
import { useAuthStore } from '../../store/authStore';
import { useSocket } from '../../hooks/useSocket';
import { LoyaltyWidget } from '../../components/LoyaltyWidget/LoyaltyWidget';
import type { IRestaurant, IMenuItem, IOrder } from 'shared-types';
import toast from 'react-hot-toast';
import './Dashboard.css';


/* ─── Types ─────────────────────────────────────────────────── */
type MenuItemForm = {
  name: string;
  description: string;
  price: string;
  category: string;
  tags: string;
  preparationTime: string;
};

const EMPTY_ITEM: MenuItemForm = {
  name: '', description: '', price: '', category: '',
  tags: '', preparationTime: '15',
};

type RestaurantForm = {
  name: string; description: string; phone: string; email: string;
  street: string; city: string; state: string; zipCode: string;
  cuisineTypes: string; priceRange: string;
};

const EMPTY_REST: RestaurantForm = {
  name: '', description: '', phone: '', email: '',
  street: '', city: 'Nashik', state: 'Maharashtra', zipCode: '422001',
  cuisineTypes: '', priceRange: '2',
};

/* ─── Component ─────────────────────────────────────────────── */
export const Dashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'reservations' | 'menu' | 'settings'>('orders');
  const [restaurant, setRestaurant] = useState<IRestaurant | null>(null);
  const [menuItems, setMenuItems] = useState<IMenuItem[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveToggling, setLiveToggling] = useState(false);

  // Create/Edit restaurant
  const [showRestForm, setShowRestForm] = useState(false);
  const [restForm, setRestForm] = useState<RestaurantForm>(EMPTY_REST);
  const [restSaving, setRestSaving] = useState(false);
  const [restImageFile, setRestImageFile] = useState<File | null>(null);
  const [restImagePreview, setRestImagePreview] = useState<string>('');
  const restImageRef = useRef<HTMLInputElement>(null);

  // Add/Edit menu item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<IMenuItem | null>(null);
  const [itemForm, setItemForm] = useState<MenuItemForm>(EMPTY_ITEM);
  const [itemSaving, setItemSaving] = useState(false);
  const [itemImageFile, setItemImageFile] = useState<File | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string>('');
  const itemImageRef = useRef<HTMLInputElement>(null);

  const isConsumer = user?.role === 'consumer';
  const isCourier = user?.role === 'courier';
  const isMerchant = user?.role === 'merchant';

  const { socket } = useSocket();

  useEffect(() => {
    if (!isMerchant) { setLoading(false); return; }
    fetchDashboardData();
  }, [user]);

  // Listen for real-time courier assignments on the restaurant socket room
  useEffect(() => {
    if (!socket || !restaurant) return;
    socket.emit('joinMerchantRoom' as any, restaurant._id);

    const handleCourierAssigned = (data: any) => {
      setOrders((prev) =>
        prev.map((o) =>
          o._id === data.orderId ? { ...o, status: 'courier_assigned' as any } : o
        )
      );
      toast.success(`🛵 ${data.courierName || 'A courier'} accepted order #${data.orderId.slice(-6)}!`, { duration: 5000 });
    };

    socket.on('courierAssigned' as any, handleCourierAssigned);
    return () => { socket.off('courierAssigned' as any, handleCourierAssigned); };
  }, [socket, restaurant]);

  const fetchDashboardData = async () => {
    try {
      const { data: myRests } = await restaurantApi.getMyRestaurants();
      if (myRests.data.length > 0) {
        const rest = myRests.data[0];
        setRestaurant(rest);
        const [menuRes, ordersRes, resRes] = await Promise.all([
          restaurantApi.getMenu(rest._id),
          orderApi.getRestaurantOrders(rest._id),
          api.get<{ success: boolean; data: any[] }>(`/reservations/restaurant/${rest._id}`).catch(() => ({ data: { data: [] } })),
        ]);
        setMenuItems(menuRes.data.data);
        setOrders(ordersRes.data.data);
        setReservations((resRes as any).data.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  /* ── Update Reservation Status ── */
  const updateReservationStatus = async (resId: string, status: string) => {
    try {
      await api.patch(`/reservations/${resId}/status`, { status });
      setReservations((prev) =>
        prev.map((r) => (r._id === resId ? { ...r, status } : r))
      );
      toast.success(`Reservation ${status}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update reservation');
    }
  };

  /* ── Create Restaurant ── */
  const handleCreateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestSaving(true);
    try {
      const payload = {
        name: restForm.name,
        description: restForm.description,
        cuisineTypes: restForm.cuisineTypes.split(',').map(s => s.trim()).filter(Boolean),
        priceRange: Number(restForm.priceRange),
        location: { type: 'Point' as const, coordinates: [73.7898, 19.9975] as [number, number] },
        address: {
          street: restForm.street,
          city: restForm.city,
          state: restForm.state,
          zipCode: restForm.zipCode,
        },
        contact: { phone: restForm.phone, email: restForm.email },
        operatingHours: [0,1,2,3,4,5,6].map(day => ({
          day, open: '10:00', close: '22:00',
        })),
        tables: [
          { tableId: 'T1', capacity: 2, isAvailable: true },
          { tableId: 'T2', capacity: 4, isAvailable: true },
          { tableId: 'T3', capacity: 6, isAvailable: true },
        ],
      };
      const { data } = await restaurantApi.create(payload as any);
      const newRest = data.data;

      // Upload banner image if provided
      if (restImageFile) {
        try {
          await uploadApi.uploadRestaurantImage(newRest._id, restImageFile);
          // Re-fetch updated restaurant with images
          const refreshed = await restaurantApi.getById(newRest._id);
          setRestaurant(refreshed.data.data.restaurant);
        } catch {
          // Image upload failed silently – restaurant is still created
          setRestaurant(newRest);
          toast('Restaurant created but image upload failed. You can add images from Settings.', { icon: '⚠️' });
        }
      } else {
        setRestaurant(newRest);
      }

      setMenuItems([]);
      setOrders([]);
      setShowRestForm(false);
      setRestImageFile(null);
      setRestImagePreview('');
      toast.success(`🎉 "${newRest.name}" is live! Now add your menu items.`);
      setActiveTab('menu');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create restaurant');
    } finally {
      setRestSaving(false);
    }
  };

  /* ── Update Restaurant Settings ── */
  const handleUpdateRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setRestSaving(true);
    try {
      const { data } = await restaurantApi.update(restaurant._id, {
        name: restForm.name || restaurant.name,
        description: restForm.description || restaurant.description,
        contact: {
          phone: restForm.phone || restaurant.contact.phone,
          email: restForm.email || restaurant.contact.email,
        },
        cuisineTypes: restForm.cuisineTypes
          ? restForm.cuisineTypes.split(',').map(s => s.trim())
          : restaurant.cuisineTypes,
      } as any);

      // Upload banner image if provided
      if (restImageFile) {
        try {
          await uploadApi.uploadRestaurantImage(restaurant._id, restImageFile);
          const refreshed = await restaurantApi.getById(restaurant._id);
          setRestaurant(refreshed.data.data.restaurant);
          setRestImageFile(null);
          setRestImagePreview('');
        } catch {
          toast('Settings saved but image upload failed.', { icon: '⚠️' });
        }
      } else {
        setRestaurant(data.data);
      }
      
      toast.success('Settings saved!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setRestSaving(false);
    }
  };

  /* ── Open Edit Menu Item ── */
  const openAddItem = () => {
    setEditingItem(null);
    setItemForm(EMPTY_ITEM);
    setItemImageFile(null);
    setItemImagePreview('');
    setShowItemModal(true);
  };

  const openEditItem = (item: IMenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      tags: (item.tags || []).join(', '),
      preparationTime: String(item.preparationTime || 15),
    });
    setItemImageFile(null);
    setItemImagePreview(item.image || '');
    setShowItemModal(true);
  };

  /* ── Save Menu Item (Add or Edit) ── */
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;
    setItemSaving(true);
    try {
      const payload = {
        name: itemForm.name,
        description: itemForm.description,
        price: Number(itemForm.price),
        category: itemForm.category,
        tags: itemForm.tags.split(',').map(s => s.trim()).filter(Boolean),
        preparationTime: Number(itemForm.preparationTime),
        isAvailable: true,
      };

      let savedItem: IMenuItem;
      if (editingItem) {
        const { data } = await restaurantApi.updateMenuItem(restaurant._id, editingItem._id, payload as any);
        savedItem = data.data;
      } else {
        const { data } = await restaurantApi.addMenuItem(restaurant._id, payload as any);
        savedItem = data.data;
      }

      // Upload food image if a new file was chosen
      if (itemImageFile) {
        try {
          const { data: imgData } = await uploadApi.uploadMenuItemImage(restaurant._id, savedItem._id, itemImageFile);
          savedItem = { ...savedItem, image: imgData.data.imageUrl };
        } catch {
          toast('Item saved but image upload failed.', { icon: '⚠️' });
        }
      }

      if (editingItem) {
        setMenuItems(prev => prev.map(i => i._id === editingItem._id ? savedItem : i));
        toast.success('Menu item updated!');
      } else {
        setMenuItems(prev => [...prev, savedItem]);
        toast.success('Menu item added! It\'s now visible to customers.');
      }

      setItemImageFile(null);
      setItemImagePreview('');
      setShowItemModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save menu item');
    } finally {
      setItemSaving(false);
    }
  };

  /* ── Delete Menu Item ── */
  const deleteMenuItem = async (itemId: string) => {
    if (!restaurant) return;
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await restaurantApi.deleteMenuItem(restaurant._id, itemId);
      setMenuItems(prev => prev.filter(i => i._id !== itemId));
      toast.success('Menu item removed');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete item');
    }
  };

  /* ── Toggle restaurant live/closed status ── */
  const handleToggleLive = async () => {
    if (!restaurant) return;
    setLiveToggling(true);
    try {
      const { data } = await restaurantApi.toggleLiveStatus(restaurant._id);
      setRestaurant(data.data);
      toast.success(data.data.isActive ? '🟢 Restaurant is now LIVE!' : '🔴 Restaurant is now CLOSED');
    } catch {
      toast.error('Failed to update restaurant status');
    } finally {
      setLiveToggling(false);
    }
  };

  /* ── Toggle item availability ── */
  const toggleItemAvailability = async (item: IMenuItem) => {
    if (!restaurant) return;
    try {
      const { data } = await restaurantApi.updateMenuItem(restaurant._id, item._id, {
        isAvailable: !item.isAvailable,
      } as any);
      setMenuItems(prev => prev.map(i => i._id === item._id ? data.data : i));
      toast.success(data.data.isAvailable ? `✅ ${item.name} is now available` : `❌ ${item.name} marked as out of stock`);
    } catch {
      toast.error('Failed to update availability');
    }
  };

  /* ── Update order status ── */
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await orderApi.updateStatus(orderId, { status: status as any });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: status as any } : o));
      toast.success('Order status updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  /* ── Guards ── */
  if (!isMerchant && !isCourier && !isConsumer) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="page container dashboard-loading">
        <Loader2 size={32} className="spin" />
        <p>Loading dashboard…</p>
      </div>
    );
  }

  /* ══ CONSUMER DASHBOARD ══════════════════════════════════════ */
  if (isConsumer) {
    return (
      <div className="page container" style={{ maxWidth: 720 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4 }}>
            👋 Welcome back{user?.profile?.firstName ? `, ${user.profile.firstName}` : ''}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Track your orders, earn review points, and unlock rewards.
          </p>
        </div>

        {/* Loyalty Widget */}
        <div style={{ marginBottom: 24 }}>
          <LoyaltyWidget />
        </div>

        {/* How to earn points */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: 16,
          padding: '20px 22px',
          marginBottom: 24,
          color: '#fff',
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Star size={16} fill="#fbbf24" color="#fbbf24" /> How to Earn Review Points
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {[
              { label: 'Base review', pts: '+10 pts', desc: 'Any valid review' },
              { label: 'Detailed review', pts: '+5 pts', desc: '20+ words' },
              { label: 'Long review', pts: '+30 pts', desc: '100+ words' },
              { label: 'Good keywords', pts: '+20 pts', desc: 'Descriptive words' },
              { label: 'Add photos', pts: '+15 pts', desc: 'Visual evidence' },
              { label: 'Positive tone', pts: '+5 pts', desc: 'Positive sentiment' },
              { label: '5-star review', pts: '+5 pts', desc: 'Top rating' },
            ].map((item) => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '10px 14px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f97316' }}>{item.pts}</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff', marginTop: 2 }}>{item.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 1 }}>{item.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: 12, marginBottom: 0 }}>
            Maximum 90 pts per review. Points added instantly to your account.
          </p>
        </div>

        {/* Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {[
            { href: '/orders', icon: <Package size={20} />, label: 'My Orders', desc: 'Review delivered orders', color: '#f97316' },
            { href: '/discover', icon: <Store size={20} />, label: 'Discover Restaurants', desc: 'Find new places to try', color: '#10b981' },
            { href: '/dine-out', icon: <Calendar size={20} />, label: 'Table Bookings', desc: 'Your reservations', color: '#6366f1' },
            { href: '/events', icon: <Gift size={20} />, label: 'Events', desc: 'Past event bookings', color: '#ec4899' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '16px',
                borderRadius: 14,
                border: '1.5px solid var(--border)',
                background: '#fff',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.18s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = link.color;
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px ${link.color}22`;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
                (e.currentTarget as HTMLElement).style.transform = '';
              }}
            >
              <div style={{ color: link.color, flexShrink: 0, marginTop: 2 }}>{link.icon}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{link.label}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{link.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }

  /* ══ COURIER DASHBOARD ═══════════════════════════════════════ */
  if (isCourier) {
    return <Navigate to="/courier-dashboard" replace />;
  }

  /* ══ MERCHANT – NO RESTAURANT YET ═══════════════════════════ */
  if (!restaurant && !showRestForm) {
    return (
      <div className="page container">
        <div className="empty-dashboard">
          <Store size={64} style={{ color: 'var(--color-primary)' }} />
          <h2>Welcome to your Merchant Dashboard</h2>
          <p>You haven't added a restaurant yet. Create your listing to appear on the platform — customers and courier partners will be able to see and order from you instantly.</p>
          <button className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 2rem' }} onClick={() => setShowRestForm(true)}>
            <Plus size={18} /> Add Your Restaurant / Café
          </button>
        </div>
      </div>
    );
  }

  /* ══ CREATE RESTAURANT FORM ══════════════════════════════════ */
  if (!restaurant && showRestForm) {
    return (
      <div className="page container" style={{ maxWidth: 680 }}>
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h1 style={{ margin: 0 }}>Add Your Restaurant</h1>
            <button className="btn-icon btn-ghost" onClick={() => setShowRestForm(false)}><X size={20} /></button>
          </div>

          <form onSubmit={handleCreateRestaurant} className="settings-form">
            <div className="input-group">
              <label>Restaurant / Café Name *</label>
              <input className="input" required placeholder="e.g. The Smoked Vine" value={restForm.name} onChange={e => setRestForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Description *</label>
              <textarea className="input" required rows={3} placeholder="Tell customers what makes your place special…" value={restForm.description} onChange={e => setRestForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>Contact Phone *</label>
                <input className="input" required type="tel" placeholder="9876543210" value={restForm.phone} onChange={e => setRestForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>Contact Email *</label>
                <input className="input" required type="email" placeholder="you@restaurant.com" value={restForm.email} onChange={e => setRestForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="input-group">
              <label>Street Address *</label>
              <input className="input" required placeholder="123 College Road" value={restForm.street} onChange={e => setRestForm(f => ({ ...f, street: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="input-group">
                <label>City</label>
                <input className="input" value={restForm.city} onChange={e => setRestForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>Zip Code</label>
                <input className="input" value={restForm.zipCode} onChange={e => setRestForm(f => ({ ...f, zipCode: e.target.value }))} />
              </div>
            </div>
            <div className="input-group">
              <label>Cuisine Types (comma-separated) *</label>
              <input className="input" required placeholder="Indian, North Indian, Mughlai" value={restForm.cuisineTypes} onChange={e => setRestForm(f => ({ ...f, cuisineTypes: e.target.value }))} />
            </div>
            <div className="input-group">
              <label>Price Range</label>
              <select className="input" value={restForm.priceRange} onChange={e => setRestForm(f => ({ ...f, priceRange: e.target.value }))}>
                <option value="1">₹ Budget</option>
                <option value="2">₹₹ Mid-range</option>
                <option value="3">₹₹₹ Premium</option>
                <option value="4">₹₹₹₹ Fine Dining</option>
              </select>
            </div>

            {/* ── Restaurant Banner Image ── */}
            <div className="input-group">
              <label>Restaurant Banner Image (optional)</label>
              <input
                ref={restImageRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setRestImageFile(file);
                    setRestImagePreview(URL.createObjectURL(file));
                  }
                }}
              />
              {restImagePreview ? (
                <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', height: 160 }}>
                  <img src={restImagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => { setRestImageFile(null); setRestImagePreview(''); if (restImageRef.current) restImageRef.current.value = ''; }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => restImageRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--color-muted)', cursor: 'pointer', width: '100%', justifyContent: 'center', fontSize: '0.9rem' }}
                >
                  <Upload size={18} /> Click to upload a banner image
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowRestForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={restSaving} style={{ flex: 1 }}>
                {restSaving ? <Loader2 size={18} className="spin" /> : <><Plus size={18} /> Create Restaurant</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ══ FULL MERCHANT DASHBOARD ═════════════════════════════════ */
  return (
    <div className="dashboard-page page">
      <div className="container">
        <div className="dashboard-header">
          <div className="dashboard-header-top">
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {restaurant!.name}
                <span
                  style={{
                    fontSize: '0.45em',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: restaurant!.isActive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                    color: restaurant!.isActive ? '#15803d' : '#b91c1c',
                    border: `1px solid ${restaurant!.isActive ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
                    letterSpacing: '0.02em',
                  }}
                >
                  {restaurant!.isActive ? '● LIVE' : '● CLOSED'}
                </span>
              </h1>
              <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.9rem' }}>
                {restaurant!.cuisineTypes.join(' · ')} &nbsp;·&nbsp; {restaurant!.address.city}
              </p>
            </div>

            {/* ── Live / Closed Toggle ── */}
            <button
              id="restaurant-live-toggle"
              className={`live-toggle-btn ${restaurant!.isActive ? 'live-toggle-btn--live' : 'live-toggle-btn--closed'}`}
              onClick={handleToggleLive}
              disabled={liveToggling}
              title={restaurant!.isActive ? 'Click to close restaurant' : 'Click to go live'}
            >
              {liveToggling ? (
                <Loader2 size={16} className="spin" />
              ) : restaurant!.isActive ? (
                <ToggleRight size={22} />
              ) : (
                <ToggleLeft size={22} />
              )}
              <span>{restaurant!.isActive ? 'Restaurant is Live' : 'Restaurant is Closed'}</span>
            </button>
          </div>

          <div className="dashboard-tabs">
            <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
              <Package size={18} /> Orders
            </button>
            <button className={`tab-btn ${activeTab === 'reservations' ? 'active' : ''}`} onClick={() => setActiveTab('reservations')}>
              <Calendar size={18} /> Reservations
              {reservations.filter(r => r.status === 'pending').length > 0 && (
                <span className="tab-badge">{reservations.filter(r => r.status === 'pending').length}</span>
              )}
            </button>
            <button className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
              <UtensilsCrossed size={18} /> Menu Items
            </button>
            <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => {
              setRestForm({
                name: restaurant!.name,
                description: restaurant!.description,
                phone: restaurant!.contact.phone,
                email: restaurant!.contact.email,
                street: restaurant!.address.street,
                city: restaurant!.address.city,
                state: restaurant!.address.state,
                zipCode: restaurant!.address.zipCode,
                cuisineTypes: restaurant!.cuisineTypes.join(', '),
                priceRange: String(restaurant!.priceRange),
              });
              setActiveTab('settings');
            }}>
              <Settings size={18} /> Settings
            </button>
          </div>
        </div>

        <div className="dashboard-content">

          {/* ── ORDERS TAB ── */}
          {activeTab === 'orders' && (
            <div className="dashboard-orders">
              <div className="section-header">
                <h2>Incoming Orders</h2>
                <span className="badge" style={{ background: 'var(--color-primary)', color: '#fff' }}>{orders.length} total</span>
              </div>
              {orders.length === 0 ? (
                <div className="empty-state">
                  <Package size={40} />
                  <p>No orders yet. Once customers order from your restaurant, they'll appear here.</p>
                </div>
              ) : (
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Courier</th><th>Status</th><th>Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order._id}>
                          <td><strong>{order.orderNumber}</strong></td>
                          <td>{(order.consumerId as any)?.profile?.firstName || 'Customer'}</td>
                          <td>{order.items.length} items</td>
                          <td>₹{order.total}</td>
                          <td>
                            {(order.courierId as any)?.profile ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--color-success)', fontWeight: 600 }}>
                                🛵 {(order.courierId as any).profile.firstName} {(order.courierId as any).profile.lastName}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>—</span>
                            )}
                          </td>
                          <td><span className={`badge status-${order.status}`}>{order.status}</span></td>
                          <td>
                            <select className="input select-sm" value={order.status} onChange={e => updateOrderStatus(order._id, e.target.value)}>
                              <option value="pending">Pending</option>
                              <option value="accepted">Accepted</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── RESERVATIONS TAB ── */}
          {activeTab === 'reservations' && (
            <div className="dashboard-orders">
              <div className="section-header">
                <h2>Table Reservations</h2>
                <span className="badge" style={{ background: 'var(--color-primary)', color: '#fff' }}>
                  {reservations.length} total · {reservations.filter(r => r.status === 'pending').length} pending
                </span>
              </div>
              {reservations.length === 0 ? (
                <div className="empty-state">
                  <Calendar size={40} />
                  <p>No reservations yet. Customers can book tables from the Dine Out page.</p>
                </div>
              ) : (
                <div className="reservations-admin-list">
                  {reservations.map((res) => {
                    const customer = res.consumerId;
                    const date = new Date(res.reservationDate);
                    return (
                      <div key={res._id} className={`reservation-admin-card card res-status-${res.status}`}>
                        <div className="res-admin-header">
                          <div className="res-admin-customer">
                            <span className="res-customer-name">
                              👤 {customer?.profile?.firstName || 'Customer'} {customer?.profile?.lastName || ''}
                            </span>
                            <span className="res-customer-email">{customer?.email || ''}</span>
                          </div>
                          <span className={`reservation-status-pill status-${res.status}`}>
                            {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                          </span>
                        </div>
                        <div className="res-admin-details">
                          <span><Calendar size={13} /> {date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span><Clock size={13} /> {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span><Users size={13} /> {res.partySize} guests</span>
                          <span>🪑 Table {res.tableId}</span>
                        </div>
                        {res.specialRequests && (
                          <p className="res-admin-special">📝 {res.specialRequests}</p>
                        )}
                        {res.status === 'pending' && (
                          <div className="res-admin-actions">
                            <button
                              className="btn btn-sm res-confirm-btn"
                              onClick={() => updateReservationStatus(res._id, 'confirmed')}
                            >
                              <CheckCircle size={15} /> Confirm
                            </button>
                            <button
                              className="btn btn-sm res-cancel-btn"
                              onClick={() => updateReservationStatus(res._id, 'cancelled')}
                            >
                              <XCircle size={15} /> Decline
                            </button>
                          </div>
                        )}
                        {res.status === 'confirmed' && (
                          <div className="res-admin-actions">
                            <button
                              className="btn btn-sm res-complete-btn"
                              onClick={() => updateReservationStatus(res._id, 'completed')}
                            >
                              <CheckCircle size={15} /> Mark Completed
                            </button>
                            <button
                              className="btn btn-sm res-cancel-btn"
                              onClick={() => updateReservationStatus(res._id, 'cancelled')}
                            >
                              <XCircle size={15} /> Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── MENU TAB ── */}
          {activeTab === 'menu' && (
            <div className="dashboard-menu">
              <div className="section-header">
                <div>
                  <h2>Menu Management</h2>
                  <p style={{ margin: 0, color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                    {menuItems.length} item{menuItems.length !== 1 ? 's' : ''} &nbsp;·&nbsp;
                    Items added here appear instantly on the customer & courier pages
                  </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={openAddItem}>
                  <Plus size={16} /> Add Menu Item
                </button>
              </div>

              {menuItems.length === 0 ? (
                <div className="empty-state">
                  <UtensilsCrossed size={40} />
                  <p>No menu items yet. Add your first dish to start receiving orders!</p>
                  <button className="btn btn-primary" onClick={openAddItem}><Plus size={16} /> Add First Item</button>
                </div>
              ) : (
                <div className="menu-grid-admin">
                  {menuItems.map(item => (
                    <div key={item._id} className={`menu-admin-card card ${!item.isAvailable ? 'unavailable' : ''}`}>
                      {item.image && (
                        <div style={{ height: 110, overflow: 'hidden', borderRadius: 'var(--radius) var(--radius) 0 0', flexShrink: 0 }}>
                          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div className="menu-admin-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0 }}>{item.name}</h3>
                          {!item.isAvailable && (
                            <span style={{
                              background: 'rgba(239,68,68,0.12)',
                              color: '#b91c1c',
                              border: '1px solid rgba(239,68,68,0.3)',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 999,
                              letterSpacing: '0.04em',
                            }}>OUT OF STOCK</span>
                          )}
                        </div>
                        <p className="text-muted" style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>{item.category} · ₹{item.price}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-muted)' }}>{item.description}</p>
                        {item.tags && item.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                            {item.tags.map(tag => (
                              <span key={tag} style={{ background: 'var(--color-surface-2)', borderRadius: 4, padding: '2px 6px', fontSize: '0.7rem' }}>{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="menu-admin-actions" style={{ alignItems: 'center' }}>
                        {/* Availability pill-toggle */}
                        <button
                          id={`toggle-item-${item._id}`}
                          className={`item-avail-toggle ${item.isAvailable ? 'item-avail-toggle--on' : 'item-avail-toggle--off'}`}
                          title={item.isAvailable ? 'Mark as out of stock' : 'Mark as available'}
                          onClick={() => toggleItemAvailability(item)}
                        >
                          {item.isAvailable ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          <span>{item.isAvailable ? 'In Stock' : 'Out of Stock'}</span>
                        </button>
                        <button className="btn-icon btn-ghost" title="Edit" onClick={() => openEditItem(item)}><Edit2 size={16} /></button>
                        <button className="btn-icon text-danger" title="Delete" onClick={() => deleteMenuItem(item._id)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div className="dashboard-settings card">
              <div className="card-body">
                <h2>Restaurant Settings</h2>
                <form className="settings-form" onSubmit={handleUpdateRestaurant}>
                  <div className="input-group">
                    <label>Restaurant Name</label>
                    <input type="text" className="input" value={restForm.name} onChange={e => setRestForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label>Description</label>
                    <textarea className="input" rows={4} value={restForm.description} onChange={e => setRestForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                  <div className="form-row">
                    <div className="input-group">
                      <label>Contact Phone</label>
                      <input type="text" className="input" value={restForm.phone} onChange={e => setRestForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                    <div className="input-group">
                      <label>Contact Email</label>
                      <input type="email" className="input" value={restForm.email} onChange={e => setRestForm(f => ({ ...f, email: e.target.value }))} />
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Cuisine Types (comma-separated)</label>
                    <input type="text" className="input" value={restForm.cuisineTypes} onChange={e => setRestForm(f => ({ ...f, cuisineTypes: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label>Price Range</label>
                    <select className="input" value={restForm.priceRange} onChange={e => setRestForm(f => ({ ...f, priceRange: e.target.value }))}>
                      <option value="1">₹ Budget</option>
                      <option value="2">₹₹ Mid-range</option>
                      <option value="3">₹₹₹ Premium</option>
                      <option value="4">₹₹₹₹ Fine Dining</option>
                    </select>
                  </div>

                  {/* ── Restaurant Banner Image ── */}
                  <div className="input-group">
                    <label>Update Banner Image</label>
                    <input
                      ref={restImageRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setRestImageFile(file);
                          setRestImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                    {restImagePreview || restaurant?.images?.[0] ? (
                      <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', height: 160 }}>
                        <img src={restImagePreview || restaurant?.images?.[0]} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button
                          type="button"
                          onClick={() => { setRestImageFile(null); setRestImagePreview(''); if (restImageRef.current) restImageRef.current.value = ''; }}
                          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                        >
                          <X size={14} />
                        </button>
                        {!restImageFile && restaurant?.images?.[0] && (
                          <span style={{ position: 'absolute', bottom: 6, left: 8, fontSize: '0.7rem', background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 4, padding: '2px 6px' }}>Current photo</span>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => restImageRef.current?.click()}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--color-muted)', cursor: 'pointer', width: '100%', justifyContent: 'center', fontSize: '0.9rem' }}
                      >
                        <Upload size={18} /> Click to upload a new banner image
                      </button>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={restSaving} style={{ marginTop: '1rem' }}>
                    {restSaving ? <Loader2 size={18} className="spin" /> : 'Save Changes'}
                  </button>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══ ADD / EDIT MENU ITEM MODAL ════════════════════════════ */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => setShowItemModal(false)}>
          <div className="modal-card card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button className="btn-icon btn-ghost" onClick={() => setShowItemModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveItem} className="settings-form modal-body">
              <div className="input-group">
                <label>Item Name *</label>
                <input className="input" required placeholder="e.g. Butter Chicken" value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>Description *</label>
                <textarea className="input" required rows={2} placeholder="A brief description of the dish" value={itemForm.description} onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label>Price (₹) *</label>
                  <input className="input" required type="number" min="1" placeholder="250" value={itemForm.price} onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label>Prep Time (min)</label>
                  <input className="input" type="number" min="1" value={itemForm.preparationTime} onChange={e => setItemForm(f => ({ ...f, preparationTime: e.target.value }))} />
                </div>
              </div>
              <div className="input-group">
                <label>Category *</label>
                <input className="input" required placeholder="e.g. Main Course, Starters, Beverages" value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="input-group">
                <label>Tags (comma-separated)</label>
                <input className="input" placeholder="veg, popular, spicy" value={itemForm.tags} onChange={e => setItemForm(f => ({ ...f, tags: e.target.value }))} />
              </div>

              {/* ── Food Photo Upload ── */}
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ImageIcon size={14} /> Food Photo (optional)
                </label>
                <input
                  ref={itemImageRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setItemImageFile(file);
                      setItemImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
                {itemImagePreview ? (
                  <div style={{ position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', height: 130 }}>
                    <img src={itemImagePreview} alt="Food preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={() => { setItemImageFile(null); setItemImagePreview(''); if (itemImageRef.current) itemImageRef.current.value = ''; }}
                      style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                    >
                      <X size={14} />
                    </button>
                    {!itemImageFile && editingItem?.image && (
                      <span style={{ position: 'absolute', bottom: 6, left: 8, fontSize: '0.7rem', background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 4, padding: '2px 6px' }}>Existing photo</span>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => itemImageRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius)', background: 'transparent', color: 'var(--color-muted)', cursor: 'pointer', width: '100%', justifyContent: 'center', fontSize: '0.88rem' }}
                  >
                    <Upload size={16} /> Upload food photo
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowItemModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={itemSaving} style={{ flex: 1 }}>
                  {itemSaving ? <Loader2 size={18} className="spin" /> : <><ChevronRight size={18} /> {editingItem ? 'Update Item' : 'Add to Menu'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

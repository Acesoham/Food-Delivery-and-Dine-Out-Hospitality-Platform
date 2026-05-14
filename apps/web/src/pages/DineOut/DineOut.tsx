import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Users, Calendar, Clock, X, CheckCircle, ChefHat, Loader2, Filter } from 'lucide-react';
import { restaurantApi, reservationApi } from '../../services/endpoints';
import { useAuthStore } from '../../store/authStore';
import type { IRestaurant } from 'shared-types';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './DineOut.css';

const CUISINE_FILTERS = [
  'All', 'Indian', 'Chinese', 'Maharashtrian', 'Fine Dining',
  'Cafe', 'Continental', 'Italian', 'Street Food', 'Pure Veg',
];

interface Table {
  tableId: string;
  capacity: number;
  isAvailable: boolean;
}

interface BookingForm {
  tableId: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  specialRequests: string;
}

export const DineOut = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [restaurants, setRestaurants] = useState<(IRestaurant & { distanceInKm?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [userLocation, setUserLocation] = useState({ lat: 19.9975, lng: 73.7898 });

  // Modal state
  const [selectedRestaurant, setSelectedRestaurant] = useState<IRestaurant | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [booking, setBooking] = useState<BookingForm>({
    tableId: '',
    reservationDate: '',
    reservationTime: '',
    partySize: 2,
    specialRequests: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // My reservations state
  const [showMyReservations, setShowMyReservations] = useState(false);
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [userLocation, selectedCuisine, search]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params: any = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius: 50000,
        limit: 20,
      };
      if (selectedCuisine !== 'All') params.cuisine = selectedCuisine;
      if (search) params.search = search;
      const { data } = await restaurantApi.discover(params);
      // Only show restaurants that have tables defined
      setRestaurants(data.data || []);
    } catch {
      console.error('Failed to fetch restaurants');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReservations = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setLoadingReservations(true);
    setShowMyReservations(true);
    try {
      const { data } = await reservationApi.getMyReservations();
      setMyReservations(data.data || []);
    } catch {
      toast.error('Failed to load reservations');
    } finally {
      setLoadingReservations(false);
    }
  };

  const openBookingModal = (restaurant: IRestaurant) => {
    if (!isAuthenticated) {
      toast.error('Please login to make a reservation');
      navigate('/login');
      return;
    }
    setSelectedRestaurant(restaurant);
    setBooking({ tableId: '', reservationDate: '', reservationTime: '', partySize: 2, specialRequests: '' });
    setSuccessMsg('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRestaurant(null);
    setSuccessMsg('');
  };

  const getAvailableTables = () => {
    if (!selectedRestaurant) return [];
    const tables = (selectedRestaurant as any).tables as Table[] || [];
    return tables.filter((t) => t.isAvailable && t.capacity >= booking.partySize);
  };

  const handleSubmitReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    if (!booking.tableId) { toast.error('Please select a table'); return; }
    if (!booking.reservationDate) { toast.error('Please select a date'); return; }
    if (!booking.reservationTime) { toast.error('Please select a time'); return; }

    const reservationDate = new Date(`${booking.reservationDate}T${booking.reservationTime}:00`).toISOString();
    setSubmitting(true);
    try {
      await reservationApi.create({
        restaurantId: (selectedRestaurant as any)._id,
        tableId: booking.tableId,
        reservationDate,
        partySize: booking.partySize,
        specialRequests: booking.specialRequests || undefined,
      });
      setSuccessMsg(`Your table at ${selectedRestaurant.name} has been reserved! We'll confirm shortly.`);
      toast.success('Reservation placed successfully! 🍽️');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create reservation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    try {
      await reservationApi.cancel(id);
      toast.success('Reservation cancelled');
      setMyReservations((prev) => prev.map((r) => r._id === id ? { ...r, status: 'cancelled' } : r));
    } catch {
      toast.error('Failed to cancel reservation');
    }
  };

  const getTodayDate = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#22c55e';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#6366f1';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="dineout-page page">
      {/* Hero */}
      <div className="dineout-hero">
        <div className="dineout-hero-bg" />
        <div className="container dineout-hero-content">
          <div className="dineout-hero-badge">
            <ChefHat size={16} />
            Premium Dining Experience
          </div>
          <h1 className="dineout-hero-title">Reserve a Table,<br /><span>Dine in Style</span></h1>
          <p className="dineout-hero-sub">
            Book your perfect table at top restaurants and cafés near you. No waiting, no hassle.
          </p>
          {isAuthenticated && (
            <button className="btn btn-outline my-reservations-btn" onClick={fetchMyReservations}>
              <Calendar size={16} />
              My Reservations
            </button>
          )}
        </div>
      </div>

      <div className="container dineout-body">
        {/* Search + Filter */}
        <div className="dineout-controls">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search restaurants for dining..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="cuisine-filters">
            <Filter size={16} />
            {CUISINE_FILTERS.map((c) => (
              <button
                key={c}
                className={`filter-chip ${selectedCuisine === c ? 'active' : ''}`}
                onClick={() => setSelectedCuisine(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Restaurant Grid */}
        {loading ? (
          <div className="results-loading">
            <Loader2 size={36} className="spin" />
            <p>Finding restaurants near you...</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="no-results">
            <p>🍽️ No restaurants found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="dineout-grid">
            {restaurants.map((r) => {
              const tables: Table[] = (r as any).tables || [];
              const availableTables = tables.filter((t) => t.isAvailable);
              return (
                <div key={(r as any)._id} className="dineout-card card">
                  <div className="dineout-card-img">
                    <img
                      src={r.images?.[0] || `https://picsum.photos/seed/${(r as any)._id}/600/350`}
                      alt={r.name}
                      loading="lazy"
                    />
                    <div className="dineout-card-badges">
                      {r.distanceInKm !== undefined && (
                        <span className="badge badge-info">
                          <MapPin size={12} /> {r.distanceInKm} km
                        </span>
                      )}
                      <span className="badge badge-primary">{'₹'.repeat(r.priceRange)}</span>
                    </div>
                    {availableTables.length > 0 ? (
                      <div className="table-avail-badge">
                        ✅ {availableTables.length} tables available
                      </div>
                    ) : (
                      <div className="table-avail-badge unavail">
                        ❌ No tables listed
                      </div>
                    )}
                  </div>
                  <div className="card-body dineout-card-body">
                    <h3 className="restaurant-name">{r.name}</h3>
                    <p className="restaurant-cuisines">{r.cuisineTypes.join(' • ')}</p>
                    <p className="restaurant-desc">{r.description}</p>
                    <div className="restaurant-meta">
                      <span className="restaurant-rating">
                        <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                        {r.rating.average} <span className="rating-count">({r.rating.count})</span>
                      </span>
                      <span className="restaurant-time">
                        <Clock size={14} /> Dine-in
                      </span>
                      {availableTables.length > 0 && (
                        <span className="restaurant-time">
                          <Users size={14} /> Up to {Math.max(...availableTables.map((t) => t.capacity))} guests
                        </span>
                      )}
                    </div>
                    <div className="dineout-card-actions">
                      <button
                        className="btn btn-primary btn-reserve"
                        onClick={() => openBookingModal(r)}
                      >
                        <Calendar size={16} />
                        Reserve a Table
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Reservation Modal ── */}
      {showModal && selectedRestaurant && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal reservation-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}><X size={20} /></button>

            {successMsg ? (
              <div className="reservation-success">
                <CheckCircle size={56} className="success-icon" />
                <h2>Reservation Confirmed!</h2>
                <p>{successMsg}</p>
                <button className="btn btn-primary" onClick={closeModal}>Done</button>
              </div>
            ) : (
              <>
                <div className="reservation-modal-header">
                  <img
                    src={selectedRestaurant.images?.[0] || `https://picsum.photos/seed/${(selectedRestaurant as any)._id}/600/200`}
                    alt={selectedRestaurant.name}
                    className="reservation-restaurant-img"
                  />
                  <div className="reservation-restaurant-info">
                    <h2>{selectedRestaurant.name}</h2>
                    <p>{selectedRestaurant.cuisineTypes?.join(' • ')}</p>
                    <span>
                      <MapPin size={13} />
                      {selectedRestaurant.address?.street}, {selectedRestaurant.address?.city}
                    </span>
                  </div>
                </div>

                <form className="reservation-form" onSubmit={handleSubmitReservation}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="res-date">
                        <Calendar size={15} /> Date
                      </label>
                      <input
                        id="res-date"
                        type="date"
                        min={getTodayDate()}
                        value={booking.reservationDate}
                        onChange={(e) => setBooking({ ...booking, reservationDate: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="res-time">
                        <Clock size={15} /> Time
                      </label>
                      <input
                        id="res-time"
                        type="time"
                        value={booking.reservationTime}
                        onChange={(e) => setBooking({ ...booking, reservationTime: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="res-party">
                        <Users size={15} /> Guests
                      </label>
                      <select
                        id="res-party"
                        value={booking.partySize}
                        onChange={(e) => setBooking({ ...booking, partySize: Number(e.target.value), tableId: '' })}
                        className="form-input"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                          <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Table selection */}
                  <div className="form-group">
                    <label><ChefHat size={15} /> Select Table</label>
                    <div className="table-grid">
                      {getAvailableTables().length === 0 ? (
                        <p className="no-tables-msg">
                          No tables available for {booking.partySize} guests. Try a smaller party size.
                        </p>
                      ) : (
                        getAvailableTables().map((t) => (
                          <button
                            key={t.tableId}
                            type="button"
                            className={`table-chip ${booking.tableId === t.tableId ? 'selected' : ''}`}
                            onClick={() => setBooking({ ...booking, tableId: t.tableId })}
                          >
                            <span className="table-icon">🪑</span>
                            <span className="table-id">{t.tableId}</span>
                            <span className="table-cap">Up to {t.capacity}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="res-special">Special Requests (optional)</label>
                    <textarea
                      id="res-special"
                      rows={2}
                      placeholder="Allergies, anniversary setup, window seat preference..."
                      value={booking.specialRequests}
                      onChange={(e) => setBooking({ ...booking, specialRequests: e.target.value })}
                      className="form-input form-textarea"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                    {submitting ? <Loader2 size={18} className="spin" /> : <Calendar size={18} />}
                    {submitting ? 'Booking...' : 'Confirm Reservation'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── My Reservations Panel ── */}
      {showMyReservations && (
        <div className="modal-overlay" onClick={() => setShowMyReservations(false)}>
          <div className="modal reservations-panel" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowMyReservations(false)}><X size={20} /></button>
            <h2 className="panel-title">
              <Calendar size={22} /> My Reservations
            </h2>

            {loadingReservations ? (
              <div className="results-loading"><Loader2 size={32} className="spin" /></div>
            ) : myReservations.length === 0 ? (
              <div className="no-results">
                <p>📅 No reservations yet. Book a table to get started!</p>
              </div>
            ) : (
              <div className="reservations-list">
                {myReservations.map((res) => {
                  const restaurant = res.restaurantId;
                  return (
                    <div key={res._id} className="reservation-item">
                      <div className="reservation-item-header">
                        <div>
                          <h3>{restaurant?.name || 'Restaurant'}</h3>
                          <p>{restaurant?.address?.street}, {restaurant?.address?.city}</p>
                        </div>
                        <span
                          className="reservation-status-badge"
                          style={{ background: `${getStatusColor(res.status)}22`, color: getStatusColor(res.status) }}
                        >
                          {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                        </span>
                      </div>
                      <div className="reservation-item-details">
                        <span><Calendar size={13} /> {new Date(res.reservationDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span><Clock size={13} /> {new Date(res.reservationDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span><Users size={13} /> {res.partySize} guests</span>
                        <span>🪑 Table {res.tableId}</span>
                      </div>
                      {res.specialRequests && (
                        <p className="reservation-special">📝 {res.specialRequests}</p>
                      )}
                      {['pending', 'confirmed'].includes(res.status) && (
                        <button
                          className="btn btn-ghost btn-sm cancel-btn"
                          onClick={() => handleCancelReservation(res._id)}
                        >
                          Cancel Reservation
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

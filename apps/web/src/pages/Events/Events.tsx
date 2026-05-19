import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Ticket, Search, Filter, ChevronDown, Clock, Tag, Download, CreditCard, Banknote, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import './Events.css';

interface IEvent {
  _id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  date: string;
  endDate?: string;
  venue: {
    name: string;
    address: string;
    country: string;
    state: string;
    district: string;
    city: string;
    pincode?: string;
  };
  ticketPrice: number;
  totalSeats: number;
  availableSeats: number;
  isActive: boolean;
  tags: string[];
  organizerId: { profile: { firstName: string; lastName: string }; email: string };
}

const CATEGORIES = ['All', 'Music', 'Food', 'Sports', 'Tech', 'Art', 'Comedy', 'Cultural', 'Education', 'Other'];

export const Events = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [events, setEvents] = useState<IEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [search, setSearch] = useState('');

  // Booking modal
  const [bookingEvent, setBookingEvent] = useState<IEvent | null>(null);
  const [tickets, setTickets] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [booking, setBooking] = useState(false);
  const [downloadingTicketId, setDownloadingTicketId] = useState<string | null>(null);

  // User bookings
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'my-bookings'>('browse');

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, country, state, district, city]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'consumer') fetchMyBookings();
  }, [isAuthenticated]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (country) params.country = country;
      if (state) params.state = state;
      if (district) params.district = district;
      if (city) params.city = city;
      const { data } = await api.get('/events/browse', { params });
      setEvents(data.events || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const { data } = await api.get('/events/bookings/mine');
      setMyBookings(data.data || []);
    } catch { /* silent */ }
  };

  const handleBook = async () => {
    if (!isAuthenticated) { toast.error('Please log in to book tickets'); return; }
    if (!bookingEvent) return;

    if (paymentMethod === 'online' && !showCardDetails && bookingEvent.ticketPrice > 0) {
      setShowCardDetails(true);
      return;
    }

    setBooking(true);
    try {
      await api.post(`/events/${bookingEvent._id}/book`, { tickets, paymentMethod });
      toast.success(`🎉 Booked ${tickets} ticket(s) for "${bookingEvent.title}"!`);
      setBookingEvent(null);
      setTickets(1);
      setPaymentMethod('online');
      setShowCardDetails(false);
      fetchEvents();
      fetchMyBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.patch(`/events/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled');
      fetchMyBookings();
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  const downloadTicket = async (b: any) => {
    setDownloadingTicketId(b._id);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(34, 34, 34);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Event Ticket', 105, 25, { align: 'center' });
      
      // Content
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(18);
      doc.text(b.eventId?.title || 'Event', 20, 60);
      
      doc.setFontSize(12);
      doc.text(`Reference: ${b.bookingRef}`, 20, 75);
      doc.text(`Date: ${b.eventId?.date ? new Date(b.eventId.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'}`, 20, 85);
      doc.text(`Time: ${b.eventId?.date ? new Date(b.eventId.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}`, 20, 95);
      doc.text(`Venue: ${b.eventId?.venue?.name || '—'}, ${b.eventId?.venue?.city || ''}`, 20, 105);
      
      doc.text(`Tickets: ${b.tickets}`, 20, 125);
      doc.text(`Total Amount: INR ${b.totalAmount}`, 20, 135);
      doc.text(`Payment: ${b.paymentMethod === 'online' ? 'Online' : 'Pay at Venue'} (${b.paymentStatus})`, 20, 145);

      // Generate QR Code
      const qrContainer = document.createElement('div');
      qrContainer.style.position = 'absolute';
      qrContainer.style.left = '-9999px';
      document.body.appendChild(qrContainer);
      const root = createRoot(qrContainer);
      root.render(<QRCodeCanvas value={b.bookingRef} size={150} id="qr-canvas-temp" />);
      
      await new Promise(r => setTimeout(r, 100)); // give it time to render
      
      const canvas = document.getElementById('qr-canvas-temp') as HTMLCanvasElement;
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 140, 60, 50, 50);
      }
      
      doc.save(`Ticket_${b.bookingRef}.pdf`);
      root.unmount();
      document.body.removeChild(qrContainer);
    } catch (err) {
      console.error(err);
      toast.error('Failed to download ticket');
    } finally {
      setDownloadingTicketId(null);
    }
  };

  const filtered = search
    ? events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.venue.city.toLowerCase().includes(search.toLowerCase()))
    : events;

  return (
    <div className="events-page page">
      <div className="container">
        {/* Hero */}
        <div className="events-hero">
          <div className="events-hero-content">
            <span className="events-hero-badge">🎉 Live Events Near You</span>
            <h1>Discover Amazing Events</h1>
            <p>From music festivals to food fairs — book tickets for events near your city</p>
          </div>
          <div className="events-search-bar">
            <Search size={18} className="events-search-icon" />
            <input
              className="events-search-input"
              placeholder="Search events, cities..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs (consumer only) */}
        {isAuthenticated && user?.role === 'consumer' && (
          <div className="events-tabs">
            <button className={`events-tab ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
              <Calendar size={16} /> Browse Events
            </button>
            <button className={`events-tab ${activeTab === 'my-bookings' ? 'active' : ''}`} onClick={() => { setActiveTab('my-bookings'); fetchMyBookings(); }}>
              <Ticket size={16} /> My Bookings
              {myBookings.filter(b => b.status === 'confirmed').length > 0 && (
                <span className="events-tab-badge">{myBookings.filter(b => b.status === 'confirmed').length}</span>
              )}
            </button>
          </div>
        )}

        {activeTab === 'my-bookings' ? (
          /* ── My Bookings ── */
          <div className="events-bookings-list">
            {myBookings.length === 0 ? (
              <div className="events-empty">
                <Ticket size={48} />
                <h3>No bookings yet</h3>
                <p>Browse events and book your first ticket!</p>
                <button className="btn btn-primary" onClick={() => setActiveTab('browse')}>Browse Events</button>
              </div>
            ) : myBookings.map((b: any) => (
              <div key={b._id} className={`booking-card card ${b.status === 'cancelled' ? 'booking-cancelled' : ''}`}>
                <div className="booking-card-header">
                  <div>
                    <h3>{b.eventId?.title || 'Event'}</h3>
                    <p className="booking-ref">Ref: <strong>{b.bookingRef}</strong></p>
                  </div>
                  <span className={`booking-status-badge ${b.status}`}>{b.status}</span>
                </div>
                <div className="booking-card-details">
                  <span><Calendar size={14} /> {b.eventId?.date ? new Date(b.eventId.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                  <span><MapPin size={14} /> {b.eventId?.venue?.city || '—'}</span>
                  <span><Ticket size={14} /> {b.tickets} ticket(s)</span>
                  <span>₹{b.totalAmount}</span>
                </div>
                {b.status === 'confirmed' && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => downloadTicket(b)} disabled={downloadingTicketId === b._id}>
                      <Download size={14} /> {downloadingTicketId === b._id ? 'Generating PDF...' : 'Download Ticket'}
                    </button>
                    <button className="btn btn-sm events-cancel-btn" onClick={() => handleCancelBooking(b._id)}>Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* ── Browse ── */
          <>
            {/* Filters */}
            <div className="events-filters">
              <div className="events-categories">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >{cat}</button>
                ))}
              </div>
              <div className="events-location-filters">
                <Filter size={16} />
                <input className="input events-loc-input" placeholder="Country" value={country} onChange={e => { setCountry(e.target.value); setState(''); setDistrict(''); setCity(''); }} />
                <ChevronDown size={14} className="loc-arrow" />
                <input className="input events-loc-input" placeholder="State" value={state} onChange={e => { setState(e.target.value); setDistrict(''); setCity(''); }} disabled={!country} />
                <ChevronDown size={14} className="loc-arrow" />
                <input className="input events-loc-input" placeholder="District" value={district} onChange={e => { setDistrict(e.target.value); setCity(''); }} disabled={!state} />
                <ChevronDown size={14} className="loc-arrow" />
                <input className="input events-loc-input" placeholder="City" value={city} onChange={e => setCity(e.target.value)} disabled={!district} />
              </div>
            </div>

            {/* Results count */}
            <div className="events-result-count">
              {loading ? 'Loading events…' : `${filtered.length} event${filtered.length !== 1 ? 's' : ''} found${total > filtered.length ? ` (${total} total)` : ''}`}
            </div>

            {/* Event Grid */}
            {loading ? (
              <div className="events-grid">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="event-card card skeleton-card">
                    <div className="skeleton event-card-img-skel" />
                    <div className="skeleton" style={{ height: 20, width: '70%', margin: '12px 16px 8px' }} />
                    <div className="skeleton" style={{ height: 14, width: '50%', margin: '0 16px 16px' }} />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="events-empty">
                <Calendar size={56} />
                <h3>No events found</h3>
                <p>Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <div className="events-grid">
                {filtered.map(event => (
                  <div key={event._id} className="event-card card">
                    <div className="event-card-img">
                      <img
                        src={event.imageUrl || `https://picsum.photos/seed/${event._id}/600/300`}
                        alt={event.title}
                      />
                      <span className="event-category-badge">{event.category}</span>
                      {event.availableSeats === 0 && <div className="event-sold-out">Sold Out</div>}
                    </div>
                    <div className="event-card-body">
                      <h3 className="event-title">{event.title}</h3>
                      <p className="event-desc">{event.description.slice(0, 90)}{event.description.length > 90 ? '…' : ''}</p>
                      <div className="event-meta">
                        <span><Calendar size={13} /> {new Date(event.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span><Clock size={13} /> {new Date(event.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span><MapPin size={13} /> {event.venue.city}, {event.venue.state}</span>
                        <span><Users size={13} /> {event.availableSeats} left</span>
                      </div>
                      {event.tags.length > 0 && (
                        <div className="event-tags">
                          {event.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="event-tag"><Tag size={10} /> {tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="event-card-footer">
                        <span className="event-price">
                          {event.ticketPrice === 0 ? <span className="free-badge">FREE</span> : `₹${event.ticketPrice}`}
                          <span className="per-ticket"> / ticket</span>
                        </span>
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={event.availableSeats === 0}
                          onClick={() => { setBookingEvent(event); setTickets(1); }}
                        >
                          <Ticket size={14} /> Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Modal */}
      {bookingEvent && (
        <div className="modal-overlay" onClick={() => setBookingEvent(null)}>
          <div className="modal-card card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{showCardDetails ? 'Enter Card Details' : 'Book Tickets'}</h2>
              <button className="btn-icon btn-ghost" onClick={() => { setBookingEvent(null); setShowCardDetails(false); }}>✕</button>
            </div>
            <div className="modal-body">
              {showCardDetails ? (
                <div className="card-details-form" style={{ padding: '0.5rem 0' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                    Please enter your card details to complete the payment of <strong>₹{bookingEvent.ticketPrice * tickets}</strong>. This is a secure test payment.
                  </p>
                  <div className="input-group" style={{ marginBottom: '1rem' }}>
                    <label>Card Number</label>
                    <input type="text" className="input" placeholder="0000 0000 0000 0000" maxLength={19} />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label>Expiry (MM/YY)</label>
                      <input type="text" className="input" placeholder="MM/YY" maxLength={5} />
                    </div>
                    <div className="input-group" style={{ flex: 1 }}>
                      <label>CVV</label>
                      <input type="password" className="input" placeholder="123" maxLength={3} />
                    </div>
                  </div>
                  <div className="input-group" style={{ marginBottom: '2rem' }}>
                    <label>Name on Card</label>
                    <input type="text" className="input" placeholder="e.g. Jane Doe" />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-ghost" onClick={() => setShowCardDetails(false)}>Back</button>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      onClick={handleBook}
                      disabled={booking}
                    >
                      {booking ? <Loader2 size={18} className="spin" /> : <><CreditCard size={18} /> Confirm Payment · ₹{bookingEvent.ticketPrice * tickets}</>}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="booking-event-preview">
                    <img src={bookingEvent.imageUrl || `https://picsum.photos/seed/${bookingEvent._id}/400/200`} alt={bookingEvent.title} />
                    <div>
                      <h3>{bookingEvent.title}</h3>
                      <p><Calendar size={13} /> {new Date(bookingEvent.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p><MapPin size={13} /> {bookingEvent.venue.name}, {bookingEvent.venue.city}</p>
                  <p><Users size={13} /> {bookingEvent.availableSeats} seats available</p>
                </div>
              </div>
              <div className="input-group" style={{ marginTop: '1.5rem' }}>
                <label>Number of Tickets</label>
                <div className="ticket-qty-row">
                  <button className="qty-btn" onClick={() => setTickets(t => Math.max(1, t - 1))}>−</button>
                  <span className="qty-value">{tickets}</span>
                  <button className="qty-btn" onClick={() => setTickets(t => Math.min(bookingEvent.availableSeats, t + 1))}>+</button>
                </div>
              </div>
              <div className="booking-total-row">
                <span>Total Amount</span>
                <strong className="booking-total-price">
                  {bookingEvent.ticketPrice === 0 ? 'FREE' : `₹${bookingEvent.ticketPrice * tickets}`}
                </strong>
              </div>
              {bookingEvent.ticketPrice > 0 && (
                <div className="payment-section" style={{ marginTop: '1.5rem', padding: 0 }}>
                  <h4 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Payment Method</h4>
                  <div className="payment-options" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <button
                      type="button"
                      className={`payment-card ${paymentMethod === 'online' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('online')}
                    >
                      <div className="payment-card-left">
                        <span className="payment-icon payment-icon-card">
                          <CreditCard size={22} />
                        </span>
                        <div>
                          <span className="payment-label">Online Payment</span>
                          <span className="payment-sub">Card, UPI, or Netbanking</span>
                        </div>
                      </div>
                      {paymentMethod === 'online' && <CheckCircle2 size={20} className="payment-check" />}
                    </button>
                    
                    <button
                      type="button"
                      className={`payment-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <div className="payment-card-left">
                        <span className="payment-icon payment-icon-cod">
                          <Banknote size={22} />
                        </span>
                        <div>
                          <span className="payment-label">Pay at Venue</span>
                          <span className="payment-sub">Pay via cash/card at the event counter</span>
                        </div>
                      </div>
                      {paymentMethod === 'cod' && <CheckCircle2 size={20} className="payment-check" />}
                    </button>
                  </div>
                </div>
              )}
              {!isAuthenticated && (
                <p className="booking-login-note">
                  <Link to="/login">Log in</Link> to complete your booking
                </p>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button className="btn btn-ghost" onClick={() => { setBookingEvent(null); setShowCardDetails(false); }}>Cancel</button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  onClick={handleBook}
                  disabled={booking || !isAuthenticated}
                >
                  {booking ? (
                    'Booking…'
                  ) : paymentMethod === 'cod' ? (
                    <><Banknote size={18} /> Confirm Booking · {bookingEvent.ticketPrice === 0 ? 'FREE' : `₹${bookingEvent.ticketPrice * tickets}`}</>
                  ) : (
                    <><CreditCard size={18} /> Continue to Pay {bookingEvent.ticketPrice === 0 ? 'FREE' : `₹${bookingEvent.ticketPrice * tickets}`}</>
                  )}
                </button>
              </div>
              </>
            )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

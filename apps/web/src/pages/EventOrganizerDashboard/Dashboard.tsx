import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import {
  CalendarHeart, Plus, Edit2, X, Loader2, ToggleLeft, ToggleRight,
  Calendar, Users, Ticket, ChevronDown, ChevronRight, Eye,
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import './Dashboard.css';
import '../../pages/Dashboard/Dashboard.css';

/* ── Hierarchical location data ── */
const COUNTRIES = ['India'];
const STATES: Record<string, string[]> = {
  India: ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry'],
};
const DISTRICTS: Record<string, string[]> = {
  Maharashtra: ['Mumbai','Pune','Nashik','Nagpur','Aurangabad','Solapur','Kolhapur','Satara','Sangli','Thane'],
  Karnataka: ['Bengaluru Urban','Mysuru','Mangaluru','Hubballi-Dharwad','Belagavi'],
  'Tamil Nadu': ['Chennai','Coimbatore','Madurai','Tiruchirappalli','Salem'],
  Delhi: ['Central Delhi','East Delhi','New Delhi','North Delhi','South Delhi','West Delhi'],
  Gujarat: ['Ahmedabad','Surat','Vadodara','Rajkot','Gandhinagar'],
  'Uttar Pradesh': ['Lucknow','Kanpur','Agra','Varanasi','Prayagraj','Noida'],
  Rajasthan: ['Jaipur','Jodhpur','Udaipur','Kota','Ajmer'],
  'West Bengal': ['Kolkata','Howrah','North 24 Parganas','South 24 Parganas'],
  Telangana: ['Hyderabad','Rangareddy','Medchal-Malkajgiri','Warangal'],
  'Andhra Pradesh': ['Visakhapatnam','East Godavari','West Godavari','Krishna','Guntur'],
};
const CITIES: Record<string, string[]> = {
  Mumbai: ['Andheri','Bandra','Borivali','Dadar','Kurla','Powai','Thane','Vashi'],
  Pune: ['Shivajinagar','Kothrud','Hadapsar','Wakad','Hinjawadi','Viman Nagar'],
  Nashik: ['Nashik Road','Panchvati','Satpur','Deolali','Sinnar'],
  'Bengaluru Urban': ['Koramangala','Indiranagar','Whitefield','HSR Layout','Jayanagar'],
  Chennai: ['T Nagar','Adyar','Anna Nagar','Velachery','Porur'],
  Hyderabad: ['Banjara Hills','Jubilee Hills','Hitech City','Madhapur','Gachibowli'],
  Jaipur: ['Malviya Nagar','Vaishali Nagar','Mansarovar','C-Scheme','Ajmer Road'],
  'Central Delhi': ['Connaught Place','Karol Bagh','Paharganj'],
  'New Delhi': ['Saket','Vasant Kunj','Dwarka','Janakpuri'],
  'South Delhi': ['Hauz Khas','Lajpat Nagar','Green Park','Defence Colony'],
  Kolkata: ['Park Street','Salt Lake','New Town','Howrah'],
  Ahmedabad: ['Navrangpura','Vastrapur','Satellite','Bopal'],
};

const CATEGORIES = ['Music','Food','Sports','Tech','Art','Comedy','Cultural','Education','Other'];

type EventForm = {
  title: string; description: string; category: string; imageUrl: string;
  date: string; endDate: string;
  venueName: string; venueAddress: string;
  country: string; state: string; district: string; city: string; pincode: string;
  ticketPrice: string; totalSeats: string; tags: string;
};

const EMPTY_FORM: EventForm = {
  title:'', description:'', category:'Music', imageUrl:'',
  date:'', endDate:'',
  venueName:'', venueAddress:'',
  country:'India', state:'', district:'', city:'', pincode:'',
  ticketPrice:'0', totalSeats:'100', tags:'',
};

export const EventOrganizerDashboard = () => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'events'|'bookings'>('events');
  const [selectedEventBookings, setSelectedEventBookings] = useState<any[]>([]);
  const [bookingsEvent, setBookingsEvent] = useState<any>(null);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const isOrganizer = user?.role === 'event_organizer';

  useEffect(() => { if (isOrganizer) fetchEvents(); }, [user]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/events/organizer/my-events');
      setEvents(data.data || []);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditingEvent(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (ev: any) => {
    setEditingEvent(ev);
    setForm({
      title: ev.title, description: ev.description, category: ev.category,
      imageUrl: ev.imageUrl || '', date: ev.date?.slice(0,16) || '',
      endDate: ev.endDate?.slice(0,16) || '',
      venueName: ev.venue.name, venueAddress: ev.venue.address,
      country: ev.venue.country, state: ev.venue.state,
      district: ev.venue.district, city: ev.venue.city, pincode: ev.venue.pincode || '',
      ticketPrice: String(ev.ticketPrice), totalSeats: String(ev.totalSeats),
      tags: (ev.tags || []).join(', '),
    });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title, description: form.description, category: form.category,
        imageUrl: form.imageUrl || undefined,
        date: new Date(form.date).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        venue: { name: form.venueName, address: form.venueAddress, country: form.country, state: form.state, district: form.district, city: form.city, pincode: form.pincode },
        ticketPrice: Number(form.ticketPrice),
        totalSeats: Number(form.totalSeats),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (editingEvent) {
        const { data } = await api.patch(`/events/${editingEvent._id}`, payload);
        setEvents(prev => prev.map(e => e._id === editingEvent._id ? data.data : e));
        toast.success('Event updated!');
      } else {
        const { data } = await api.post('/events', payload);
        setEvents(prev => [data.data, ...prev]);
        toast.success('🎉 Event created and published!');
      }
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save event');
    } finally { setSaving(false); }
  };

  const handleToggle = async (ev: any) => {
    try {
      const { data } = await api.patch(`/events/${ev._id}/toggle`);
      setEvents(prev => prev.map(e => e._id === ev._id ? data.data : e));
      toast.success(data.data.isActive ? 'Event activated ✅' : 'Event deactivated');
    } catch { toast.error('Failed to toggle event'); }
  };

  const viewBookings = async (ev: any) => {
    setBookingsEvent(ev);
    setActiveTab('bookings');
    setBookingsLoading(true);
    try {
      const { data } = await api.get(`/events/${ev._id}/bookings`);
      setSelectedEventBookings(data.data || []);
    } catch { toast.error('Failed to load bookings'); }
    finally { setBookingsLoading(false); }
  };

  const setF = (k: keyof EventForm) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const stateList = STATES[form.country] || [];
  const districtList = DISTRICTS[form.state] || [];
  const cityList = CITIES[form.district] || [];

  if (!isOrganizer) return <Navigate to="/" replace />;

  if (loading) return (
    <div className="page container dashboard-loading">
      <Loader2 size={32} className="spin" />
      <p>Loading your events…</p>
    </div>
  );

  return (
    <div className="organizer-dashboard page">
      <div className="container">
        <div className="organizer-header">
          <div>
            <h1>
              <CalendarHeart size={28} style={{ verticalAlign: 'middle', marginRight: 8, color: '#7c3aed' }} />
              Event Organizer Dashboard
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Welcome, {user?.profile.firstName}! Manage your events and track bookings.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="organizer-stats-mini">
              <span><Calendar size={14} /> {events.length} Events</span>
              <span><Users size={14} /> {events.filter(e => e.isActive).length} Active</span>
            </div>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} /> Create Event
            </button>
          </div>
        </div>

        <div className="dashboard-tabs" style={{ marginBottom: '1.5rem' }}>
          <button className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
            <Calendar size={16} /> My Events
          </button>
          {bookingsEvent && (
            <button className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
              <Ticket size={16} /> Bookings — {bookingsEvent.title}
            </button>
          )}
        </div>

        {activeTab === 'events' && (
          events.length === 0 ? (
            <div className="empty-state">
              <CalendarHeart size={48} style={{ opacity: 0.3 }} />
              <p>No events yet. Create your first event to get started!</p>
              <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Create Event</button>
            </div>
          ) : (
            <div className="organizer-events-grid">
              {events.map(ev => (
                <div key={ev._id} className={`organizer-event-card card ${!ev.isActive ? 'event-inactive' : ''}`}>
                  <div className="organizer-event-img">
                    <img src={ev.imageUrl || `https://picsum.photos/seed/${ev._id}/500/220`} alt={ev.title} />
                    <span className="event-category-badge">{ev.category}</span>
                    {!ev.isActive && <div className="event-inactive-overlay">Deactivated</div>}
                  </div>
                  <div className="organizer-event-body">
                    <h3>{ev.title}</h3>
                    <div className="organizer-event-meta">
                      <span><Calendar size={12} /> {new Date(ev.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</span>
                      <span>📍 {ev.venue.city}, {ev.venue.state}</span>
                      <span><Ticket size={12} /> {ev.availableSeats}/{ev.totalSeats} seats</span>
                      <span>₹{ev.ticketPrice}</span>
                    </div>
                    <div className="organizer-event-actions">
                      <button className="btn-icon btn-ghost" title={ev.isActive ? 'Deactivate' : 'Activate'} onClick={() => handleToggle(ev)}>
                        {ev.isActive ? <ToggleRight size={22} color="#10b981" /> : <ToggleLeft size={22} />}
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => viewBookings(ev)}>
                        <Eye size={14} /> Bookings
                      </button>
                      <button className="btn-icon btn-ghost" title="Edit" onClick={() => openEdit(ev)}>
                        <Edit2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'bookings' && bookingsEvent && (
          <div>
            <div className="section-header">
              <h2>Bookings for "{bookingsEvent.title}"</h2>
              <span className="badge" style={{ background: 'var(--primary)', color: '#fff' }}>
                {selectedEventBookings.length} confirmed
              </span>
            </div>
            {bookingsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 size={28} className="spin" /></div>
            ) : selectedEventBookings.length === 0 ? (
              <div className="empty-state"><Ticket size={36} style={{ opacity: 0.3 }} /><p>No bookings yet.</p></div>
            ) : (
              <div className="orders-table-wrapper">
                <table className="orders-table">
                  <thead>
                    <tr><th>Booking Ref</th><th>Customer</th><th>Email</th><th>Tickets</th><th>Amount</th><th>Payment</th><th>Booked On</th></tr>
                  </thead>
                  <tbody>
                    {selectedEventBookings.map((b: any) => (
                      <tr key={b._id}>
                        <td><strong>{b.bookingRef}</strong></td>
                        <td>{b.userId?.profile?.firstName} {b.userId?.profile?.lastName}</td>
                        <td>{b.userId?.email}</td>
                        <td>{b.tickets}</td>
                        <td>₹{b.totalAmount}</td>
                        <td>
                          <span style={{ textTransform: 'capitalize' }}>{b.paymentMethod === 'cod' ? 'Venue Pay' : b.paymentMethod}</span>
                          <br />
                          <small style={{ color: b.paymentStatus === 'completed' ? '#10b981' : '#f59e0b' }}>{b.paymentStatus}</small>
                        </td>
                        <td>{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="organizer-form-modal card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
              <button className="btn-icon btn-ghost" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave} className="organizer-form modal-body">
              <div className="form-section-title">Basic Information</div>
              <div className="input-group">
                <label>Event Title *</label>
                <input className="input" required placeholder="e.g. Nashik Wine Festival 2026" value={form.title} onChange={setF('title')} />
              </div>
              <div className="input-group">
                <label>Description *</label>
                <textarea className="input" required rows={3} placeholder="Tell attendees about this event…" value={form.description} onChange={setF('description')} />
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label>Category *</label>
                  <select className="input" value={form.category} onChange={setF('category')}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Image URL</label>
                  <input className="input" placeholder="https://…" value={form.imageUrl} onChange={setF('imageUrl')} />
                </div>
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label>Start Date & Time *</label>
                  <input className="input" required type="datetime-local" value={form.date} onChange={setF('date')} />
                </div>
                <div className="input-group">
                  <label>End Date & Time</label>
                  <input className="input" type="datetime-local" value={form.endDate} onChange={setF('endDate')} />
                </div>
              </div>

              <div className="form-section-title" style={{ marginTop: '0.5rem' }}>
                📍 Event Location
                <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
                  Country → State → District → City
                </span>
              </div>
              <div className="location-cascade">
                <div className="input-group">
                  <label>Country *</label>
                  <select className="input" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value, state:'', district:'', city:'' }))}>
                    <option value="">Select Country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <ChevronDown size={16} className="cascade-arrow" />
                <div className="input-group">
                  <label>State *</label>
                  <select className="input" required value={form.state} disabled={!form.country} onChange={e => setForm(f => ({ ...f, state: e.target.value, district:'', city:'' }))}>
                    <option value="">Select State</option>
                    {stateList.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <ChevronDown size={16} className="cascade-arrow" />
                <div className="input-group">
                  <label>District *</label>
                  <select className="input" required value={form.district} disabled={!form.state} onChange={e => setForm(f => ({ ...f, district: e.target.value, city:'' }))}>
                    <option value="">Select District</option>
                    {districtList.length > 0 ? districtList.map(d => <option key={d} value={d}>{d}</option>) : null}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <ChevronDown size={16} className="cascade-arrow" />
                <div className="input-group">
                  <label>City *</label>
                  <select className="input" required value={form.city} disabled={!form.district} onChange={setF('city')}>
                    <option value="">Select City</option>
                    {cityList.length > 0 ? cityList.map(c => <option key={c} value={c}>{c}</option>) : null}
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="input-group">
                  <label>Venue Name *</label>
                  <input className="input" required placeholder="e.g. Convention Centre" value={form.venueName} onChange={setF('venueName')} />
                </div>
                <div className="input-group">
                  <label>Pincode</label>
                  <input className="input" placeholder="422001" value={form.pincode} onChange={setF('pincode')} />
                </div>
              </div>
              <div className="input-group">
                <label>Full Venue Address *</label>
                <input className="input" required placeholder="Street / locality" value={form.venueAddress} onChange={setF('venueAddress')} />
              </div>

              <div className="form-section-title" style={{ marginTop: '0.5rem' }}>🎟 Ticketing</div>
              <div className="form-row">
                <div className="input-group">
                  <label>Ticket Price (₹) *</label>
                  <input className="input" required type="number" min="0" placeholder="0 = free" value={form.ticketPrice} onChange={setF('ticketPrice')} />
                </div>
                <div className="input-group">
                  <label>Total Seats *</label>
                  <input className="input" required type="number" min="1" value={form.totalSeats} onChange={setF('totalSeats')} />
                </div>
              </div>
              <div className="input-group">
                <label>Tags (comma-separated)</label>
                <input className="input" placeholder="outdoor, family, live-music" value={form.tags} onChange={setF('tags')} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                  {saving ? <Loader2 size={18} className="spin" /> : <><ChevronRight size={18} /> {editingEvent ? 'Update Event' : 'Publish Event'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

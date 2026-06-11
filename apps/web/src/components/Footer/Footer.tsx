import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
  ChefHat,
  Bike,
  CalendarHeart,
  User,
  X,
  Send,
  CheckCircle,
} from 'lucide-react';
import './Footer.css';

/* ── Types ─────────────────────────────────────── */
type UserType = 'customer' | 'restaurant' | 'event_organizer' | 'delivery';

interface FormData {
  userType: UserType;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  // restaurant-specific
  restaurantName?: string;
  cuisine?: string;
  // organizer-specific
  eventType?: string;
  expectedGuests?: string;
  // delivery-specific
  vehicleType?: string;
  city?: string;
}

const USER_TYPE_CONFIG: Record<UserType, { label: string; icon: React.ReactNode; color: string; accent: string }> = {
  customer: {
    label: 'Customer',
    icon: <User size={18} />,
    color: '#f97316',
    accent: 'rgba(249,115,22,0.15)',
  },
  restaurant: {
    label: 'Restaurant Owner',
    icon: <ChefHat size={18} />,
    color: '#10b981',
    accent: 'rgba(16,185,129,0.15)',
  },
  event_organizer: {
    label: 'Event Organizer',
    icon: <CalendarHeart size={18} />,
    color: '#8b5cf6',
    accent: 'rgba(139,92,246,0.15)',
  },
  delivery: {
    label: 'Delivery Partner',
    icon: <Bike size={18} />,
    color: '#3b82f6',
    accent: 'rgba(59,130,246,0.15)',
  },
};

const INITIAL_FORM: FormData = {
  userType: 'customer',
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  restaurantName: '',
  cuisine: '',
  eventType: '',
  expectedGuests: '',
  vehicleType: '',
  city: '',
};

/* ── Contact Modal ─────────────────────────────── */
const ContactModal = ({ onClose }: { onClose: () => void }) => {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const cfg = USER_TYPE_CONFIG[form.userType];

  const set = (key: keyof FormData, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="contact-modal" role="dialog" aria-modal="true" aria-label="Contact Us">
        {/* Header */}
        <div className="modal-header" style={{ '--modal-accent': cfg.color } as React.CSSProperties}>
          <div className="modal-header-content">
            <span className="modal-icon" style={{ background: cfg.accent, color: cfg.color }}>
              📬
            </span>
            <div>
              <h2 className="modal-title">Get in Touch</h2>
              <p className="modal-subtitle">We'd love to hear from you!</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="modal-success">
            <div className="success-icon">
              <CheckCircle size={56} />
            </div>
            <h3>Message Sent! 🎉</h3>
            <p>Thank you for reaching out. Our team will get back to you within 24 hours.</p>
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            {/* User Type Selector */}
            <div className="form-section">
              <label className="form-label">I am a…</label>
              <div className="user-type-grid">
                {(Object.entries(USER_TYPE_CONFIG) as [UserType, typeof USER_TYPE_CONFIG[UserType]][]).map(
                  ([key, conf]) => (
                    <button
                      key={key}
                      type="button"
                      className={`user-type-btn ${form.userType === key ? 'active' : ''}`}
                      style={
                        {
                          '--ut-color': conf.color,
                          '--ut-accent': conf.accent,
                        } as React.CSSProperties
                      }
                      onClick={() => setForm({ ...INITIAL_FORM, userType: key })}
                    >
                      <span className="ut-icon">{conf.icon}</span>
                      <span className="ut-label">{conf.label}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Common Fields */}
            <div className="form-row">
              <div className="input-group">
                <label className="form-label" htmlFor="contact-name">Full Name *</label>
                <input
                  id="contact-name"
                  className="input"
                  type="text"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label className="form-label" htmlFor="contact-email">Email Address *</label>
                <input
                  id="contact-email"
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="input-group">
                <label className="form-label" htmlFor="contact-phone">Phone Number</label>
                <input
                  id="contact-phone"
                  className="input"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="form-label" htmlFor="contact-subject">Subject *</label>
                <input
                  id="contact-subject"
                  className="input"
                  type="text"
                  placeholder="How can we help?"
                  value={form.subject}
                  onChange={(e) => set('subject', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Restaurant-specific fields */}
            {form.userType === 'restaurant' && (
              <div className="form-row role-fields">
                <div className="input-group">
                  <label className="form-label" htmlFor="contact-restaurant-name">Restaurant Name *</label>
                  <input
                    id="contact-restaurant-name"
                    className="input"
                    type="text"
                    placeholder="Your Restaurant Name"
                    value={form.restaurantName}
                    onChange={(e) => set('restaurantName', e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="form-label" htmlFor="contact-cuisine">Cuisine Type</label>
                  <input
                    id="contact-cuisine"
                    className="input"
                    type="text"
                    placeholder="e.g. Italian, Indian, Chinese"
                    value={form.cuisine}
                    onChange={(e) => set('cuisine', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Event Organizer-specific fields */}
            {form.userType === 'event_organizer' && (
              <div className="form-row role-fields">
                <div className="input-group">
                  <label className="form-label" htmlFor="contact-event-type">Event Type *</label>
                  <select
                    id="contact-event-type"
                    className="input"
                    value={form.eventType}
                    onChange={(e) => set('eventType', e.target.value)}
                  >
                    <option value="">Select event type</option>
                    <option value="wedding">Wedding</option>
                    <option value="corporate">Corporate</option>
                    <option value="birthday">Birthday Party</option>
                    <option value="festival">Food Festival</option>
                    <option value="concert">Concert</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="form-label" htmlFor="contact-guests">Expected Guests</label>
                  <input
                    id="contact-guests"
                    className="input"
                    type="number"
                    placeholder="e.g. 200"
                    value={form.expectedGuests}
                    onChange={(e) => set('expectedGuests', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Delivery Partner-specific fields */}
            {form.userType === 'delivery' && (
              <div className="form-row role-fields">
                <div className="input-group">
                  <label className="form-label" htmlFor="contact-vehicle">Vehicle Type *</label>
                  <select
                    id="contact-vehicle"
                    className="input"
                    value={form.vehicleType}
                    onChange={(e) => set('vehicleType', e.target.value)}
                  >
                    <option value="">Select vehicle</option>
                    <option value="bicycle">Bicycle</option>
                    <option value="scooter">Scooter / Moped</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="car">Car</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="form-label" htmlFor="contact-city">Operating City *</label>
                  <input
                    id="contact-city"
                    className="input"
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Message */}
            <div className="input-group">
              <label className="form-label" htmlFor="contact-message">Message *</label>
              <textarea
                id="contact-message"
                className="input contact-textarea"
                placeholder="Tell us more about your enquiry…"
                value={form.message}
                onChange={(e) => set('message', e.target.value)}
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary contact-submit"
              disabled={loading}
              style={{ '--btn-color': cfg.color } as React.CSSProperties}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  <Send size={18} />
                  Send Message
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ── Footer ─────────────────────────────────────── */
export const Footer = () => {
  const [showContact, setShowContact] = useState(false);

  return (
    <>
      <footer className="footer">
        {/* Decorative top bar */}
        <div className="footer-topbar" />

        <div className="footer-body">
          <div className="container footer-grid">
            {/* Brand column */}
            <div className="footer-brand-col">
              <Link to="/" className="footer-logo">
                <span className="footer-logo-icon">🍕</span>
                <span className="footer-logo-text">FoodHub</span>
              </Link>
              <p className="footer-tagline">
                Connecting food lovers with the finest restaurants, events, and delivery partners — all in one delicious platform.
              </p>
              <div className="footer-socials">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="social-link">
                  <Instagram size={18} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="social-link">
                  <Twitter size={18} />
                </a>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="social-link">
                  <Facebook size={18} />
                </a>
                <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="social-link">
                  <Youtube size={18} />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-col">
              <h4 className="footer-col-title">Explore</h4>
              <ul className="footer-links">
                <li><Link to="/discover">🗺️ Discover Restaurants</Link></li>
                <li><Link to="/dine-out">🍽️ Dine Out</Link></li>
                <li><Link to="/events">🎉 Events</Link></li>
                <li><Link to="/cart">🛒 My Cart</Link></li>
                <li><Link to="/orders">📦 My Orders</Link></li>
              </ul>
            </div>

            {/* Partner Links */}
            <div className="footer-col">
              <h4 className="footer-col-title">Partner With Us</h4>
              <ul className="footer-links">
                <li>
                  <Link to="/register">
                    <ChefHat size={14} style={{ display: 'inline', marginRight: 6 }} />
                    List Your Restaurant
                  </Link>
                </li>
                <li>
                  <Link to="/register">
                    <Bike size={14} style={{ display: 'inline', marginRight: 6 }} />
                    Become a Delivery Partner
                  </Link>
                </li>
                <li>
                  <Link to="/register">
                    <CalendarHeart size={14} style={{ display: 'inline', marginRight: 6 }} />
                    Host an Event
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="footer-col">
              <h4 className="footer-col-title">Contact Us</h4>
              <ul className="footer-contact-list">
                <li>
                  <MapPin size={16} className="contact-icon" />
                  <span> Foodie Lane, College Road , Nashik 422009</span>
                </li>
                <li>
                  <Phone size={16} className="contact-icon" />
                  <a href="tel:+918888888888">+91 88888 88888</a>
                </li>
                <li>
                  <Mail size={16} className="contact-icon" />
                  <a href="mailto:hello@foodhub.in">hello@foodhub.in</a>
                </li>
              </ul>

              <button
                id="footer-contact-btn"
                className="btn footer-contact-btn"
                onClick={() => setShowContact(true)}
              >
                ✉️ &nbsp;Send Us a Message
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="footer-bottom">
          <div className="container footer-bottom-inner">
            <p className="footer-copy">
              © {new Date().getFullYear()} FoodHub. All rights reserved. Made with ❤️ in India.
            </p>
            <div className="footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
    </>
  );
};

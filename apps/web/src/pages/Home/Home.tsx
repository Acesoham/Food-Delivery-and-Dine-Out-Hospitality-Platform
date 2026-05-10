import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, Shield, ArrowRight, Utensils, Truck, Calendar } from 'lucide-react';
import './Home.css';

export const Home = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-text">
            <div className="hero-badge">
              <span>🔥</span> #1 Food Delivery Platform
            </div>
            <h1>
              Discover, Order & <span className="gradient-text">Dine</span> — All in One Place
            </h1>
            <p className="hero-subtitle">
              From your favorite local restaurants to exclusive dining experiences.
              Order delivery, reserve tables, and discover events near you.
            </p>
            <div className="hero-actions">
              <Link to="/discover" className="btn btn-primary btn-lg">
                <MapPin size={20} />
                Explore Near Me
                <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg">
                Join Free
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <strong>500+</strong>
                <span>Restaurants</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <strong>50K+</strong>
                <span>Happy Users</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <strong>4.8</strong>
                <span>Avg Rating</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card card-1">
              <span className="hero-card-emoji">🍕</span>
              <span>Pizza Paradise</span>
              <span className="hero-card-rating">⭐ 4.8</span>
            </div>
            <div className="hero-card card-2">
              <span className="hero-card-emoji">🍜</span>
              <span>Dragon Wok</span>
              <span className="hero-card-rating">⭐ 4.6</span>
            </div>
            <div className="hero-card card-3">
              <span className="hero-card-emoji">🍣</span>
              <span>Sushi Zen</span>
              <span className="hero-card-rating">⭐ 4.9</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Everything You Need</h2>
          <p className="section-subtitle">One platform, endless possibilities</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#fff7ed' }}>
                <Truck size={28} color="#f97316" />
              </div>
              <h3>Fast Delivery</h3>
              <p>Get your food delivered in under 30 minutes with real-time GPS tracking.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#f0fdf4' }}>
                <Calendar size={28} color="#10b981" />
              </div>
              <h3>Table Reservations</h3>
              <p>Book tables at your favorite restaurants instantly. No waiting, no hassle.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#eff6ff' }}>
                <Star size={28} color="#3b82f6" />
              </div>
              <h3>Earn Rewards</h3>
              <p>Write reviews, earn loyalty points, and unlock exclusive discounts.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon" style={{ background: '#fdf2f8' }}>
                <Shield size={28} color="#ec4899" />
              </div>
              <h3>Secure Payments</h3>
              <p>Stripe-powered checkout with full encryption and buyer protection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Discover</h3>
              <p>Find restaurants near you using our geospatial search engine.</p>
            </div>
            <div className="step-connector" />
            <div className="step">
              <div className="step-number">2</div>
              <h3>Order</h3>
              <p>Add items to your cart and checkout securely with Stripe.</p>
            </div>
            <div className="step-connector" />
            <div className="step">
              <div className="step-number">3</div>
              <h3>Track</h3>
              <p>Watch your order in real-time as the courier brings it to you.</p>
            </div>
            <div className="step-connector" />
            <div className="step">
              <div className="step-number">4</div>
              <h3>Review</h3>
              <p>Share your experience, earn points, and help the community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container cta-content">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of food lovers and discover your next favorite meal.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            <Utensils size={20} />
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Clock, Shield, ArrowRight, Utensils, Truck, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import './Home.css';

const heroSlides = [
  {
    id: 1,
    image: '/hero_slide_1.png',
    tag: '🔥 #1 Food Delivery Platform',
    headline: 'Discover, Order &',
    highlight: 'Dine',
    rest: '— All in One Place',
    subtitle: 'From your favourite local restaurants to exclusive dining experiences. Order delivery, reserve tables, and discover events near you.',
  },
  {
    id: 2,
    image: '/hero_slide_2.png',
    tag: '🍕 Over 500 Restaurants',
    headline: 'Authentic Flavours,',
    highlight: 'Delivered',
    rest: 'To Your Door',
    subtitle: 'Craving something special? Browse hundreds of cuisines and get hot, fresh meals delivered in under 30 minutes.',
  },
  {
    id: 3,
    image: '/hero_slide_3.png',
    tag: '⭐ 4.8 Average Rating',
    headline: 'Reserve, Relax &',
    highlight: 'Enjoy',
    rest: 'The Perfect Dining',
    subtitle: 'Book a table at top-rated restaurants instantly. No phone calls, no waiting — just seamless, memorable dining.',
  },
];

export const Home = () => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = (index: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 700);
  };

  const prev = () => goTo((current - 1 + heroSlides.length) % heroSlides.length);
  const next = () => goTo((current + 1) % heroSlides.length);

  useEffect(() => {
    const interval = setInterval(() => {
      goTo((current + 1) % heroSlides.length);
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const slide = heroSlides[current];

  return (
    <div className="home">
      {/* Hero Slider Section */}
      <section className="hero-slider">
        {/* Background slides */}
        {heroSlides.map((s, i) => (
          <div
            key={s.id}
            className={`slide-bg ${i === current ? 'slide-bg--active' : ''}`}
            style={{ backgroundImage: `url(${s.image})` }}
          />
        ))}

        {/* Dark overlay */}
        <div className="slide-overlay" />

        {/* Content */}
        <div className={`container hero-slider-content ${animating ? 'hero-slider-content--fade' : ''}`}>
          <div className="hero-text-wrap">
            <div className="hero-badge hero-badge--light">
              <span>{slide.tag}</span>
            </div>

            <h1 className="hero-heading">
              {slide.headline}{' '}
              <span className="gradient-text">{slide.highlight}</span>{' '}
              {slide.rest}
            </h1>

            <p className="hero-subtitle">{slide.subtitle}</p>

            <div className="hero-actions">
              <Link to="/discover" className="btn btn-primary btn-lg">
                <MapPin size={20} />
                Explore Near Me
                <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn btn-outline-light btn-lg">
                Join Free
              </Link>
            </div>

            <div className="hero-stats">
              <div className="stat stat--light">
                <strong>500+</strong>
                <span>Restaurants</span>
              </div>
              <div className="stat-divider stat-divider--light" />
              <div className="stat stat--light">
                <strong>50K+</strong>
                <span>Happy Users</span>
              </div>
              <div className="stat-divider stat-divider--light" />
              <div className="stat stat--light">
                <strong>4.8</strong>
                <span>Avg Rating</span>
              </div>
            </div>
          </div>

          {/* Floating restaurant cards */}
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

        {/* Slider Controls */}
        <button className="slider-arrow slider-arrow--left" onClick={prev} aria-label="Previous slide">
          <ChevronLeft size={24} />
        </button>
        <button className="slider-arrow slider-arrow--right" onClick={next} aria-label="Next slide">
          <ChevronRight size={24} />
        </button>

        {/* Dots */}
        <div className="slider-dots">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              className={`slider-dot ${i === current ? 'slider-dot--active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="slider-progress">
          <div key={current} className="slider-progress-bar" />
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
              <p>Book tables at your favourite restaurants instantly. No waiting, no hassle.</p>
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
              <p>Razorpay / COD checkout with full encryption and buyer protection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Four simple steps to your perfect meal</p>
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
              <p>Add items to your cart and checkout securely with Razorpay / COD.</p>
            </div>
            <div className="step-connector" />
            <div className="step">
              <div className="step-number">3</div>
              <h3>Track</h3>
              <p>Follow your order in real-time with our advanced tracking system.</p>
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
          <p>Join thousands of food lovers and discover your next favourite meal.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            <Utensils size={20} />
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

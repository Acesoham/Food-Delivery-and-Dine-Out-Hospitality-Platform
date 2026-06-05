import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, ChefHat, MapPin, Bike, CalendarHeart } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useEffect, useRef, useState } from 'react';
import './Navbar.css';

const TIER_CONFIG: Record<string, { emoji: string; color: string; glow: string }> = {
  Bronze:   { emoji: '🥉', color: '#cd7f32', glow: 'rgba(205,127,50,0.35)' },
  Silver:   { emoji: '🥈', color: '#94a3b8', glow: 'rgba(148,163,184,0.35)' },
  Gold:     { emoji: '🥇', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)'  },
  Platinum: { emoji: '💎', color: '#8b5cf6', glow: 'rgba(139,92,246,0.4)'  },
};

const getTier = (pts: number) =>
  pts >= 1500 ? 'Platinum' : pts >= 500 ? 'Gold' : pts >= 100 ? 'Silver' : 'Bronze';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((s) => s.getItemCount());
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const role = user?.role;
  const isConsumer = !isAuthenticated || role === 'consumer';
  const isMerchant = isAuthenticated && role === 'merchant';
  const isCourier = isAuthenticated && role === 'courier';
  const isOrganizer = isAuthenticated && role === 'event_organizer';

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🍕</span>
          <span className="brand-text">FoodHub</span>
        </Link>

        <div className="navbar-links">
          {/* Discover & Dine Out — only for consumers / logged-out users */}
          {isConsumer && (
            <>
              <Link to="/discover" className="nav-link">
                <MapPin size={18} />
                Discover
              </Link>
              <Link to="/dine-out" className="nav-link nav-link-dineout">
                <ChefHat size={18} />
                Dine Out
              </Link>
            </>
          )}

          {/* Consumer links: Orders + Events */}
          {isConsumer && (
            <>
              <Link to="/events" className="nav-link">
                <CalendarHeart size={18} />
                Events
              </Link>
              {isAuthenticated && (
                <Link to="/orders" className="nav-link">
                  My Orders
                </Link>
              )}
            </>
          )}

          {/* Merchant dashboard link */}
          {isMerchant && (
            <Link to="/dashboard" className="nav-link">
              <ChefHat size={18} />
              Dashboard
            </Link>
          )}

          {/* Courier hub link */}
          {isCourier && (
            <Link to="/courier-dashboard" className="nav-link nav-link-courier">
              <Bike size={18} />
              Courier Hub
            </Link>
          )}

          {/* Event Organizer dashboard link */}
          {isOrganizer && (
            <Link to="/event-organizer/dashboard" className="nav-link" style={{ color: '#7c3aed' }}>
              <CalendarHeart size={18} />
              My Events
            </Link>
          )}
        </div>

        <div className="navbar-actions">
          {/* Cart — only for consumers */}
          {isConsumer && (
            <Link to="/cart" className="cart-btn">
              <ShoppingCart size={20} />
              {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
            </Link>
          )}

          {isAuthenticated ? (
            <div className="user-menu">
              <Link to="/profile" className="user-avatar">
                <User size={18} />
                <span>{user?.profile.firstName}</span>
              </Link>
              {isConsumer && user && (
                <LoyaltyPill points={user.loyaltyPoints ?? 0} />
              )}
              <button onClick={handleLogout} className="btn-ghost btn-icon" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

/* ── LoyaltyPill — animated tier + points badge ──────────────────── */
const LoyaltyPill = ({ points }: { points: number }) => {
  const tier = getTier(points);
  const { emoji, color, glow } = TIER_CONFIG[tier];
  const [pop, setPop] = useState(false);
  const prevRef = useRef(points);

  // Trigger pop animation whenever points increase
  useEffect(() => {
    if (points !== prevRef.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 600);
      prevRef.current = points;
      return () => clearTimeout(t);
    }
  }, [points]);

  return (
    <Link
      to="/dashboard"
      className={`lp-pill ${pop ? 'lp-pill--pop' : ''}`}
      style={{ '--lp-color': color, '--lp-glow': glow } as React.CSSProperties}
      title={`${tier} Member — ${points} loyalty points`}
    >
      <span className="lp-emoji">{emoji}</span>
      <span className="lp-pts">{points.toLocaleString()}</span>
      <span className="lp-label">pts</span>
    </Link>
  );
};

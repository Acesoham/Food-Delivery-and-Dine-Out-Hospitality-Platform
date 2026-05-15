import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, ChefHat, MapPin, Bike } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import './Navbar.css';

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

          {/* Consumer links */}
          {isAuthenticated && isConsumer && (
            <Link to="/orders" className="nav-link">
              My Orders
            </Link>
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
                <span className="loyalty-points" title="Loyalty Points">
                  ⭐ {user.loyaltyPoints}
                </span>
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

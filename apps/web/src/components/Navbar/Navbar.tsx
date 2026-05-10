import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, ChefHat, MapPin } from 'lucide-react';
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

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🍕</span>
          <span className="brand-text">FoodHub</span>
        </Link>

        <div className="navbar-links">
          <Link to="/discover" className="nav-link">
            <MapPin size={18} />
            Discover
          </Link>

          {isAuthenticated && (
            <>
              <Link to="/orders" className="nav-link">
                My Orders
              </Link>
              {user?.role === 'merchant' && (
                <Link to="/dashboard" className="nav-link">
                  <ChefHat size={18} />
                  Dashboard
                </Link>
              )}
            </>
          )}
        </div>

        <div className="navbar-actions">
          <Link to="/cart" className="cart-btn">
            <ShoppingCart size={20} />
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>

          {isAuthenticated ? (
            <div className="user-menu">
              <Link to="/profile" className="user-avatar">
                <User size={18} />
                <span>{user?.profile.firstName}</span>
              </Link>
              {user && (
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

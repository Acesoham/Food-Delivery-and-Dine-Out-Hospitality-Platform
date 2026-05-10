import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import './Cart.css';

export const Cart = () => {
  const { items, restaurantName, removeItem, updateQuantity, clearCart, getSubtotal } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const subtotal = getSubtotal();
  const deliveryFee = items.length > 0 ? 49 : 0;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + deliveryFee + tax;

  if (items.length === 0) {
    return (
      <div className="cart-page page">
        <div className="container">
          <div className="cart-empty">
            <ShoppingBag size={64} strokeWidth={1} />
            <h2>Your cart is empty</h2>
            <p>Discover restaurants and add items to get started.</p>
            <Link to="/discover" className="btn btn-primary">
              Browse Restaurants
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page page">
      <div className="container">
        <Link to="/discover" className="back-link">
          <ArrowLeft size={18} /> Continue Shopping
        </Link>

        <div className="cart-layout">
          <div className="cart-items">
            <div className="cart-header">
              <h1>Your Cart</h1>
              <p className="cart-restaurant">From: <strong>{restaurantName}</strong></p>
            </div>

            {items.map((item) => (
              <div key={item.menuItemId} className="cart-item">
                <div className="cart-item-info">
                  <h3>{item.name}</h3>
                  <p className="cart-item-price">₹{item.price}</p>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-control">
                    <button className="qty-btn" onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}>
                      <Minus size={14} />
                    </button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="cart-item-total">₹{item.price * item.quantity}</span>
                  <button className="remove-btn" onClick={() => removeItem(item.menuItemId)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            <button className="btn btn-ghost btn-sm clear-cart" onClick={clearCart}>
              Clear Cart
            </button>
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery Fee</span>
              <span>₹{deliveryFee}</span>
            </div>
            <div className="summary-row">
              <span>Tax (5% GST)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            {isAuthenticated ? (
              <Link to="/checkout" className="btn btn-primary btn-lg checkout-btn">
                Proceed to Checkout
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary btn-lg checkout-btn">
                Login to Checkout
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

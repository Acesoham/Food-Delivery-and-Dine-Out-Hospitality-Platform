import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { orderApi } from '../../services/endpoints';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import './Checkout.css';

export const Checkout = () => {
  const { items, restaurantId, getSubtotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const subtotal = getSubtotal();
  const deliveryFee = items.length > 0 ? 49 : 0;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + deliveryFee + tax;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);
    try {
      const orderItems = items.map((i) => ({
        menuItemId: i.menuItemId,
        quantity: i.quantity,
      }));

      await orderApi.create({
        restaurantId,
        type: 'delivery',
        items: orderItems as any,
        deliveryAddress: address as any,
      });

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page container checkout-empty">
        <h2>Your cart is empty</h2>
        <button className="btn btn-primary" onClick={() => navigate('/discover')}>
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="checkout-page page">
      <div className="container">
        <button className="back-link btn-ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back to Cart
        </button>

        <div className="checkout-layout">
          <form className="checkout-form card" onSubmit={handlePlaceOrder}>
            <div className="card-body">
              <h2>Delivery Details</h2>
              <div className="input-group">
                <label>Street Address</label>
                <input
                  type="text"
                  className="input"
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                />
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div className="input-group">
                  <label>City</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>ZIP Code</label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label>State</label>
                <input
                  type="text"
                  className="input"
                  required
                  value={address.state}
                  onChange={(e) => setAddress({ ...address, state: e.target.value })}
                />
              </div>

              <div className="payment-section">
                <h2>Payment Method</h2>
                <div className="payment-card selected">
                  <CreditCard size={20} />
                  <span>Credit / Debit Card (Demo)</span>
                </div>
                <p className="text-muted" style={{ fontSize: '0.813rem', marginTop: '8px' }}>
                  Stripe integration pending. This will place a test order.
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg checkout-submit"
                disabled={loading}
              >
                {loading ? <Loader2 size={20} className="spin" /> : `Pay ₹${total.toFixed(2)}`}
              </button>
            </div>
          </form>

          <div className="checkout-summary card">
            <div className="card-body">
              <h2>Order Summary</h2>
              <div className="summary-items">
                {items.map((item) => (
                  <div key={item.menuItemId} className="summary-item">
                    <span>{item.quantity} × {item.name}</span>
                    <span>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="summary-divider" />
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row summary-total">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { orderApi, paymentApi } from '../../services/endpoints';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, CreditCard, Banknote, CheckCircle2, Smartphone } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UpiPaymentModal } from '../../components/UpiPaymentModal/UpiPaymentModal';
import './Checkout.css';

type PaymentMethod = 'card' | 'cod' | 'upi';

export const Checkout = () => {
  const { items, restaurantId, getSubtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const navigate = useNavigate();

  // UPI modal state
  const [upiModalOpen, setUpiModalOpen] = useState(false);
  const [upiOrderId, setUpiOrderId] = useState<string | null>(null);

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
    if (!restaurantId || items.length === 0) { toast.error('Cart is empty'); return; }

    setLoading(true);
    try {
      const orderItems = items.map((i) => ({
        menuItemId: i.menuItemId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));

      const deliveryAddress = {
        street: `${address.street}, ${address.city}, ${address.state} - ${address.zipCode}`,
        location: {
          type: 'Point' as const,
          coordinates: [73.7898, 19.9975] as [number, number],
        },
      };

      // ── Step 1: Create the order in DB ──
      const orderRes = await orderApi.create({
        restaurantId,
        type: 'delivery',
        items: orderItems as any,
        deliveryAddress,
        paymentMethod,
      } as any);

      const orderId = orderRes.data.data._id as string;

      // ── Step 2: UPI → open custom UPI modal ──
      if (paymentMethod === 'upi') {
        // Create Razorpay order on backend (stores razorpay order ID)
        await paymentApi.createRazorpayOrder('order', orderId);
        setUpiOrderId(orderId);
        setUpiModalOpen(true);
        setLoading(false);
        return; // Rest handled by UpiPaymentModal callbacks
      }

      // ── COD / Card (mock) ──
      const successMsg =
        paymentMethod === 'cod'
          ? `Order placed! Pay ₹${total.toFixed(2)} on delivery 💵`
          : 'Order placed successfully! 🎉';

      toast.success(successMsg);
      clearCart();
      navigate('/orders');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // Called when UPI modal reports success
  const handleUpiSuccess = () => {
    setUpiModalOpen(false);
    toast.success('🎉 UPI Payment successful! Your order is confirmed.');
    clearCart();
    navigate('/orders');
  };

  // Called when user cancels UPI modal
  const handleUpiCancel = () => {
    setUpiModalOpen(false);
    toast('Order saved. You can retry payment from My Orders.', { icon: 'ℹ️' });
    clearCart();
    navigate('/orders');
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
                <input type="text" className="input" required placeholder="123, MG Road"
                  value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div className="input-group">
                  <label>City</label>
                  <input type="text" className="input" required placeholder="Nashik"
                    value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
                </div>
                <div className="input-group">
                  <label>ZIP Code</label>
                  <input type="text" className="input" required placeholder="422001"
                    value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} />
                </div>
              </div>
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label>State</label>
                <input type="text" className="input" required placeholder="Maharashtra"
                  value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
              </div>

              {/* ── Payment Method ── */}
              <div className="payment-section">
                <h2>Payment Method</h2>
                <div className="payment-options">

                  {/* COD */}
                  <button type="button" id="payment-cod"
                    className={`payment-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('cod')}>
                    <div className="payment-card-left">
                      <span className="payment-icon payment-icon-cod"><Banknote size={22} /></span>
                      <div>
                        <span className="payment-label">Cash on Delivery</span>
                        <span className="payment-sub">Pay with cash when your order arrives</span>
                      </div>
                    </div>
                    {paymentMethod === 'cod' && <CheckCircle2 size={20} className="payment-check" />}
                  </button>

                  {/* Card (mock) */}
                  <button type="button" id="payment-card"
                    className={`payment-card ${paymentMethod === 'card' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('card')}>
                    <div className="payment-card-left">
                      <span className="payment-icon payment-icon-card"><CreditCard size={22} /></span>
                      <div>
                        <span className="payment-label">Credit / Debit Card</span>
                        <span className="payment-sub">Secure online payment (demo)</span>
                      </div>
                    </div>
                    {paymentMethod === 'card' && <CheckCircle2 size={20} className="payment-check" />}
                  </button>

                  {/* UPI */}
                  <button type="button" id="payment-upi"
                    className={`payment-card ${paymentMethod === 'upi' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('upi')}>
                    <div className="payment-card-left">
                      <span className="payment-icon payment-icon-upi"><Smartphone size={22} /></span>
                      <div>
                        <span className="payment-label">UPI Payment</span>
                        <span className="payment-sub">GPay · PhonePe · Paytm · BHIM</span>
                      </div>
                    </div>
                    {paymentMethod === 'upi' && <CheckCircle2 size={20} className="payment-check" />}
                  </button>
                </div>

                {paymentMethod === 'cod' && (
                  <div className="cod-info">💵 Keep ₹{total.toFixed(2)} ready to pay to the delivery partner.</div>
                )}
                {paymentMethod === 'card' && (
                  <div className="card-info">🔒 This will place a test order (demo mode).</div>
                )}
                {paymentMethod === 'upi' && (
                  <div className="upi-info">📱 Scan QR or pay via GPay, PhonePe, Paytm & BHIM.</div>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-lg checkout-submit"
                disabled={loading} id="place-order-btn">
                {loading ? (
                  <><Loader2 size={20} className="spin" /> Processing…</>
                ) : paymentMethod === 'cod' ? (
                  <><Banknote size={18} /> Place Order · Pay on Delivery ₹{total.toFixed(2)}</>
                ) : paymentMethod === 'upi' ? (
                  <><Smartphone size={18} /> Pay ₹{total.toFixed(2)} via UPI</>
                ) : (
                  <><CreditCard size={18} /> Pay ₹{total.toFixed(2)}</>
                )}
              </button>
            </div>
          </form>

          {/* Order Summary */}
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
              <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="summary-row"><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
              <div className="summary-row"><span>Tax (5% GST)</span><span>₹{tax.toFixed(2)}</span></div>
              <div className="summary-divider" />
              <div className="summary-row summary-total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
              <div className="summary-payment-badge">
                {paymentMethod === 'cod' ? (
                  <span className="badge-cod"><Banknote size={13} /> Cash on Delivery</span>
                ) : paymentMethod === 'upi' ? (
                  <span className="badge-upi"><Smartphone size={13} /> UPI · Razorpay</span>
                ) : (
                  <span className="badge-card"><CreditCard size={13} /> Card Payment</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom UPI Payment Modal */}
      {upiModalOpen && upiOrderId && (
        <UpiPaymentModal
          amount={total}
          orderId={upiOrderId}
          type="order"
          onSuccess={handleUpiSuccess}
          onCancel={handleUpiCancel}
        />
      )}
    </div>
  );
};

import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { CheckCircle2, Loader2, X, Smartphone, Copy, Check } from 'lucide-react';
import { paymentApi } from '../../services/endpoints';
import toast from 'react-hot-toast';
import { resolveImageUrl } from '../../utils/imageUtils';
import './UpiPaymentModal.css';

interface UpiPaymentModalProps {
  amount: number;            // in ₹
  orderId: string;           // DB order/booking ID (refId)
  type: 'order' | 'event' | 'reservation';
  restaurantUpiId?: string;  // merchant's real UPI VPA
  restaurantQrUrl?: string;  // merchant's uploaded QR image URL
  onSuccess: () => void;
  onCancel: () => void;
}

const TEST_UPI_ID = 'success@razorpay'; // Razorpay test UPI VPA
const MERCHANT_NAME = 'FoodHub';

const UPI_APPS = [
  {
    name: 'GPay',
    color: '#4285F4',
    bgColor: 'rgba(66,133,244,0.1)',
    emoji: '🔵',
    scheme: 'tez://upi/pay',
  },
  {
    name: 'PhonePe',
    color: '#5f259f',
    bgColor: 'rgba(95,37,159,0.1)',
    emoji: '🟣',
    scheme: 'phonepe://pay',
  },
  {
    name: 'Paytm',
    color: '#00BAF2',
    bgColor: 'rgba(0,186,242,0.1)',
    emoji: '🔷',
    scheme: 'paytm://cash',
  },
  {
    name: 'BHIM',
    color: '#1A6DC9',
    bgColor: 'rgba(26,109,201,0.1)',
    emoji: '🏦',
    scheme: 'bhim://pay',
  },
];

export const UpiPaymentModal = ({ amount, orderId, type, restaurantUpiId, restaurantQrUrl, onSuccess, onCancel }: UpiPaymentModalProps) => {
  const [step, setStep] = useState<'scan' | 'confirm' | 'processing' | 'success'>('scan');
  const [copied, setCopied] = useState(false);

  // Use the restaurant's own UPI ID when available; fall back to Razorpay test ID
  const effectiveUpiId = (restaurantUpiId && restaurantUpiId.trim()) ? restaurantUpiId.trim() : TEST_UPI_ID;
  const merchantName = (restaurantUpiId && restaurantUpiId.trim()) ? 'Restaurant' : MERCHANT_NAME;

  // UPI payment string for QR code
  const upiString = `upi://pay?pa=${effectiveUpiId}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(type === 'order' ? 'Food Order Payment' : type === 'event' ? 'Event Booking Payment' : 'Table Reservation Payment')}`;

  const handleCopyUpiId = () => {
    navigator.clipboard.writeText(effectiveUpiId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleAppClick = (app: typeof UPI_APPS[0]) => {
    // Attempt to open the UPI app (works on mobile)
    const upiLink = `${app.scheme}?pa=${effectiveUpiId}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR`;
    window.location.href = upiLink;
    // After attempting to open app, show confirm step
    setTimeout(() => setStep('confirm'), 1500);
  };

  const handleSimulatePayment = async () => {
    setStep('processing');
    try {
      await paymentApi.simulateUpiPayment(type, orderId);
      setStep('success');
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Payment simulation failed');
      setStep('scan');
    }
  };

  return (
    <div className="upi-modal-overlay" onClick={onCancel}>
      <div className="upi-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="upi-modal-header">
          <div className="upi-modal-title-row">
            <Smartphone size={20} />
            <span>Pay via UPI</span>
          </div>
          <button className="upi-close-btn" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        {/* Amount */}
        <div className="upi-amount-pill">
          <span className="upi-amount-label">Total Amount</span>
          <span className="upi-amount-value">₹{amount.toFixed(2)}</span>
        </div>

        {step === 'scan' && (
          <>
            {/* QR Code */}
            <div className="upi-qr-section">
              <div className="upi-qr-wrapper">
                {restaurantQrUrl ? (
                  /* Show the merchant's own uploaded QR image */
                  <img
                    src={resolveImageUrl(restaurantQrUrl)}
                    alt="Restaurant UPI QR Code"
                    style={{ width: '100%', maxWidth: 260, height: 'auto', maxHeight: 320, objectFit: 'contain', borderRadius: 8 }}
                  />
                ) : (
                  /* Auto-generate QR from UPI string */
                  <QRCodeCanvas
                    value={upiString}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#1a1a2e"
                    level="H"
                    includeMargin
                  />
                )}
                <div className="upi-qr-label">Scan with any UPI app</div>
              </div>
            </div>

            {/* Divider */}
            <div className="upi-divider"><span>or pay with app</span></div>

            {/* UPI App Buttons */}
            <div className="upi-apps-grid">
              {UPI_APPS.map((app) => (
                <button
                  key={app.name}
                  className="upi-app-btn"
                  style={{ '--app-color': app.color, '--app-bg': app.bgColor } as React.CSSProperties}
                  onClick={() => handleAppClick(app)}
                >
                  <span className="upi-app-emoji">{app.emoji}</span>
                  <span className="upi-app-name">{app.name}</span>
                </button>
              ))}
            </div>

            {/* UPI ID Copy */}
            <div className="upi-id-section">
              <span className="upi-id-label">UPI ID</span>
              <div className="upi-id-row">
                <span className="upi-id-value">{effectiveUpiId}</span>
                <button className="upi-copy-btn" onClick={handleCopyUpiId}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Show test-mode notice only when falling back to test UPI */}
            {effectiveUpiId === TEST_UPI_ID && (
              <div className="upi-test-notice">
                🧪 <strong>Test Mode</strong> — Use UPI ID <code>success@razorpay</code> in your app
              </div>
            )}

            <button className="upi-paid-btn" onClick={() => setStep('confirm')}>
              ✅ I've completed the payment
            </button>
          </>
        )}

        {step === 'confirm' && (
          <div className="upi-confirm-step">
            <div className="upi-confirm-icon">📱</div>
            <h3>Did your payment go through?</h3>
            <p>Please confirm only after your UPI app shows a <strong>success</strong> screen.</p>
            <div className="upi-confirm-actions">
              <button className="btn btn-ghost upi-back-btn" onClick={() => setStep('scan')}>
                ← Go Back
              </button>
              <button className="upi-confirm-yes-btn" onClick={handleSimulatePayment}>
                ✅ Yes, Payment Done
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="upi-processing-step">
            <Loader2 size={48} className="upi-spin" />
            <h3>Verifying Payment…</h3>
            <p>Please wait while we confirm your payment.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="upi-success-step">
            <div className="upi-success-icon">
              <CheckCircle2 size={56} />
            </div>
            <h3>Payment Successful! 🎉</h3>
            <p>Your {type === 'order' ? 'order' : type === 'event' ? 'booking' : 'reservation'} is confirmed.</p>
          </div>
        )}
      </div>
    </div>
  );
};

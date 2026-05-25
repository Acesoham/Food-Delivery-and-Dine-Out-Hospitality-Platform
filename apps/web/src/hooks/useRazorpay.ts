/**
 * useRazorpay — Custom hook to open the Razorpay payment popup.
 * Razorpay checkout.js is loaded via CDN in index.html.
 */

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;        // in paise
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
    /** Pre-opens this tab in the checkout: 'card' | 'netbanking' | 'wallet' | 'upi' | 'emi' */
    method?: string;
    /** Pre-fill UPI VPA */
    vpa?: string;
  };
  theme?: { color?: string };
  modal?: {
    ondismiss?: () => void;
    animation?: boolean;
    backdropclose?: boolean;
  };
  handler: (response: RazorpayResponse) => void;
  /** Razorpay config.display block for advanced payment method ordering */
  config?: {
    display?: {
      blocks?: Record<string, {
        name: string;
        instruments: Array<{
          method: string;
          flows?: string[];
          apps?: string[];
        }>;
      }>;
      sequence?: string[];
      preferences?: {
        show_default_blocks?: boolean;
      };
    };
  };
}

interface RazorpayInstance {
  open(): void;
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface OpenRazorpayOptions {
  /** Razorpay order ID from backend (rzp_order_...) */
  razorpayOrderId: string;
  /** Amount in ₹ rupees (hook converts to paise internally) */
  amountInRupees: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  /**
   * If true — opens UPI tab first and features QR + PhonePe/GPay/Paytm at the top.
   * If false/undefined — shows all payment options normally.
   */
  preferUpi?: boolean;
}

/**
 * Returns an `openRazorpay` function that opens the Razorpay popup.
 * Resolves with payment details on success, rejects on dismiss/failure.
 */
export const useRazorpay = () => {
  const openRazorpay = (options: OpenRazorpayOptions): Promise<RazorpayResponse> => {
    return new Promise((resolve, reject) => {
      if (typeof window.Razorpay === 'undefined') {
        reject(new Error('Razorpay SDK not loaded. Check your internet connection and try again.'));
        return;
      }

      const rzpOptions: RazorpayOptions = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID as string,
        amount: Math.round(options.amountInRupees * 100), // convert ₹ → paise
        currency: options.currency || 'INR',
        name: options.name || 'FoodHub',
        description: options.description || 'Payment',
        order_id: options.razorpayOrderId,
        prefill: {
          ...options.prefill,
          // ✅ This is the correct way to pre-open the UPI tab in Razorpay Checkout
          ...(options.preferUpi ? { method: 'upi' } : {}),
        },
        theme: { color: '#ff6b00' }, // FoodHub brand orange
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          },
          animation: true,
        },
        handler: (response: RazorpayResponse) => {
          resolve(response);
        },
      };

      // ✅ When UPI is preferred: feature UPI with QR + apps (GPay, PhonePe, Paytm) at the top
      // while still showing all other payment methods below
      if (options.preferUpi) {
        rzpOptions.config = {
          display: {
            blocks: {
              upi_block: {
                name: '📱 Pay via UPI',
                instruments: [
                  {
                    method: 'upi',
                    flows: ['qr', 'intent', 'collect'],
                    apps: ['google_pay', 'phonepe', 'paytm', 'bhim'],
                  },
                ],
              },
            },
            // Show UPI block first, then default payment options
            sequence: ['block.upi_block'],
            preferences: {
              show_default_blocks: true, // still show Cards, Netbanking etc below
            },
          },
        };
      }

      const rzp = new window.Razorpay(rzpOptions);
      rzp.open();
    });
  };

  return { openRazorpay };
};

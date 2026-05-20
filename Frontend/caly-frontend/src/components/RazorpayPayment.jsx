import { useState, useEffect } from 'react';
import { payments } from '../api/client';
import { Shield, CreditCard, Smartphone, Building2, Wallet } from 'lucide-react';

const paymentMethods = [
  { label: 'UPI', icon: Smartphone },
  { label: 'Cards', icon: CreditCard },
  { label: 'Net Banking', icon: Building2 },
  { label: 'Wallets', icon: Wallet },
];

export default function RazorpayPayment({
  eventTypeId,
  bookingId,
  bookingData,
  price,
  currency,
  onSuccess,
  onCancel,
  onError,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          resolve(true);
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript().then((loaded) => {
      if (!loaded) {
        setError('Failed to load payment gateway. Check your internet connection.');
      }
    });
  }, []);

  const handlePayNow = async () => {
    setLoading(true);
    setError('');

    let order;
    try {
      const res = await payments.createOrder({
        event_type_id: eventTypeId,
        booking_data: bookingData,
      });
      order = res.data;
    } catch (err) {
      const message = err.response?.data?.error || 'Could not initialize payment. Try again.';
      setError(message);
      setLoading(false);
      onError?.(message);
      return;
    }

    const options = {
      key: order.key_id,
      amount: order.amount,
      currency: order.currency,
      name: 'Caly',
      description: order.event_type_name,
      order_id: order.order_id,
      prefill: {
        name: order.prefill?.name || '',
        email: order.prefill?.email || '',
      },
      theme: {
        color: '#3B82F6',
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          onCancel?.();
        },
      },
      handler: async (response) => {
        await handlePaymentSuccess(response, order.order_id);
      },
      method: {
        upi: {
          flow: 'intent',
        },
      },
      config: {
        display: {
          blocks: {
            upi: {
              name: 'UPI',
              instruments: [{ method: 'upi' }],
            },
            cards: {
              name: 'Cards',
              instruments: [{ method: 'card' }],
            },
            netbanking: {
              name: 'Net Banking',
              instruments: [{ method: 'netbanking' }],
            },
            wallets: {
              name: 'Wallets',
              instruments: [{ method: 'wallet' }],
            },
          },
          sequence: ['block.upi', 'block.cards', 'block.netbanking', 'block.wallets'],
          preferences: {
            show_default_blocks: false,
          },
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response) => {
      const message = response.error?.description || 'Payment failed. Please try again.';
      setError(message);
      setLoading(false);
      onError?.(message);
    });

    rzp.open();
  };

  const handlePaymentSuccess = async (razorpayResponse, orderId) => {
    try {
      const res = await payments.verifyPayment({
        razorpay_order_id: razorpayResponse.razorpay_order_id || orderId,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
        event_type_id: eventTypeId,
        booking_id: bookingId,
        booking_data: bookingData,
      });

      onSuccess(res.data);
    } catch (err) {
      const message =
        err.response?.data?.error ||
        'Payment was successful but booking confirmation failed. Contact support.';
      setError(message);
      setLoading(false);
      onError?.(message);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-accent to-blue-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Complete Payment</h2>
              <p className="text-blue-100 text-sm mt-0.5">Secure checkout powered by Razorpay</p>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="text-white/70 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 rounded-xl p-4 mb-6 flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">Amount due</span>
            <span className="text-2xl font-bold text-blue-700">
              ₹{parseFloat(price).toFixed(2)}
            </span>
          </div>

          <div className="mb-6">
            <p className="text-xs text-slate-500 mb-3 font-medium uppercase tracking-wider">Accepted payment methods</p>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <div
                  key={method.label}
                  className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <method.icon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600 font-medium">{method.label}</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handlePayNow}
            disabled={loading}
            className="w-full bg-accent text-white py-3 px-6 rounded-xl font-semibold
                       hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Processing...
              </>
            ) : (
              <>Pay ₹{parseFloat(price).toFixed(2)}</>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 mt-4 text-slate-400">
            <Shield className="w-3.5 h-3.5" />
            <p className="text-xs">Secured by Razorpay. Your payment details are encrypted.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

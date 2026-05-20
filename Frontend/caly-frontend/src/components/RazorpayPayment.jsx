import { useState, useEffect } from 'react';
import { payments } from '../api/client';

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
        color: '#2563EB',
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-md w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Complete Payment</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6 flex items-center justify-between">
        <span className="text-sm text-blue-700 font-medium">Amount due</span>
        <span className="text-2xl font-bold text-blue-700">
          ₹{parseFloat(price).toFixed(2)}
        </span>
      </div>

      <div className="mb-6">
        <p className="text-xs text-gray-500 mb-2">Accepted payment methods:</p>
        <div className="flex gap-2 flex-wrap">
          {['UPI', 'Cards', 'Net Banking', 'Wallets'].map((method) => (
            <span
              key={method}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium"
            >
              {method}
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <button
        onClick={handlePayNow}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold
                   hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Processing...
          </>
        ) : (
          <>Pay ₹{parseFloat(price).toFixed(2)}</>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center mt-3">
        Secured by Razorpay. Your payment details are encrypted.
      </p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { payments } from '../api/client';

function PaymentForm({ bookingData, eventTypeId, price, currency, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) { setError(submitError.message); setProcessing(false); return; }
      const { error: payError } = await stripe.confirmPayment({
        elements, redirect: 'if_required',
      });
      if (payError) { setError(payError.message); setProcessing(false); return; }
      onSuccess();
    } catch { setError('Payment failed'); setProcessing(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-4">
        Total: {currency} {price}
      </div>
      <PaymentElement />
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
      <button type="submit" disabled={!stripe || processing} className="w-full bg-[#3B82F6] text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50">
        {processing ? 'Processing...' : 'Pay now'}
      </button>
    </form>
  );
}

export default function BookingConfirmed() {
  const location = useLocation();
  const state = location.state;
  const [clientSecret, setClientSecret] = useState('');
  const [stripePromise, setStripePromise] = useState(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (state?.requiresPayment) {
      payments.createPaymentIntent({
        event_type_id: state.eventTypeId,
        booking_data: state.bookingData,
      }).then((res) => {
        setClientSecret(res.data.client_secret);
        setStripePromise(loadStripe(res.data.publishable_key));
      }).catch(() => {});
    }
  }, []);

  const booking = state?.booking;
  const host = state?.host;

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><p className="text-gray-500">No booking information found.</p><Link to="/" className="text-[#3B82F6] hover:underline">Go home</Link></div>
      </div>
    );
  }

  if (state.requiresPayment && !paid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Complete payment</h1>
            {clientSecret && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm bookingData={state.bookingData} eventTypeId={state.eventTypeId} price={state.price} currency={state.currency} onSuccess={() => setPaid(true)} />
              </Elements>
            ) : (
              <p className="text-gray-500">Loading payment...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">You&apos;re scheduled!</h1>
          <p className="text-gray-500 mb-6">Your meeting has been confirmed.</p>

          {booking && (
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <p><span className="font-medium text-gray-700">Event:</span> <span className="text-gray-600">{booking.event_type_name}</span></p>
              <p><span className="font-medium text-gray-700">With:</span> <span className="text-gray-600">{host}</span></p>
              <p><span className="font-medium text-gray-700">Date:</span> <span className="text-gray-600">{new Date(booking.start_datetime).toLocaleString()}</span></p>
            </div>
          )}

          {booking?.start_datetime && (
            <a href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.event_type_name)}&dates=${new Date(booking.start_datetime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(booking.end_datetime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`} target="_blank" rel="noopener noreferrer" className="block text-center border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition mb-4">
              Add to Google Calendar
            </a>
          )}

          <Link to={`/book/${host}`} className="block text-center text-[#3B82F6] hover:underline">Book another time</Link>
        </div>
      </div>
    </div>
  );
}

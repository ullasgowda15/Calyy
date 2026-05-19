import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { payments } from '../api/client';

function PaymentForm({ eventTypeId, bookingId, bookingData, price, currency, onSuccess, onError }) {
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
      const result = await stripe.confirmPayment({
        elements, redirect: 'if_required',
      });
      if (result.error) { setError(result.error.message); setProcessing(false); return; }
      if (bookingId && result.paymentIntent) {
        try {
          await payments.confirmBookingPayment({ booking_id: bookingId, stripe_payment_intent_id: result.paymentIntent.id });
        } catch {}
      }
      onSuccess();
    } catch {
      setError('Payment failed');
      setProcessing(false);
      onError?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-4">
        Total: {currency.toUpperCase()} {price}
      </div>
      <PaymentElement />
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
      <button type="submit" disabled={!stripe || processing} className="w-full bg-[#3B82F6] text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50">
        {processing ? 'Processing...' : 'Pay now'}
      </button>
    </form>
  );
}

export default function StripePayment({ eventTypeId, bookingId, bookingData, price, currency, onSuccess, onCancel }) {
  const [clientSecret, setClientSecret] = useState('');
  const [stripePromise, setStripePromise] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    payments.createPaymentIntent({ event_type_id: eventTypeId, booking_data: bookingData })
      .then((res) => {
        setClientSecret(res.data.client_secret);
        setStripePromise(loadStripe(res.data.publishable_key));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventTypeId, bookingData]);

  if (loading) return <p className="text-gray-500 text-center">Loading payment...</p>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm max-w-md w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Complete payment</h1>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      {clientSecret && stripePromise ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm eventTypeId={eventTypeId} bookingId={bookingId} bookingData={bookingData} price={price} currency={currency} onSuccess={onSuccess} />
        </Elements>
      ) : (
        <p className="text-gray-500 text-center">Unable to load payment form.</p>
      )}
    </div>
  );
}

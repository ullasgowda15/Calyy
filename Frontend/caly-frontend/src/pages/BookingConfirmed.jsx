import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { payments } from '../api/client';

export default function BookingConfirmed() {
  const location = useLocation();
  const state = location.state;
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  useEffect(() => {
    if (state?.booking?.id) {
      setLoadingPayment(true);
      payments.getPaymentStatus(state.booking.id)
        .then((res) => setPaymentStatus(res.data.payment_status))
        .catch(() => {})
        .finally(() => setLoadingPayment(false));
    }
  }, [state]);

  const booking = state?.booking;
  const host = state?.host;

  if (!state) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><p className="text-gray-500">No booking information found.</p><Link to="/" className="text-[#3B82F6] hover:underline">Go home</Link></div>
      </div>
    );
  }

  if (state.requiresPayment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-4">Complete payment to confirm your booking</h1>
            <p className="text-gray-500 mb-6">Your booking is pending payment.</p>
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-6">
              Amount: ₹{state.price}
            </div>
            {paymentStatus === 'paid' && (
              <div className="bg-green-100 p-3 rounded-lg text-green-700 mb-4">Payment received! Your booking is confirmed.</div>
            )}
            {loadingPayment && <p className="text-gray-500 mb-4">Checking payment status...</p>}
            <Link to="/" className="block text-center text-[#3B82F6] hover:underline">Return home</Link>
          </div>
        </div>
      </div>
    );
  }

  const startDate = booking?.start_datetime ? new Date(booking.start_datetime) : null;
  const endDate = booking?.end_datetime ? new Date(booking.end_datetime) : null;

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
              <p><span className="font-medium text-gray-700">Date:</span> <span className="text-gray-600">{startDate?.toLocaleString()}</span></p>
              {paymentStatus && (
                <p>
                  <span className="font-medium text-gray-700">Payment:</span>{' '}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : paymentStatus === 'refunded' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                    {paymentStatus}
                  </span>
                </p>
              )}
            </div>
          )}

          {startDate && endDate && (
            <a
              href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking?.event_type_name || 'Meeting')}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition mb-4"
            >
              Add to Google Calendar
            </a>
          )}

          <Link to={`/book/${host}`} className="block text-center text-[#3B82F6] hover:underline">Book another time</Link>
        </div>
      </div>
    </div>
  );
}

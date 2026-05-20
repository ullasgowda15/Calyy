import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { payments } from '../api/client';
import { CheckCircle, Calendar, Clock, User, DollarSign, ArrowRight } from 'lucide-react';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="card p-8">
            <p className="text-slate-500 mb-4">No booking information found.</p>
            <Link to="/" className="btn-primary">
              Go home
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (state.requiresPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="card p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900 mb-4">Complete payment to confirm your booking</h1>
            <p className="text-slate-500 mb-6">Your booking is pending payment.</p>
            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-700 mb-6 flex items-center justify-center gap-2">
              <DollarSign className="w-4 h-4" />
              Amount: ₹{state.price}
            </div>
            {paymentStatus === 'paid' && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-green-700 mb-4 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Payment received! Your booking is confirmed.
              </div>
            )}
            {loadingPayment && <p className="text-slate-400 mb-4 text-sm">Checking payment status...</p>}
            <Link to="/" className="text-accent hover:text-blue-700 font-medium text-sm transition">Return home</Link>
          </div>
        </div>
      </div>
    );
  }

  const startDate = booking?.start_datetime ? new Date(booking.start_datetime) : null;
  const endDate = booking?.end_datetime ? new Date(booking.end_datetime) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="card p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">You&apos;re scheduled!</h1>
          <p className="text-slate-500 mb-6">Your meeting has been confirmed.</p>

          {booking && (
            <div className="text-left bg-slate-50 rounded-xl p-5 mb-6 space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Event:</span>
                <span className="text-slate-900 font-medium ml-auto">{booking.event_type_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">With:</span>
                <span className="text-slate-900 font-medium ml-auto">{host}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-500">Date:</span>
                <span className="text-slate-900 font-medium ml-auto">{startDate?.toLocaleString()}</span>
              </div>
              {paymentStatus && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Payment:</span>
                  <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                    paymentStatus === 'refunded' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {paymentStatus}
                  </span>
                </div>
              )}
            </div>
          )}

          {startDate && endDate && (
            <a
              href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking?.event_type_name || 'Meeting')}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center btn-secondary mb-4"
            >
              <Calendar className="w-4 h-4" />
              Add to Google Calendar
            </a>
          )}

          <Link to={`/book/${host}`} className="text-accent hover:text-blue-700 font-medium text-sm transition">
            Book another time
          </Link>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { payments } from '../api/client';

export default function BookingConfirmed() {
  const location = useLocation();
  const state = location.state;
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    if (state?.booking?.id) {
      payments.getPaymentStatus(state.booking.id)
        .then((res) => setPaymentStatus(res.data.payment_status))
        .catch(() => {});
    }
  }, [state]);

  if (!state) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '16px' }}>No booking information found.</p>
          <Link to="/" className="btn btn-primary">Go home</Link>
        </div>
      </div>
    );
  }

  const booking = state?.booking;
  const host = state?.host;
  const startDate = booking?.start_datetime ? new Date(booking.start_datetime) : null;
  const endDate = booking?.end_datetime ? new Date(booking.end_datetime) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
        <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </div>
        <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Caly</span>
      </div>

      <div className="card fade-in" style={{ maxWidth: '440px', width: '100%', padding: '40px 32px', textAlign: 'center' }}>
        {/* Success animation */}
        <div style={{ width: '64px', height: '64px', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '3px solid #A7F3D0' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
        </div>

        <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>You're scheduled!</h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: '0 0 24px' }}>A confirmation email has been sent to you.</p>

        {booking && (
          <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px', marginBottom: '20px', textAlign: 'left' }}>
            {[
              ['Event', booking.event_type_name],
              ['With', host],
              ['Date', startDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
              ['Time', startDate?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })],
            ].filter(([_, v]) => v).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
            {paymentStatus && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Payment</span>
                <span className={`badge ${paymentStatus === 'paid' ? 'badge-green' : paymentStatus === 'refunded' ? 'badge-orange' : 'badge-gray'}`}>{paymentStatus}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {startDate && endDate && (
            <a href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking?.event_type_name || 'Meeting')}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`}
              target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Add to Google Calendar
            </a>
          )}
          <Link to={`/book/${host}`} className="btn btn-ghost" style={{ justifyContent: 'center' }}>Book another time</Link>
        </div>
      </div>
    </div>
  );
}

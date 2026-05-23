import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookings, payments } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatDateTimeUTC, resolveTimezone } from '../utils/datetime';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const STATUS_COLORS = {
  confirmed: { bg: '#ECFDF5', text: '#065F46' },
  pending: { bg: '#FEF3C7', text: '#92400E' },
  cancelled: { bg: '#FEF2F2', text: '#991B1B' },
  completed: { bg: '#EFF6FF', text: '#1E40AF' },
  no_show: { bg: '#F5F5F4', text: '#78716C' },
};

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ show: false, reason: '' });
  const [refundModal, setRefundModal] = useState({ show: false });

  useEffect(() => {
    bookings.getBookingDetail(id).then((res) => setBooking(res.data)).catch(() => {
      toast('Booking not found', 'error');
      navigate('/dashboard');
    }).finally(() => setLoading(false));
  }, [id]);

  const handleComplete = async () => {
    try {
      await bookings.updateBookingStatus(id, { status: 'completed' });
      setBooking((b) => ({ ...b, status: 'completed' }));
      toast('Marked as completed', 'success');
    } catch { toast('Failed to update status', 'error'); }
  };

  const handleNoShow = async () => {
    try {
      await bookings.updateBookingStatus(id, { status: 'no_show' });
      setBooking((b) => ({ ...b, status: 'no_show' }));
      toast('Marked as no-show', 'success');
    } catch { toast('Failed to update status', 'error'); }
  };

  const handleCancel = async () => {
    try {
      await bookings.hostCancelBooking(id, { reason: cancelModal.reason });
      setBooking((b) => ({ ...b, status: 'cancelled' }));
      toast('Booking cancelled', 'info');
    } catch { toast('Failed to cancel booking', 'error'); }
    setCancelModal({ show: false, reason: '' });
  };

  const handleRefund = async () => {
    try {
      await payments.refundBooking(id);
      setBooking((b) => ({ ...b, status: 'cancelled', payment_status: 'refunded' }));
      toast('Refund processed', 'success');
    } catch { toast('Failed to process refund', 'error'); }
    setRefundModal({ show: false });
  };

  const sc = booking ? STATUS_COLORS[booking.status] || { bg: '#F5F5F4', text: '#78716C' } : {};

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }} className="sidebar-main">
          <div className="page-content" style={{ maxWidth: '820px' }}>
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ width: '100%', height: '20px', marginBottom: '12px', borderRadius: '6px' }} />)}
          </div>
        </main>
      </div>
    );
  }

  if (!booking) return null;

  const tz = resolveTimezone(user?.timezone);
  const dt = booking.start_datetime;
  const dateStr = new Date(dt).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const dur = booking.event_type_price ? '' : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }} className="sidebar-main">
        <div className="page-content" style={{ maxWidth: '820px' }}>
          {/* Back link */}
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', marginBottom: '20px', fontWeight: 500 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Dashboard
          </Link>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '22px', color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{booking.event_type_name}</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>{dateStr} &middot; {timeStr}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: sc.bg, color: sc.text }}>{booking.status.replace('_', ' ')}</span>
              {booking.payment_status && booking.payment_status !== 'unpaid' && (
                <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: booking.payment_status === 'paid' ? '#ECFDF5' : '#FEF2F2', color: booking.payment_status === 'paid' ? '#065F46' : '#991B1B' }}>{booking.payment_status}</span>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px', alignItems: 'start' }}>
            {/* Main content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Client info */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Client</h2>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{booking.invitee_name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{booking.invitee_email}</div>
                      </div>
                      <a href={`mailto:${booking.invitee_email}?subject=Regarding%20your%20booking%20with%20${user?.username || 'Caly'}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '8px', background: 'var(--surface-3)', color: 'var(--accent)', fontSize: '13px', fontWeight: 600, textDecoration: 'none', border: '1px solid var(--border)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Email client
                      </a>
                    </div>
                    {booking.invitee_timezone && (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Timezone: <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{booking.invitee_timezone}</span>
                      </div>
                    )}
                    {booking.notes && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes from client</div>
                        <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{booking.notes}</p>
                      </div>
                    )}
                    {booking.custom_answers && Object.keys(booking.custom_answers).length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Custom answers</div>
                        {Object.entries(booking.custom_answers).map(([q, a]) => (
                          <div key={q} style={{ marginBottom: '8px' }}>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '2px' }}>{q}</div>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{a}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Meeting details */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Meeting</h2>
                </div>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Date</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{dateStr}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Time</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{timeStr}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</div>
                      <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: sc.bg, color: sc.text }}>{booking.status.replace('_', ' ')}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payment</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {booking.event_type_price ? `\u20B9${booking.event_type_price}` : 'Free'}
                        {booking.payment_status !== 'unpaid' && <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '6px' }}>({booking.payment_status})</span>}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{booking.event_type_name ? '' : ''} 30 min</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Booked</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{new Date(booking.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions sidebar */}
            <div className="card" style={{ overflow: 'hidden', position: 'sticky', top: '20px' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Actions</h2>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {booking.status === 'confirmed' && (
                  <>
                    <button onClick={handleComplete} className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', fontSize: '13px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M20 6L9 17l-5-5"/></svg>
                      Mark completed
                    </button>
                    <button onClick={handleNoShow} className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', fontSize: '13px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>
                      Mark no-show
                    </button>
                    {booking.payment_status === 'paid' && (
                      <button onClick={() => setRefundModal({ show: true })} className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', fontSize: '13px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                        Refund
                      </button>
                    )}
                    <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                    <button onClick={() => setCancelModal({ show: true, reason: '' })} className="btn btn-danger btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '13px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                      Cancel booking
                    </button>
                  </>
                )}
                {booking.reschedule_url && (
                  <a href={booking.reschedule_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '13px', textDecoration: 'none' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Share reschedule link with client
                  </a>
                )}
                <a href={`mailto:${booking.invitee_email}?subject=Regarding%20your%20booking%20with%20${user?.username || 'Caly'}`} className="btn btn-sm" style={{ width: '100%', justifyContent: 'center', background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '13px', textDecoration: 'none' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Email client
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {cancelModal.show && (
        <ConfirmModal
          title="Cancel this booking?"
          confirmLabel="Cancel booking"
          onConfirm={handleCancel}
          onCancel={() => setCancelModal({ show: false, reason: '' })}
          variant="danger"
        >
          <input type="text" value={cancelModal.reason} onChange={(e) => setCancelModal((m) => ({ ...m, reason: e.target.value }))} placeholder="Reason for cancellation (optional)" className="field" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginTop: '8px' }} />
        </ConfirmModal>
      )}
      {refundModal.show && (
        <ConfirmModal
          title="Refund this booking?"
          confirmLabel="Process refund"
          onConfirm={handleRefund}
          onCancel={() => setRefundModal({ show: false })}
          variant="danger"
        >
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '8px 0 0' }}>This will cancel the booking and issue a full refund.</p>
        </ConfirmModal>
      )}
    </div>
  );
}

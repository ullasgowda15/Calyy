import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookings, payments } from '../api/client';
import { formatTimeLocal, formatDateLocal, resolveTimezone } from '../utils/datetime';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const STATUS_STYLES = {
  confirmed: { bg: '#ECFDF5', text: '#065F46', label: 'Confirmed' },
  pending: { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  cancelled: { bg: '#FEF2F2', text: '#991B1B', label: 'Cancelled' },
  completed: { bg: '#EFF6FF', text: '#1E40AF', label: 'Completed' },
  no_show: { bg: '#F5F5F4', text: '#78716C', label: 'No-show' },
};

function DetailRow({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{children}</div>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '15px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '3px', height: '16px', borderRadius: '2px', background: 'var(--accent)', opacity: 0.5 }} />
        <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </div>
  );
}

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ show: false, reason: '' });
  const isMeetingOver = booking?.start_datetime
    ? Date.now() > new Date(booking.start_datetime).getTime() + (booking.event_type_duration || 0) * 60 * 1000
    : false;
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }} className="sidebar-main">
          <div className="page-content" style={{ maxWidth: '820px' }}>
            <div className="skeleton" style={{ width: '140px', height: '16px', marginBottom: '20px', borderRadius: '6px' }} />
            <div className="skeleton" style={{ width: '300px', height: '28px', marginBottom: '4px', borderRadius: '8px' }} />
            <div className="skeleton" style={{ width: '200px', height: '16px', marginBottom: '24px', borderRadius: '6px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
              <div><div className="skeleton" style={{ width: '100%', height: '200px', borderRadius: '12px' }} /></div>
              <div><div className="skeleton" style={{ width: '100%', height: '260px', borderRadius: '12px' }} /></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!booking) return null;

  const sc = STATUS_STYLES[booking.status] || { bg: '#F5F5F4', text: '#78716C', label: booking.status };
  const dateStr = formatDateLocal(booking.start_datetime, resolveTimezone());
  const timeStr = formatTimeLocal(booking.start_datetime, resolveTimezone());
  const initials = booking.invitee_name.split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2) || '?';
  const duration = booking.event_type_duration || Math.round((new Date(booking.end_datetime) - new Date(booking.start_datetime)) / 60000);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }} className="sidebar-main">
        <div className="page-content" style={{ maxWidth: '820px' }}>
          {/* Back link */}
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent)', textDecoration: 'none', marginBottom: '24px', fontWeight: 500, transition: 'opacity 0.15s' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back to Dashboard
          </Link>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{booking.event_type_name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{dateStr}</span>
                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{timeStr}</span>
                <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{duration} min</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: sc.bg, color: sc.text }}>{sc.label}</span>
              {booking.payment_status && booking.payment_status !== 'unpaid' && (
                <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: booking.payment_status === 'paid' ? '#ECFDF5' : '#FEF2F2', color: booking.payment_status === 'paid' ? '#065F46' : '#991B1B' }}>
                  {booking.payment_status}
                </span>
              )}
            </div>
          </div>

          <div className="booking-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '22px', alignItems: 'start' }}>
            {/* Main column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Client */}
              <SectionCard title="Client">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), #7C3AED)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    fontSize: '18px', fontWeight: 700, color: '#fff',
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{booking.invitee_name}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', wordBreak: 'break-all' }}>{booking.invitee_email}</div>
                      </div>
                      <a href={`mailto:${booking.invitee_email}?subject=Regarding%20your%20booking%20with%20${booking.invitee_name}`}
                        className="btn btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', flexShrink: 0, background: 'var(--surface-3)', color: 'var(--accent)', border: '1px solid var(--border)', fontSize: '12px', textDecoration: 'none' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Email
                      </a>
                    </div>
                    {booking.invitee_timezone && (
                      <div style={{ marginTop: '14px', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', background: 'var(--surface-3)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        {booking.invitee_timezone}
                      </div>
                    )}
                  </div>
                </div>
                {booking.notes && (
                  <div style={{ marginTop: '18px', padding: '14px 16px', background: 'var(--surface-3)', borderRadius: '10px', borderLeft: '3px solid var(--accent)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Notes from client</div>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{booking.notes}</p>
                  </div>
                )}
                {booking.custom_answers && Object.keys(booking.custom_answers).length > 0 && (
                  <div style={{ marginTop: '18px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custom answers</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {Object.entries(booking.custom_answers).map(([q, a]) => (
                        <div key={q} style={{ padding: '10px 14px', background: 'var(--surface-3)', borderRadius: '8px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '2px' }}>{q}</div>
                          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{a}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Meeting */}
              <SectionCard title="Meeting">
                <div className="booking-detail-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <DetailRow label="Date">{dateStr}</DetailRow>
                  <DetailRow label="Time">{timeStr}</DetailRow>
                  <DetailRow label="Duration">{duration} minutes</DetailRow>
                  <DetailRow label="Status">
                    <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600, background: sc.bg, color: sc.text }}>{sc.label}</span>
                  </DetailRow>
                  <DetailRow label="Payment">
                    {booking.event_type_price ? `\u20B9${booking.event_type_price}` : 'Free'}
                    {booking.payment_status !== 'unpaid' && (
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 400, marginLeft: '6px', fontSize: '12px' }}>({booking.payment_status})</span>
                    )}
                  </DetailRow>
                  <DetailRow label="Booked on">{new Date(booking.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</DetailRow>
                </div>
              </SectionCard>
            </div>

            {/* Actions sidebar */}
            <div className="card" style={{ overflow: 'hidden', position: 'sticky', top: '20px' }}>
              <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>Actions</span>
              </div>
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {booking.status === 'confirmed' && (
                  <>
                    {isMeetingOver && (
                      <>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>Status update</div>
                        <button onClick={handleComplete} className="btn btn-sm" style={{ width: '100%', justifyContent: 'flex-start', gap: '8px', background: 'var(--surface-2)', color: '#065F46', border: '1px solid var(--border)', fontSize: '12px', padding: '8px 12px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                          Mark completed
                        </button>
                        <button onClick={handleNoShow} className="btn btn-sm" style={{ width: '100%', justifyContent: 'flex-start', gap: '8px', background: 'var(--surface-2)', color: '#92400E', border: '1px solid var(--border)', fontSize: '12px', padding: '8px 12px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>
                          Mark no-show
                        </button>
                      </>
                    )}
                    {booking.payment_status === 'paid' && (
                      <>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '6px', marginBottom: '2px' }}>Payment</div>
                        <button onClick={() => setRefundModal({ show: true })} className="btn btn-sm" style={{ width: '100%', justifyContent: 'flex-start', gap: '8px', background: 'var(--surface-2)', color: '#1E40AF', border: '1px solid var(--border)', fontSize: '12px', padding: '8px 12px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                          Refund
                        </button>
                      </>
                    )}
                    {!isMeetingOver && (
                      <>
                        <div style={{ height: '1px', background: 'var(--border)', margin: '6px 0' }} />
                        <button onClick={() => setCancelModal({ show: true, reason: '' })} className="btn btn-sm" style={{ width: '100%', justifyContent: 'flex-start', gap: '8px', background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', fontSize: '12px', padding: '8px 12px' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                          Cancel booking
                        </button>
                      </>
                    )}
                  </>
                )}
                {booking.status !== 'confirmed' && booking.status !== 'cancelled' && (
                  <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                    No actions available for {sc.label.toLocaleLowerCase()} bookings.
                  </div>
                )}
                {booking.status === 'cancelled' && (
                  <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                    This booking has been cancelled.
                  </div>
                )}
              </div>
              {booking.status === 'confirmed' && !isMeetingOver && (
                <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Share</div>
                  {booking.reschedule_url && (
                    <a href={booking.reschedule_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      Reschedule link
                    </a>
                  )}
                  <a href={`mailto:${booking.invitee_email}?subject=Regarding%20your%20booking%20with%20${booking.invitee_name}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Email client
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {cancelModal.show && (
        <ConfirmModal
          show
          title="Cancel this booking?"
          message={cancelModal.reason ? '' : ''}
          confirmLabel="Cancel booking"
          confirmDanger
          onConfirm={handleCancel}
          onCancel={() => setCancelModal({ show: false, reason: '' })}
        >
          <input type="text" value={cancelModal.reason} onChange={(e) => setCancelModal((m) => ({ ...m, reason: e.target.value }))} placeholder="Reason for cancellation (optional)" className="field" style={{ width: '100%', padding: '9px 12px', fontSize: '13px', marginTop: '8px' }} />
        </ConfirmModal>
      )}
      {refundModal.show && (
        <ConfirmModal
          show
          title="Refund this booking?"
          message="This will cancel the booking and issue a full refund."
          confirmLabel="Process refund"
          confirmDanger
          onConfirm={handleRefund}
          onCancel={() => setRefundModal({ show: false })}
        />
      )}
    </div>
  );
}

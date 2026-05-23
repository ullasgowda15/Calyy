import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { bookings, eventTypes } from '../api/client';
import { formatTimeLocal } from '../utils/datetime';

export default function ReschedulePage() {
  const { rescheduleToken } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [newDate, setNewDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);

  useEffect(() => {
    if (!rescheduleToken) { setStatus('error'); setError('Invalid reschedule link.'); return; }
    bookings.getRescheduleInfo(rescheduleToken).then((res) => {
      setBooking(res.data);
      setStatus('ready');
    }).catch(() => {
      setStatus('error');
      setError('This reschedule link is invalid or has expired.');
    });
  }, [rescheduleToken]);

  const handleDateChange = (e) => {
    const dateStr = e.target.value;
    setNewDate(dateStr);
    setSelectedSlot(null);
    if (!dateStr || !booking) return;
    setLoadingSlots(true);
    eventTypes.getSlots(booking.host_username, booking.event_type_id, dateStr)
      .then((res) => setSlots(res.data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setRescheduling(true);
    setError('');
    try {
      await bookings.rescheduleBookingByToken(rescheduleToken, { start_datetime: selectedSlot.start });
      setStatus('done');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reschedule. The slot may no longer be available.');
    } finally { setRescheduling(false); }
  };

  const today = new Date().toISOString().split('T')[0];
  const currentDt = booking?.current_start ? new Date(booking.current_start) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: '520px' }}>
          {/* Loading */}
          {status === 'loading' && (
            <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '40px' }}>
              <div className="skeleton" style={{ width: '200px', height: '24px', margin: '0 auto 12px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ width: '140px', height: '14px', margin: '0 auto 32px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ width: '100%', height: '44px', borderRadius: '10px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
                {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />)}
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid #FECACA', padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', background: '#FEF2F2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
              </div>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 6px' }}>Link invalid or expired</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>{error}</p>
              <button onClick={() => navigate('/')} className="btn btn-primary btn-sm">Go home</button>
            </div>
          )}

          {/* Success */}
          {status === 'done' && (
            <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid #A7F3D0', padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '20px', color: '#065F46', margin: '0 0 6px' }}>Booking rescheduled!</h2>
              <p style={{ fontSize: '14px', color: '#047857', margin: '0 0 24px' }}>A new confirmation email has been sent.</p>
              <button onClick={() => navigate('/')} className="btn btn-primary btn-sm">Go home</button>
            </div>
          )}

          {/* Reschedule form */}
          {status === 'ready' && booking && (
            <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {/* Current booking summary */}
              <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <div style={{ width: '4px', height: '24px', borderRadius: '2px', background: 'var(--accent)' }} />
                  <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '20px', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.01em' }}>Reschedule</h1>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 0 16px' }}>{booking.event_type_name}</p>
              </div>

              {currentDt && (
                <div style={{ padding: '16px 28px', background: 'var(--surface-3)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Currently: <strong style={{ color: 'var(--text-primary)' }}>{currentDt.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong> at{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{currentDt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</strong>
                  </span>
                </div>
              )}

              <div style={{ padding: '24px 28px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 22px' }}>Select a new date and time, then confirm.</p>

                <div style={{ marginBottom: '22px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>New date</label>
                  <input type="date" value={newDate} onChange={handleDateChange} min={today} className="field" style={{ width: '100%', padding: '11px 14px', fontSize: '14px', boxSizing: 'border-box', borderRadius: '10px' }} />
                </div>

                {loadingSlots && (
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available times</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '42px', borderRadius: '8px' }} />)}
                    </div>
                  </div>
                )}

                {!loadingSlots && newDate && slots.length === 0 && (
                  <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--surface-3)', borderRadius: '10px', marginBottom: '22px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px' }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                    <div>No available slots for this date.</div>
                  </div>
                )}

                {!loadingSlots && slots.length > 0 && (
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available times</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {slots.map((slot, idx) => (
                        <button key={idx} onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: '10px', border: `1.5px solid ${selectedSlot?.start === slot.start ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                            background: selectedSlot?.start === slot.start ? 'var(--accent)' : 'var(--surface)',
                            color: selectedSlot?.start === slot.start ? '#fff' : 'var(--text-primary)',
                            transition: 'all 0.12s',
                          }}
                        >
                          {formatTimeLocal(slot.start, booking.invitee_timezone)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!newDate && (
                  <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--surface-3)', borderRadius: '10px', marginBottom: '22px' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '8px' }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    <div>Select a date to see available times.</div>
                  </div>
                )}

                {error && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#991B1B' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                    {error}
                  </div>
                )}

                <button onClick={handleReschedule} disabled={!selectedSlot || rescheduling}
                  className="btn btn-primary"
                  style={{
                    width: '100%', padding: '12px', fontSize: '15px', justifyContent: 'center', borderRadius: '10px',
                    opacity: !selectedSlot || rescheduling ? 0.5 : 1,
                    cursor: !selectedSlot || rescheduling ? 'not-allowed' : 'pointer',
                  }}
                >
                  {rescheduling ? (
                    <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Rescheduling&hellip;</>
                  ) : 'Confirm new time'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

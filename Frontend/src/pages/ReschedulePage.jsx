import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { bookings, eventTypes } from '../api/client';
import { formatTimeLocal } from '../utils/datetime';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function ReschedulePage() {
  const { rescheduleToken } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);

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

  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m, y) => new Date(y, m, 1).getDay();

  const changeMonth = (delta) => {
    let m = currentMonth + delta, y = currentYear;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setCurrentMonth(m); setCurrentYear(y); setSelectedDate(null); setSelectedSlot(null); setSlots([]);
  };

  const selectDate = async (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    if (!booking) return;
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

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);
  const currentDt = booking?.current_start ? new Date(booking.current_start) : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: '720px' }}>
          {/* Loading */}
          {status === 'loading' && (
            <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '40px' }}>
              <div className="skeleton" style={{ width: '200px', height: '24px', margin: '0 auto 12px', borderRadius: '6px' }} />
              <div className="skeleton" style={{ width: '140px', height: '14px', margin: '0 auto 32px', borderRadius: '6px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="skeleton" style={{ height: '260px', borderRadius: '12px' }} />
                <div><div className="skeleton" style={{ height: '44px', borderRadius: '8px', marginBottom: '12px' }} />{Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '8px', marginBottom: '8px' }} />)}</div>
              </div>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-error)', padding: '40px 32px', textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', background: 'var(--surface-error)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
              </div>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 6px' }}>Link invalid or expired</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>{error}</p>
              <button onClick={() => navigate('/')} className="btn btn-primary btn-sm">Go home</button>
            </div>
          )}

          {/* Success */}
          {status === 'done' && (
            <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border-success)', padding: '48px 32px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--surface-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '20px', color: 'var(--text-success)', margin: '0 0 6px' }}>Booking rescheduled!</h2>
              <p style={{ fontSize: '14px', color: 'var(--success)', margin: '0 0 24px' }}>A new confirmation email has been sent.</p>
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
                <div style={{ padding: '14px 28px', background: 'var(--surface-3)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Currently: <strong style={{ color: 'var(--text-primary)' }}>{currentDt.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</strong> at{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>{currentDt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</strong>
                  </span>
                </div>
              )}

              <div style={{ padding: '24px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>Select a new date and time, then confirm.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="booking-bottom">
                  {/* Calendar */}
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <button onClick={() => changeMonth(-1)} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--surface-3)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                      </button>
                      <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{MONTHS[currentMonth]} {currentYear}</span>
                      <button onClick={() => changeMonth(1)} style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--surface-3)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center', marginBottom: '6px' }}>
                      {DAYS_SHORT.map((d) => <div key={d} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0', textTransform: 'uppercase' }}>{d}</div>)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const d = new Date(currentYear, currentMonth, day);
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const isSelected = selectedDate === dateStr;
                        const isToday = dateStr === todayStr;
                        return (
                          <button key={day} onClick={() => !isPast && selectDate(day)} disabled={isPast} style={{
                            padding: '7px 2px', borderRadius: '8px', fontSize: '13px', fontWeight: isToday ? 700 : 400, border: isToday && !isSelected ? '1.5px solid var(--accent)' : 'none',
                            cursor: isPast ? 'not-allowed' : 'pointer', transition: 'all 0.1s',
                            background: isSelected ? 'var(--accent)' : 'transparent',
                            color: isPast ? 'var(--text-muted)' : isSelected ? '#fff' : 'var(--text-primary)',
                            opacity: isPast ? 0.4 : 1,
                          }}
                            onMouseEnter={(e) => { if (!isPast && !isSelected) e.currentTarget.style.background = 'var(--surface-3)'; }}
                            onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                          >{day}</button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slots + Confirm */}
                  <div>
                    {!selectedDate ? (
                      <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                        <div style={{ padding: '32px 0', color: 'var(--text-muted)' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                          <p style={{ fontSize: '14px', margin: 0 }}>Select a date to see available times</p>
                        </div>
                      </div>
                    ) : loadingSlots ? (
                      <div className="card" style={{ padding: '20px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Loading times&hellip;</div>
                        {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '8px', marginBottom: '8px' }} />)}
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
                        <div style={{ padding: '32px 0', color: 'var(--text-muted)' }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                          <p style={{ fontSize: '14px', margin: '0 0 4px' }}>No available slots</p>
                        </div>
                      </div>
                    ) : (
                      <div className="card" style={{ padding: '20px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Available times</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                          {slots.map((slot, idx) => {
                            const isSelected = selectedSlot?.start === slot.start;
                            return (
                            <button key={idx} onClick={() => setSelectedSlot(slot)} style={{
                              padding: '10px', border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                              background: isSelected ? 'var(--accent)' : 'var(--surface)', color: isSelected ? '#fff' : 'var(--text-primary)', transition: 'all 0.15s',
                            }}
                              onMouseEnter={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; }}}
                              onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface)'; }}}
                            >
                              {formatTimeLocal(slot.start, booking.invitee_timezone)}
                            </button>
                            );
                          })}
                        </div>

                        {error && (
                          <div style={{ background: 'var(--surface-error)', border: '1px solid var(--border-error)', borderRadius: '8px', padding: '10px 12px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-error)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                            {error}
                          </div>
                        )}

                        <button onClick={handleReschedule} disabled={!selectedSlot || rescheduling}
                          className="btn btn-primary"
                          style={{
                            width: '100%', padding: '11px', fontSize: '14px', justifyContent: 'center', borderRadius: '8px',
                            opacity: !selectedSlot || rescheduling ? 0.5 : 1,
                            cursor: !selectedSlot || rescheduling ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {rescheduling ? (
                            <><svg className="spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Rescheduling&hellip;</>
                          ) : selectedSlot ? 'Confirm new time' : 'Select a time'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

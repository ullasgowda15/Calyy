import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventTypes, bookings, payments } from '../api/client';
import RazorpayPayment from '../components/RazorpayPayment';
import { formatTimeLocal, getUserTimezone } from '../utils/datetime';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const TIMEZONES = ['UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo','Asia/Kolkata','Australia/Sydney'];

export default function BookingPage() {
  const { username, slug } = useParams();
  const navigate = useNavigate();
  const [hostEvents, setHostEvents] = useState([]);
  const [hostProfile, setHostProfile] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [form, setForm] = useState({ invitee_name: '', invitee_email: '', invitee_timezone: getUserTimezone(), notes: '', custom_answers: {} });
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    eventTypes.getPublicEventTypes(username).then((res) => {
      setHostEvents(res.data);
      if (res.data.length > 0) {
        const ev = res.data[0];
        setHostProfile({ username: ev.host_username, avatar: ev.host_avatar, bio: ev.host_bio, first_name: ev.host_first_name });
      }
    }).catch(() => setHostEvents([]));
  }, [username]);

  useEffect(() => {
    if (slug && hostEvents.length > 0) {
      const found = hostEvents.find((e) => e.slug === slug);
      if (found) selectEventType(found);
    }
  }, [slug, hostEvents]);

  const selectEventType = (ev) => {
    setSelectedEvent(ev);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
    setShowForm(false);
  };

  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m, y) => new Date(y, m, 1).getDay();

  const changeMonth = (delta) => {
    let m = currentMonth + delta, y = currentYear;
    if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
    setCurrentMonth(m); setCurrentYear(y); setSelectedDate(null); setSlots([]); setSelectedSlot(null); setShowForm(false);
  };

  const selectDate = async (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr); setSelectedSlot(null); setShowForm(false); setLoadingSlots(true); setError('');
    try {
      const res = await eventTypes.getSlots(username, selectedEvent.id, dateStr);
      setSlots(res.data.slots || []);
    } catch { setSlots([]); } finally { setLoadingSlots(false); }
  };

  const selectSlot = (slot) => {
    setSelectedSlot(slot);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try {
      const data = { event_type_id: selectedEvent.id, ...form, start_datetime: selectedSlot.start };
      const res = await bookings.createBooking(data);
      if (res.data.requires_payment) { setBookingId(res.data.booking_id); setShowForm(false); }
      else navigate('/booking-confirmed', { state: { booking: res.data, eventType: selectedEvent, host: username } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking failed. This slot may no longer be available.');
    } finally { setSubmitting(false); }
  };

  const handlePaymentSuccess = (booking) => navigate('/booking-confirmed', { state: { booking, paid: true, eventType: selectedEvent, host: username } });
  const handlePaymentCancel = async () => {
    if (bookingId) { try { await payments.cancelPendingBooking({ booking_id: bookingId }); } catch {} }
    setBookingId(null); setShowForm(false);
  };

  const today = new Date();
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);

  if (!hostEvents.length) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <svg className="spin" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        </div>
      </div>
    );
  }

  if (bookingId && selectedEvent) {
    const bookingData = { event_type_id: selectedEvent.id, ...form, start_datetime: selectedSlot.start };
    return (
      <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <RazorpayPayment eventTypeId={selectedEvent.id} bookingId={bookingId} bookingData={bookingData} price={selectedEvent.price} currency={selectedEvent.currency} onSuccess={handlePaymentSuccess} onCancel={handlePaymentCancel} onError={(msg) => setError(msg)} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      {/* Top bar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '26px', height: '26px', background: 'var(--accent)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </div>
        <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Caly</span>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Top section: left = profile, right = events */}
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', marginBottom: '24px' }} className="booking-top">
          {/* Left: Profile */}
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Cover area */}
            <div style={{ height: '80px', background: 'linear-gradient(135deg, var(--accent) 0%, #6366F1 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />
            </div>
            {/* Profile content */}
            <div style={{ padding: '0 24px 24px', marginTop: '-40px', position: 'relative' }}>
              {hostProfile?.avatar ? (
                <img src={hostProfile.avatar} alt={username} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--surface)', boxShadow: 'var(--shadow-md)', display: 'block' }} />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '28px', fontWeight: 700, border: '4px solid var(--surface)', boxShadow: 'var(--shadow-md)', display: 'block' }}>
                  {username[0].toUpperCase()}
                </div>
              )}
              <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '20px', color: 'var(--text-primary)', margin: '12px 0 4px', letterSpacing: '-0.02em' }}>{hostProfile?.first_name || username}</h1>
              {hostProfile?.bio && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.6 }}>{hostProfile.bio}</p>}
              
              {selectedEvent && (
                <div style={{ padding: '14px', background: 'var(--surface-2)', borderRadius: '12px', border: '1.5px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: (selectedEvent.color || 'var(--accent)') + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: selectedEvent.color || 'var(--accent)' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '2px' }}>{selectedEvent.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedEvent.duration} min · {selectedEvent.location_type.replace('_', ' ')}</div>
                    </div>
                    {selectedEvent.price && (
                      <div style={{ fontSize: '15px', fontWeight: 700, color: '#10B981' }}>₹{selectedEvent.price}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Events list */}
          <div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 14px' }}>Select an event</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {hostEvents.map((ev) => (
                <button key={ev.id} onClick={() => selectEventType(ev)} className="card fade-in" style={{
                  padding: '16px 18px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
                  border: selectedEvent?.id === ev.id ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                  background: selectedEvent?.id === ev.id ? 'var(--accent-light)' : 'var(--surface)',
                  transition: 'all 0.15s', width: '100%',
                }}
                  onMouseEnter={(e) => { if (selectedEvent?.id !== ev.id) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; } }}
                  onMouseLeave={(e) => { if (selectedEvent?.id !== ev.id) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; } }}
                >
                  <div style={{ width: '6px', height: '40px', borderRadius: '99px', background: ev.color || 'var(--accent)', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '3px' }}>{ev.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{ev.duration} min</span>
                      <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                      <span>{ev.location_type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {ev.price && <span style={{ fontSize: '15px', fontWeight: 700, color: '#10B981' }}>₹{ev.price}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom section: Calendar + Slots + Form */}
        {selectedEvent && (
          <div>
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
                    const isToday = dateStr === today.toISOString().split('T')[0];
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

              {/* Slots or Form */}
              <div>
                {!showForm ? (
                  <div className="card" style={{ padding: '20px' }}>
                    {!selectedDate ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        <p style={{ fontSize: '14px', margin: 0 }}>Select a date to see available times</p>
                      </div>
                    ) : loadingSlots ? (
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>Loading times…</div>
                        {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '8px', marginBottom: '8px' }} />)}
                      </div>
                    ) : slots.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: '14px', margin: 0 }}>No available slots for this date.</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Available times</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {slots.map((slot, idx) => (
                            <button key={idx} onClick={() => selectSlot(slot)} style={{
                              padding: '10px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'var(--surface)', color: 'var(--text-primary)', transition: 'all 0.15s',
                            }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--surface)'; }}
                            >
                              {formatTimeLocal(slot.start, form.invitee_timezone)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>Your details</h3>
                      <button onClick={() => setShowForm(false)} style={{ fontSize: '13px', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>← Change time</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--accent-light)', color: 'var(--accent)', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                      {formatTimeLocal(selectedSlot.start, form.invitee_timezone)}
                    </div>
                    <form onSubmit={handleSubmit}>
                      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '11px 14px', marginBottom: '14px', fontSize: '13px', color: '#991B1B' }}>{error}</div>}
                      {[['invitee_name','Name','text','Jane Smith'],['invitee_email','Email','email','you@example.com']].map(([name, label, type, ph]) => (
                        <div key={name} style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>{label}</label>
                          <input type={type} name={name} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} required className="field" placeholder={ph} />
                        </div>
                      ))}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>Timezone</label>
                        <select name="invitee_timezone" value={form.invitee_timezone} onChange={(e) => setForm({ ...form, invitee_timezone: e.target.value })} className="field">
                          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>Notes <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                        <textarea name="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="field" style={{ resize: 'vertical' }} />
                      </div>
                      {selectedEvent.custom_questions?.map((q, i) => (
                        <div key={i} style={{ marginBottom: '12px' }}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>{q.label}{q.required && <span style={{ color: '#EF4444' }}> *</span>}</label>
                          {q.type === 'select' ? (
                            <select onChange={(e) => setForm({ ...form, custom_answers: { ...form.custom_answers, [q.label]: e.target.value } })} required={q.required} className="field">
                              <option value="">Select…</option>
                            </select>
                          ) : (
                            <input type="text" onChange={(e) => setForm({ ...form, custom_answers: { ...form.custom_answers, [q.label]: e.target.value } })} required={q.required} className="field" />
                          )}
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                        <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm">← Back</button>
                        <button type="submit" disabled={submitting} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                          {submitting ? <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Booking…</>
                          : selectedEvent.price ? `Proceed to payment · ₹${selectedEvent.price}` : 'Confirm booking'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@media (max-width: 768px) { .booking-top { grid-template-columns: 1fr !important; } .booking-bottom { grid-template-columns: 1fr !important; } }' }} />
    </div>
  );
}

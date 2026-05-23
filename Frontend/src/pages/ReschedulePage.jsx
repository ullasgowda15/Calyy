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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar />
      <div style={{ maxWidth: '540px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)', marginBottom: '4px' }}>Reschedule Booking</h1>
        {booking && (
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 24px' }}>
            {booking.event_type_name} &middot; {booking.invitee_name}
          </p>
        )}

        {status === 'loading' && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}

        {status === 'error' && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#991B1B' }}>{error}</div>
        )}

        {status === 'done' && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>&#10003;</div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#065F46', margin: '0 0 6px' }}>Booking rescheduled!</h2>
            <p style={{ fontSize: '13px', color: '#047857', margin: 0 }}>A new confirmation has been sent to your email.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>Go home</button>
          </div>
        )}

        {status === 'ready' && booking && (
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Pick a new date and time for your booking.</p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>New date</label>
              <input type="date" value={newDate} onChange={handleDateChange} min={today} className="field" style={{ width: '100%', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            {loadingSlots && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '8px' }} />)}
              </div>
            )}

            {!loadingSlots && newDate && slots.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', background: 'var(--surface-3)', borderRadius: '10px' }}>
                No available slots for this date.
              </div>
            )}

            {!loadingSlots && slots.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Available times</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {slots.map((slot, idx) => (
                    <button key={idx} onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '10px', border: `1.5px solid ${selectedSlot?.start === slot.start ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                        background: selectedSlot?.start === slot.start ? 'var(--accent)' : 'var(--surface)',
                        color: selectedSlot?.start === slot.start ? '#fff' : 'var(--text-primary)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {formatTimeLocal(slot.start, booking.invitee_timezone)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#991B1B' }}>{error}</div>
            )}

            <button onClick={handleReschedule} disabled={!selectedSlot || rescheduling} className="btn btn-primary" style={{ width: '100%', padding: '11px', fontSize: '15px', justifyContent: 'center' }}>
              {rescheduling ? 'Rescheduling\u2026' : 'Confirm new time'}
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

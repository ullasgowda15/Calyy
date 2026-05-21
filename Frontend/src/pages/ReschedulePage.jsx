import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { bookings } from '../api/client';

export default function ReschedulePage() {
  const { rescheduleToken } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!rescheduleToken) { setStatus('error'); setError('Invalid reschedule link.'); }
    else setStatus('ready');
  }, [rescheduleToken]);

  const handleReschedule = async () => {
    if (!newDate || !newTime) { setError('Please select a date and time.'); return; }
    setError('');
    try {
      await bookings.rescheduleBookingByToken(rescheduleToken, { start_datetime: `${newDate}T${newTime}:00Z` });
      setStatus('done');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to reschedule. The slot may no longer be available.';
      setError(msg);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar />
      <div style={{ maxWidth: '500px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)', marginBottom: '16px' }}>Reschedule Booking</h1>
        {status === 'loading' && <p style={{ color: 'var(--text-muted)' }}>Loading...</p>}
        {status === 'error' && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#991B1B' }}>{error}</div>}
        {status === 'done' && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>&#10003;</div>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#065F46', margin: '0 0 6px' }}>Booking rescheduled!</h2>
            <p style={{ fontSize: '13px', color: '#047857', margin: 0 }}>A new confirmation has been sent to your email.</p>
            <button onClick={() => navigate('/')} className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>Go home</button>
          </div>
        )}
        {status === 'ready' && (
          <div>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px' }}>Select a new date and time for your booking.</p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>New date</label>
              <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="field" style={{ width: '100%', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>New time</label>
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="field" style={{ width: '100%', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#991B1B' }}>{error}</div>}
            <button onClick={handleReschedule} className="btn btn-primary" style={{ width: '100%', padding: '11px', fontSize: '15px', justifyContent: 'center' }}>Reschedule</button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

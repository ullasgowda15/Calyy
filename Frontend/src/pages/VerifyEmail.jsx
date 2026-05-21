import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { auth } from '../api/client';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!email) { setError('No email provided.'); return; }
    setLoading(true); setError(''); setMessage('');
    try {
      const res = await auth.verifyEmail({ email, otp });
      setMessage(res.data.message);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!email) return;
    setError(''); setMessage('');
    try {
      const res = await auth.resendOtp({ email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar />
      <div style={{ maxWidth: '420px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)', marginBottom: '8px' }}>Verify Your Email</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Enter the 6-digit code sent to {email || 'your email'}.</p>
        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#991B1B' }}>{error}</div>}
        {message && <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: '#065F46' }}>{message}</div>}
        {!message?.includes('successfully') ? (
          <form onSubmit={handleVerify}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Verification code</label>
              <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required className="field" placeholder="000000" style={{ width: '100%', padding: '10px 12px', fontSize: '20px', textAlign: 'center', letterSpacing: '8px', boxSizing: 'border-box' }} maxLength={6} />
            </div>
            <button type="submit" disabled={loading || otp.length !== 6} className="btn btn-primary" style={{ width: '100%', padding: '11px', fontSize: '15px', justifyContent: 'center' }}>
              {loading ? 'Verifying...' : 'Verify email'}
            </button>
          </form>
        ) : (
          <Link to="/dashboard" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', padding: '11px', fontSize: '15px' }}>Go to dashboard</Link>
        )}
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Didn't get the code?{' '}
          <button onClick={handleResend} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: '13px' }}>Resend</button>
        </p>
      </div>
      <Footer />
    </div>
  );
}

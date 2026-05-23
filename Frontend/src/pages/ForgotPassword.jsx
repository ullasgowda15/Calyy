import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../api/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    setLoading(true);
    try {
      await auth.passwordReset({ email });
      setMessage('If an account with that email exists, a reset link has been sent.');
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="auth-split" style={{ display: 'flex', maxWidth: '800px', width: '100%', gap: '0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
          {/* Left — info panel */}
          <div style={{ flex: '1 1 50%', background: 'var(--surface-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Forgot your password?</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 28px', lineHeight: 1.5, maxWidth: '260px' }}>Enter the email address associated with your account and we'll send you a link to reset it.</p>
            <svg width="120" height="80" viewBox="0 0 120 80" fill="none" style={{ opacity: 0.3 }}>
              <rect x="20" y="25" width="80" height="50" rx="6" stroke="var(--text-muted)" strokeWidth="2" fill="none"/>
              <path d="M20 35l40 25 40-25" stroke="var(--text-muted)" strokeWidth="2" fill="none"/>
              <path d="M40 25V15a20 20 0 0140 0v10" stroke="var(--text-muted)" strokeWidth="2" fill="none" strokeDasharray="4 3"/>
            </svg>
          </div>

          {/* Right — form */}
          <div style={{ flex: '1 1 50%', background: 'var(--surface)', padding: '48px 36px' }}>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '22px', color: 'var(--text-primary)', margin: '0 0 4px' }}>Reset password</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px' }}>We'll email you a recovery link</p>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <span style={{ fontSize: '13px', color: '#991B1B' }}>{error}</span>
              </div>
            )}
            {message && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span style={{ fontSize: '13px', color: '#065F46' }}>{message}</span>
              </div>
            )}
            {!message && (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Email address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="field" placeholder="you@example.com" />
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '11px', fontSize: '15px', justifyContent: 'center' }}>
                  {loading ? (
                    <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Sending…</>
                  ) : 'Send reset link'}
                </button>
              </form>
            )}
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Remember your password?{' '}
              <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@media (max-width: 700px) { .auth-split { flex-direction: column !important; } }' }} />
      <Footer />
    </div>
  );
}

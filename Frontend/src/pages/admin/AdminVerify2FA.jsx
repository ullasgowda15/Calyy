import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { admin } from '../../api/admin';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminVerify2FA() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setAdmin } = useAdminAuth();
  const userId = location.state?.userId;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const refs = useRef([]);

  if (!userId) {
    navigate('/adkrish/login');
    return null;
  }

  const handleChange = (i, val) => {
    if (val.length > 1) return;
    const next = [...code];
    next[i] = val;
    setCode(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'Enter') handleSubmit();
  };

  const handleSubmit = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await admin.verify2FA({ user_id: userId, code: fullCode });
      setAdmin(res.data.user, res.data.access, res.data.refresh);
      navigate('/adkrish');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
      setCode(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F11', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <img src="/YourCalyLogo.png" alt="YourCaly" style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', margin: '0 auto 16px' }} />
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '22px', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Two-Factor Auth</h1>
          <p style={{ fontSize: '13px', color: '#7F7F8C', margin: 0 }}>Enter the 6-digit code from your authenticator app</p>
        </div>
        <div style={{ background: '#1A1A1F', borderRadius: '12px', padding: '28px 24px', border: '1px solid #2A2A30' }}>
          {error && <div style={{ background: '#7F1D1D', border: '1px solid #991B1B', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#FCA5A5', textAlign: 'center' }}>{error}</div>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
            {code.map((digit, i) => (
              <input key={i} ref={(el) => (refs.current[i] = el)} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleChange(i, e.target.value)} onKeyDown={(e) => handleKeyDown(i, e)} style={{ width: '44px', height: '48px', textAlign: 'center', fontSize: '20px', fontWeight: 700, borderRadius: '8px', background: '#0F0F11', border: '1px solid #2A2A30', color: '#fff', outline: 'none', caretColor: '#3B82F6' }} autoFocus={i === 0} />
            ))}
          </div>
          <button onClick={handleSubmit} disabled={loading || code.join('').length !== 6} style={{ width: '100%', padding: '11px', borderRadius: '8px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading || code.join('').length !== 6 ? 0.6 : 1 }}>
            {loading ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin } from '../../api/admin';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAdmin } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await admin.login({ email, password });
      if (res.data.requires_2fa) {
        navigate('/adkrish/verify-2fa', { state: { userId: res.data.user_id } });
      } else {
        setAdmin(res.data.user, res.data.access, res.data.refresh);
        navigate('/adkrish');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F0F11', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 auto 16px' }}>C</div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '22px', color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Admin Login</h1>
          <p style={{ fontSize: '13px', color: '#7F7F8C', margin: 0 }}>Sign in to manage your platform</p>
        </div>
        <form onSubmit={handleSubmit} style={{ background: '#1A1A1F', borderRadius: '12px', padding: '24px', border: '1px solid #2A2A30' }}>
          {error && <div style={{ background: '#7F1D1D', border: '1px solid #991B1B', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#FCA5A5' }}>{error}</div>}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#A1A1AA', marginBottom: '6px' }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#0F0F11', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} placeholder="admin@example.com" />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#A1A1AA', marginBottom: '6px' }}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#0F0F11', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: '8px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

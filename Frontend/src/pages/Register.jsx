import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, integrations } from '../api/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ALL_TIMEZONES, getUserTimezone } from '../utils/datetime';

const BROWSER_TZ = getUserTimezone();

const COUNTRIES = [
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+91', label: 'IN +91' },
  { code: '+61', label: 'AU +61' },
  { code: '+81', label: 'JP +81' },
  { code: '+86', label: 'CN +86' },
  { code: '+49', label: 'DE +49' },
  { code: '+33', label: 'FR +33' },
  { code: '+39', label: 'IT +39' },
  { code: '+55', label: 'BR +55' },
  { code: '+7', label: 'RU +7' },
  { code: '+82', label: 'KR +82' },
  { code: '+65', label: 'SG +65' },
  { code: '+971', label: 'AE +971' },
  { code: '+966', label: 'SA +966' },
  { code: '+20', label: 'EG +20' },
  { code: '+27', label: 'ZA +27' },
  { code: '+52', label: 'MX +52' },
  { code: '+1', label: 'CA +1' },
];

export default function Register() {
  const [form, setForm] = useState({ email: '', username: '', password: '', timezone: BROWSER_TZ, countryCode: '+91', phoneNumber: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const phoneTimer = useRef(null);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => { if (phoneTimer.current) clearTimeout(phoneTimer.current); };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'countryCode' || name === 'phoneNumber') {
      const cc = name === 'countryCode' ? value : form.countryCode;
      const pn = name === 'phoneNumber' ? value : form.phoneNumber;
      const full = cc + pn;
      if (!full || !pn) { setPhoneAvailable(null); return; }
      if (phoneTimer.current) clearTimeout(phoneTimer.current);
      phoneTimer.current = setTimeout(async () => {
        setCheckingPhone(true);
        try { const res = await auth.checkPhone(full); setPhoneAvailable(res.data.available); }
        catch { setPhoneAvailable(null); }
        finally { setCheckingPhone(false); }
      }, 400);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(form.phoneNumber)) {
      setError('Phone number must be exactly 10 digits after the country code.');
      return;
    }
    if (phoneAvailable === false) { setError('This phone number is already registered.'); return; }
    setLoading(true);
    try {
      await register({ ...form, phone: form.countryCode + form.phoneNumber });
      navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object' && data !== null) {
        const flat = (o) => Object.values(o).map(v => typeof v === 'object' && v !== null ? flat(v) : String(v)).join(', ');
        setError(flat(data) || 'Registration failed');
      } else {
        setError(typeof data === 'string' ? data : 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="auth-split" style={{ display: 'flex', maxWidth: '880px', width: '100%', gap: '0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
          {/* Left — Google sign-up */}
          <div style={{ flex: '1 1 50%', background: 'var(--surface-3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <img src="/YourCalyLogo.png" alt="YourCaly" style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
            </div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '20px', color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Get started in seconds</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 28px', lineHeight: 1.5, maxWidth: '260px' }}>Create your account with Google and automatically sync your calendar — no extra steps needed.</p>
            <button
              type="button"
              onClick={() => {
                integrations.getGoogleRegisterUrl().then((res) => {
                  window.location.href = res.data.auth_url;
                }).catch(() => setError('Failed to initiate Google sign-in'));
              }}
              className="btn btn-ghost"
              style={{
                width: '100%', maxWidth: '280px', padding: '11px', fontSize: '15px', justifyContent: 'center',
                border: '1.5px solid var(--border)', background: 'var(--surface)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: '8px' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.54 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.99 23.99 0 000 24c0 3.77.87 7.35 2.56 10.54l7.98-5.95z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.95C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              Sign up with Google
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', maxWidth: '240px', lineHeight: 1.4 }}>We'll also ask for Google Calendar access so your bookings sync automatically.</p>
          </div>

          {/* Right — email form */}
          <div style={{ flex: '1 1 50%', background: 'var(--surface)', padding: '48px 36px' }}>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700, fontSize: '22px', color: 'var(--text-primary)', margin: '0 0 4px' }}>Create your account</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 24px' }}>Sign up with email</p>

            {error && (
              <div style={{ background: 'var(--surface-error)', border: '1px solid var(--border-error)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '13px', color: 'var(--text-error)' }}>{error}</div>
            )}
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Email address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required className="field" placeholder="you@example.com" />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Phone number</label>
                <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
                  <select name="countryCode" value={form.countryCode} onChange={handleChange} className="field" style={{ width: '120px', flexShrink: 0 }}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                  <input type="tel" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} pattern="\d{10}" maxLength={10} required className="field" placeholder="9876543210" style={{ flex: 1 }} />
                  {form.phoneNumber && (
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px' }}>
                      {checkingPhone ? '…' : phoneAvailable === true ? <span style={{ color: 'var(--success)' }}>✓</span> : phoneAvailable === false ? <span style={{ color: 'var(--danger)' }}>✗</span> : null}
                    </span>
                  )}
                </div>
                {phoneAvailable === false && <p style={{ fontSize: '11px', color: 'var(--danger)', marginTop: '4px', marginBottom: 0 }}>Phone already registered</p>}
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Username</label>
                <input type="text" name="username" value={form.username} onChange={handleChange} required className="field" placeholder="your-username" />
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px', marginBottom: 0 }}>yourcaly.com/{form.username || 'your-username'}</p>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required className="field" placeholder="At least 8 characters" style={{ paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {showPwd ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Your timezone</label>
                <select name="timezone" value={form.timezone} onChange={handleChange} className="field">
                  {ALL_TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '11px', fontSize: '15px', justifyContent: 'center' }}>
                {loading ? (
                  <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Creating account…</>
                ) : 'Create free account'}
              </button>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px', marginBottom: 0 }}>
                By creating an account you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
            <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
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

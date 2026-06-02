import { useState, useEffect, useRef } from 'react';
import { admin } from '../../api/admin';

export default function AdminSettings() {
  const [twoFA, setTwoFA] = useState({ enabled: false, pending_setup: false });
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [setupMode, setSetupMode] = useState(false);

  const fetchData = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    admin.get2FAStatus().then((res) => setTwoFA(res.data)).catch(() => {}).finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const enable2FA = async () => {
    setError('');
    try {
      const res = await admin.setup2FA();
      setQrCode(res.data.qr_code);
      setSecret(res.data.secret);
      setSetupMode(true);
    } catch { setError('Failed to setup 2FA'); }
  };

  const verifySetup = async () => {
    setError('');
    if (verifyCode.length !== 6) return;
    try {
      await admin.verify2FASetup(verifyCode);
      setTwoFA({ enabled: true, pending_setup: false });
      setSetupMode(false);
      setVerifyCode('');
    } catch { setError('Invalid code'); }
  };

  const disable2FA = async () => {
    if (!window.confirm('Disable 2FA? This reduces account security.')) return;
    try {
      await admin.disable2FA();
      setTwoFA({ enabled: false, pending_setup: false });
    } catch { setError('Failed to disable 2FA'); }
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#7F7F8C' }}><svg className="spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '22px', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
        <button onClick={() => fetchData(true)} disabled={refreshing} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1A1A1F', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg className={refreshing ? 'spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div style={{ backgroundColor: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', overflow: 'hidden', maxWidth: '600px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2A2A30' }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: '#E4E4E7', margin: 0 }}>Two-Factor Authentication</h2>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {error && <div style={{ background: '#7F1D1D', border: '1px solid #991B1B', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#FCA5A5' }}>{error}</div>}

          {!setupMode ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: twoFA.enabled ? '#064E3B' : '#1A1A1F', border: '1px solid #2A2A30', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={twoFA.enabled ? '#6EE7B7' : '#7F7F8C'} strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{twoFA.enabled ? 'Enabled' : 'Not configured'}</div>
                  <div style={{ fontSize: '12px', color: '#7F7F8C', marginTop: '2px' }}>{twoFA.enabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security to your admin account'}</div>
                </div>
              </div>
              {twoFA.enabled ? (
                <button onClick={disable2FA} style={{ padding: '8px 16px', borderRadius: '8px', background: '#7F1D1D', border: 'none', color: '#FCA5A5', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Disable 2FA</button>
              ) : (
                <button onClick={enable2FA} style={{ padding: '8px 16px', borderRadius: '8px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Enable 2FA</button>
              )}
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '13px', color: '#A1A1AA', margin: '0 0 16px' }}>Scan this QR code with your authenticator app (e.g. Google Authenticator, Authy):</p>
              {qrCode && <div style={{ textAlign: 'center', marginBottom: '16px' }}><img src={qrCode} alt="QR Code" style={{ width: '180px', height: '180px', borderRadius: '8px' }} /></div>}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#A1A1AA', marginBottom: '4px' }}>Secret key (manual entry)</label>
                <code style={{ display: 'block', padding: '8px 12px', borderRadius: '8px', background: '#0F0F11', border: '1px solid #2A2A30', fontSize: '12px', color: '#F59E0B', wordBreak: 'break-all' }}>{secret}</code>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#A1A1AA', marginBottom: '6px' }}>Verify code from app</label>
                <input type="text" inputMode="numeric" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} style={{ width: '140px', padding: '9px 12px', borderRadius: '8px', background: '#0F0F11', border: '1px solid #2A2A30', color: '#fff', fontSize: '18px', fontWeight: 700, outline: 'none', textAlign: 'center', letterSpacing: '4px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={verifySetup} disabled={verifyCode.length !== 6} style={{ padding: '9px 20px', borderRadius: '8px', background: verifyCode.length === 6 ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : '#2A2A30', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: verifyCode.length === 6 ? 'pointer' : 'not-allowed' }}>Verify & Enable</button>
                <button onClick={() => { setSetupMode(false); setQrCode(''); }} style={{ padding: '9px 20px', borderRadius: '8px', background: '#2A2A30', border: 'none', color: '#A1A1AA', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

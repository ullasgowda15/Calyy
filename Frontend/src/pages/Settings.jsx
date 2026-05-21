import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { integrations, auth } from '../api/client';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';

export default function Settings() {
  const { logout } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [googleStatus, setGoogleStatus] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [newWebhook, setNewWebhook] = useState({ url: '', event: 'booking.created' });
  const [loading, setLoading] = useState(true);
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('google') === 'connected') {
      toast('Google Calendar connected!', 'success');
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  useEffect(() => {
    Promise.all([
      integrations.getGoogleStatus(),
      integrations.getWebhooks(),
    ]).then(([gRes, wRes]) => {
      setGoogleStatus(gRes.data);
      setWebhooks(wRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const connectGoogle = async () => {
    try { const res = await integrations.getGoogleAuthUrl(); window.location.href = res.data.auth_url; }
    catch { toast('Failed to get Google auth URL', 'error'); }
  };

  const disconnectGoogle = async () => {
    try { await integrations.disconnectGoogle(); setGoogleStatus(null); toast('Google Calendar disconnected', 'info'); }
    catch { toast('Failed to disconnect', 'error'); }
  };

  const addWebhook = async (e) => {
    e.preventDefault();
    try {
      const res = await integrations.createWebhook(newWebhook);
      setWebhooks([...webhooks, res.data]);
      setNewWebhook({ url: '', event: 'booking.created' });
      toast('Webhook created!', 'success');
    } catch { toast('Failed to create webhook', 'error'); }
  };

  const Section = ({ title, desc, children }) => (
    <div className="card" style={{ overflow: 'hidden', marginBottom: '20px' }}>
      <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', margin: '0 0 2px' }}>{title}</h2>
        {desc && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{desc}</p>}
      </div>
      <div style={{ padding: '22px' }}>{children}</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }} className="sidebar-main">
        <div style={{ padding: '28px 32px', maxWidth: '720px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Settings</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Manage integrations and account preferences.</p>
          </div>

          {/* Google Calendar */}
          <Section title="Google Calendar" desc="Sync your bookings and check availability conflicts automatically.">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: '200px', height: '16px', borderRadius: '6px' }} />
                <div className="skeleton" style={{ width: '100px', height: '34px', borderRadius: '8px' }} />
              </div>
            ) : googleStatus?.connected ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Connected</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{googleStatus.email}</div>
                  </div>
                </div>
                <button onClick={disconnectGoogle} className="btn btn-danger btn-sm">Disconnect</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Not connected</div>
                </div>
                <button onClick={connectGoogle} className="btn btn-secondary btn-sm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                  Connect Google Calendar
                </button>
              </div>
            )}
          </Section>

          {/* Webhooks */}
          <Section title="Webhooks" desc="Get notified when bookings are created or cancelled.">
            <form onSubmit={addWebhook} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Endpoint URL</label>
                <input value={newWebhook.url} onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })} required className="field" style={{ padding: '8px 12px', fontSize: '13px' }} placeholder="https://example.com/webhook" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Event</label>
                <select value={newWebhook.event} onChange={(e) => setNewWebhook({ ...newWebhook, event: e.target.value })} className="field" style={{ width: '180px', padding: '8px 12px', fontSize: '13px' }}>
                  <option value="booking.created">booking.created</option>
                  <option value="booking.cancelled">booking.cancelled</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-sm">Add webhook</button>
            </form>

            {webhooks.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>No webhooks configured.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {webhooks.map((w) => (
                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: w.is_active ? '#10B981' : '#EF4444', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.url}</span>
                      <span style={{ fontSize: '11px', background: 'var(--surface-3)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '99px', flexShrink: 0 }}>{w.event}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Change password */}
          <Section title="Change Password" desc="Update your account password.">
            <form onSubmit={async (e) => {
              e.preventDefault(); setPwdError('');
              if (pwdForm.new_password !== pwdForm.confirm) { setPwdError('Passwords do not match'); return; }
              if (pwdForm.new_password.length < 8) { setPwdError('Password must be at least 8 characters'); return; }
              setPwdLoading(true);
              try {
                await auth.changePassword({ old_password: pwdForm.old_password, new_password: pwdForm.new_password });
                toast('Password changed successfully!', 'success');
                setPwdForm({ old_password: '', new_password: '', confirm: '' });
              } catch (err) { setPwdError(err.response?.data?.error || 'Failed to change password'); }
              finally { setPwdLoading(false); }
            }} style={{ maxWidth: '360px' }}>
              {pwdError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#991B1B' }}>{pwdError}</div>}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Current password</label>
                <input type="password" value={pwdForm.old_password} onChange={(e) => setPwdForm({...pwdForm, old_password: e.target.value})} required className="field" style={{ width: '100%', padding: '8px 12px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>New password</label>
                <input type="password" value={pwdForm.new_password} onChange={(e) => setPwdForm({...pwdForm, new_password: e.target.value})} required className="field" style={{ width: '100%', padding: '8px 12px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Confirm new password</label>
                <input type="password" value={pwdForm.confirm} onChange={(e) => setPwdForm({...pwdForm, confirm: e.target.value})} required className="field" style={{ width: '100%', padding: '8px 12px', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" disabled={pwdLoading} className="btn btn-primary btn-sm">{pwdLoading ? 'Updating...' : 'Update password'}</button>
            </form>
          </Section>

          {/* Sign out */}
          <Section title="Account" desc="Sign out of your account.">
            <button onClick={logout} className="btn btn-danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Sign out
            </button>
          </Section>
        </div>
      </main>
      <style>{`@media (max-width: 767px) { .sidebar-main { margin-left: 0; padding-top: 64px; } }`}</style>
    </div>
  );
}

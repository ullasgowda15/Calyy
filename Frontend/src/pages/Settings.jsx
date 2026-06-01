import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { payments, integrations, auth } from '../api/client';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';

const Section = ({ title, desc, children }) => (
  <div className="card" style={{ overflow: 'hidden', marginBottom: '20px' }}>
    <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
      <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', margin: '0 0 2px' }}>{title}</h2>
      {desc && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{desc}</p>}
    </div>
    <div style={{ padding: '22px' }}>{children}</div>
  </div>
);

export default function Settings() {
  const { logout } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const googleConnected = searchParams.get('google') === 'connected';
  const [googleStatus, setGoogleStatus] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [newWebhook, setNewWebhook] = useState({ url: '', event: 'booking.created' });
  const [loading, setLoading] = useState(true);
  const [pwdForm, setPwdForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (googleConnected) {
      toast('Google Calendar connected!', 'success');
      window.history.replaceState({}, '', '/settings');
    }
  }, [googleConnected]);

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, minHeight: '100vh' }} className="sidebar-main">
        <div className="page-content" style={{ maxWidth: '720px' }}>
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
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Connected</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{googleStatus.email}</div>
                    </div>
                  </div>
                  <button disabled onClick={disconnectGoogle} className="btn btn-danger btn-sm" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Disconnect</button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '8px', fontWeight: 500 }}>Under Google verification — disconnect temporarily unavailable</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Not connected</div>
                  </div>
                  <button disabled onClick={connectGoogle} className="btn btn-secondary btn-sm" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    Connect Google Calendar
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--warning)', marginTop: '8px', fontWeight: 500 }}>Under Google verification — connect temporarily unavailable</p>
              </div>
            )}
          </Section>

          {/* Platform Subscription */}
          <Section title="Subscription" desc="Your YourCaly platform subscription plan.">
            <SubscriptionContent />
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
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: w.is_active ? 'var(--success)' : 'var(--danger)', flexShrink: 0 }} />
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
              {pwdError && <div style={{ background: 'var(--surface-error)', border: '1px solid var(--border-error)', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-error)' }}>{pwdError}</div>}
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
    </div>
  );
}


function SubscriptionContent() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const toast = useToast();

  useEffect(() => {
    payments.getSubscriptionStatus().then((res) => setSub(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const daysLeft = () => {
    if (!sub) return 0;
    if (sub.is_subscribed) {
      if (sub.subscribed_until) {
        const diff = new Date(sub.subscribed_until) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
      if (sub.trial_ends_at) {
        const diff = new Date(sub.trial_ends_at) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      }
    }
    return 0;
  };

  const handleSubscribe = async () => {
    setPaying(true);
    try {
      const orderRes = await payments.createSubscriptionOrder();
      const { order_id, key_id, amount } = orderRes.data;

      if (typeof window.Razorpay === 'undefined') {
        toast('Razorpay SDK not loaded. Please refresh.', 'error');
        setPaying(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: key_id,
        amount,
        currency: 'INR',
        name: 'YourCaly',
        description: 'Monthly subscription',
        order_id,
        handler: async (response) => {
          try {
            const verifyRes = await payments.verifySubscription({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setSub((prev) => ({ ...prev, ...verifyRes.data }));
            setPaying(false);
            toast('Subscription activated!', 'success');
          } catch {
            setPaying(false);
            toast('Payment verification failed.', 'error');
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch {
      toast('Failed to initiate payment', 'error');
      setPaying(false);
    }
  };

  if (loading) return <div className="skeleton" style={{ width: '200px', height: '16px', borderRadius: '6px' }} />;

  const days = daysLeft();

  return (
    <div>
      {sub?.is_subscribed ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M5 13l4 4L19 7"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {sub.subscription_status === 'free_trial' ? 'Free Trial' : 'Active'} — {days > 0 ? `${days} day${days > 1 ? 's' : ''} remaining` : 'Expiring today'}
              </div>
              {sub.subscribed_until && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Renews {new Date(sub.subscribed_until).toLocaleDateString()}</div>}
              {sub.trial_ends_at && sub.subscription_status === 'free_trial' && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trial ends {new Date(sub.trial_ends_at).toLocaleDateString()}</div>}
            </div>
          </div>
          {sub.subscription_status === 'free_trial' ? (
            <button onClick={handleSubscribe} disabled={paying} className="btn btn-primary btn-sm">
              {paying ? 'Processing…' : 'Subscribe now — ₹499/mo'}
            </button>
          ) : days <= 7 ? (
            <button onClick={handleSubscribe} disabled={paying} className="btn btn-primary btn-sm">
              {paying ? 'Processing…' : 'Renew — ₹499/mo'}
            </button>
          ) : null}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--surface-error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Expired</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Your booking links are disabled</div>
            </div>
          </div>
          <button onClick={handleSubscribe} disabled={paying} className="btn btn-primary btn-sm">
            {paying ? 'Processing…' : 'Resubscribe — ₹499/mo'}
          </button>
        </div>
      )}
    </div>
  );
}

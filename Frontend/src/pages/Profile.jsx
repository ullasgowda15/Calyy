import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../api/client';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';

const TIMEZONES = ['UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','Europe/London','Europe/Paris','Europe/Berlin','Asia/Tokyo','Asia/Shanghai','Asia/Kolkata','Australia/Sydney','Pacific/Auckland','Africa/Cairo'];

export default function Profile() {
  const { user, loadProfile, logout } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({ first_name: '', last_name: '', username: '', timezone: 'UTC', bio: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const checkTimer = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) setProfile({ first_name: user.first_name || '', last_name: user.last_name || '', username: user.username || '', timezone: user.timezone || 'UTC', bio: user.bio || '' });
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
    if (name === 'username') {
      const newUsername = value.trim();
      if (!newUsername || newUsername === user?.username) { setUsernameAvailable(null); return; }
      if (checkTimer.current) clearTimeout(checkTimer.current);
      checkTimer.current = setTimeout(async () => {
        setCheckingUsername(true);
        try { const res = await auth.checkUsername(newUsername); setUsernameAvailable(res.data.available); }
        catch { setUsernameAvailable(null); }
        finally { setCheckingUsername(false); }
      }, 400);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      await auth.uploadAvatar(formData);
      await loadProfile();
      setAvatarFile(null); setAvatarPreview(null);
      toast('Avatar updated!', 'success');
    } catch { toast('Failed to upload avatar', 'error'); }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    if (usernameAvailable === false) return;
    setSaving(true);
    try {
      await auth.updateProfile(profile);
      await loadProfile();
      toast('Profile updated!', 'success');
      setEditing(false);
    } catch (err) {
      toast(err.response?.data?.username?.[0] || 'Failed to update profile', 'error');
    } finally { setSaving(false); }
  };

  const avatar = avatarPreview || user?.avatar;
  const initials = user?.username?.[0]?.toUpperCase() || '?';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }} className="sidebar-main">
        <div style={{ padding: '28px 32px', maxWidth: '720px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Profile</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Manage your public profile and personal information.</p>
          </div>

          <div className="card" style={{ overflow: 'hidden' }}>
            {/* Avatar section */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                {avatar ? (
                  <img src={avatar} alt="Avatar" style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)' }} />
                ) : (
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '26px', fontWeight: 700, border: '3px solid var(--border)' }}>{initials}</div>
                )}
                {editing && (
                  <button onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                  </button>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)' }}>{user?.username}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.email}</div>
                {editing && avatarFile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{avatarFile.name}</span>
                    <button onClick={handleAvatarUpload} className="btn btn-primary btn-sm">Upload</button>
                    <button onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} className="btn btn-ghost btn-sm">Cancel</button>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
              {!editing && (
                <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit profile
                </button>
              )}
            </div>

            {/* Info / Edit form */}
            <div style={{ padding: '24px' }}>
              {!editing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[['First name', profile.first_name || '—'], ['Last name', profile.last_name || '—'], ['Timezone', profile.timezone], ['Bio', profile.bio || '—']].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: '16px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', width: '100px', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <form onSubmit={saveProfile}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    {[['first_name','First name'],['last_name','Last name']].map(([name, label]) => (
                      <div key={name}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{label}</label>
                        <input name={name} value={profile[name]} onChange={handleProfileChange} className="field" />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Username</label>
                    <div style={{ position: 'relative' }}>
                      <input name="username" value={profile.username} onChange={handleProfileChange} className="field"
                        style={{ borderColor: usernameAvailable === true ? '#10B981' : usernameAvailable === false ? '#EF4444' : undefined, paddingRight: '90px' }} />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', fontWeight: 600, color: checkingUsername ? 'var(--text-muted)' : usernameAvailable === true ? '#10B981' : usernameAvailable === false ? '#EF4444' : 'transparent' }}>
                        {checkingUsername ? 'Checking…' : usernameAvailable === true ? '✓ Available' : usernameAvailable === false ? '✗ Taken' : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Timezone</label>
                    <select name="timezone" value={profile.timezone} onChange={handleProfileChange} className="field">
                      {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Bio</label>
                    <textarea name="bio" value={profile.bio} onChange={handleProfileChange} rows={3} className="field" style={{ resize: 'vertical' }} placeholder="Tell invitees a bit about yourself…" />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" disabled={saving || usernameAvailable === false} className="btn btn-primary">
                      {saving ? <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Saving…</> : 'Save changes'}
                    </button>
                    <button type="button" onClick={() => { setEditing(false); setUsernameAvailable(null); }} className="btn btn-ghost">Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button onClick={logout} className="btn btn-danger">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Sign out
            </button>
          </div>
        </div>
      </main>
      <style>{`@media (max-width: 767px) { .sidebar-main { margin-left: 0; padding-top: 64px; } }`}</style>
    </div>
  );
}

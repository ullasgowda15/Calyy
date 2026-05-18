import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { integrations, auth } from '../api/client';
import Sidebar from '../components/Sidebar';

export default function Settings() {
  const { user, loadProfile, logout } = useAuth();
  const [profile, setProfile] = useState({ first_name: '', last_name: '', email: '', username: '', timezone: 'UTC' });
  const [googleStatus, setGoogleStatus] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [newWebhook, setNewWebhook] = useState({ url: '', event: 'booking.created' });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        timezone: user.timezone || 'UTC',
      });
    }
  }, [user]);

  useEffect(() => {
    integrations.getGoogleStatus().then((res) => setGoogleStatus(res.data)).catch(() => {});
    integrations.getWebhooks().then((res) => setWebhooks(res.data)).catch(() => {});
  }, []);

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await auth.updateProfile(profile);
      await loadProfile();
      setMessage('Profile updated!');
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const connectGoogle = async () => {
    try {
      const res = await integrations.getGoogleAuthUrl();
      window.location.href = res.data.auth_url;
    } catch {
      setMessage('Failed to get Google auth URL');
    }
  };

  const disconnectGoogle = async () => {
    try {
      await integrations.disconnectGoogle();
      setGoogleStatus(null);
      setMessage('Google Calendar disconnected');
    } catch {
      setMessage('Failed to disconnect Google Calendar');
    }
  };

  const addWebhook = async (e) => {
    e.preventDefault();
    try {
      const res = await integrations.createWebhook(newWebhook);
      setWebhooks([...webhooks, res.data]);
      setNewWebhook({ url: '', event: 'booking.created' });
      setMessage('Webhook created!');
    } catch {
      setMessage('Failed to create webhook');
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {message && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{message}</div>}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">First name</label><input name="first_name" value={profile.first_name} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Last name</label><input name="last_name" value={profile.last_name} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input name="email" value={profile.email} disabled className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Username</label><input name="username" value={profile.username} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label><input name="timezone" value={profile.timezone} onChange={handleProfileChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
            <button type="submit" disabled={saving} className="bg-[#3B82F6] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50">
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Google Calendar</h2>
          {googleStatus?.connected ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Connected as <span className="font-medium">{googleStatus.email}</span></p>
              <button onClick={disconnectGoogle} className="text-red-500 text-sm hover:underline">Disconnect</button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Sync your availability with Google Calendar</p>
              <button onClick={connectGoogle} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm">Connect Google Calendar</button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Webhooks</h2>
          <form onSubmit={addWebhook} className="flex items-end gap-3 mb-4">
            <div className="flex-1"><label className="block text-xs text-gray-500 mb-1">URL</label><input value={newWebhook.url} onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded text-sm" placeholder="https://example.com/webhook" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Event</label><select value={newWebhook.event} onChange={(e) => setNewWebhook({ ...newWebhook, event: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm"><option value="booking.created">booking.created</option><option value="booking.cancelled">booking.cancelled</option></select></div>
            <button type="submit" className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm">Add</button>
          </form>
          {webhooks.length === 0 ? (
            <p className="text-sm text-gray-400">No webhooks configured.</p>
          ) : (
            <ul className="space-y-2">
              {webhooks.map((w) => (
                <li key={w.id} className="text-sm text-gray-600 flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span>{w.url} <span className="text-gray-400">({w.event})</span></span>
                  <span className={`w-2 h-2 rounded-full ${w.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Account</h2>
          <button onClick={logout} className="text-red-500 hover:underline text-sm">Sign out</button>
        </div>
      </div>
    </div>
  );
}

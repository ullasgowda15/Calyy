import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { integrations } from '../api/client';
import Sidebar from '../components/Sidebar';

export default function Settings() {
  const { logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [googleStatus, setGoogleStatus] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [newWebhook, setNewWebhook] = useState({ url: '', event: 'booking.created' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (searchParams.get('google') === 'connected') {
      setMessage('Google Calendar connected!');
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  useEffect(() => {
    integrations.getGoogleStatus().then((res) => setGoogleStatus(res.data)).catch(() => {});
    integrations.getWebhooks().then((res) => setWebhooks(res.data)).catch(() => {});
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 p-8 max-w-3xl min-h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {message && <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes('Failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{message}</div>}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Google Calendar</h2>
          {googleStatus?.connected ? (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">Connected as <span className="font-medium">{googleStatus.email}</span></p>
              <button onClick={disconnectGoogle} className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600 transition">Disconnect</button>
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
          <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition">Sign out</button>
        </div>
      </div>
    </div>
  );
}
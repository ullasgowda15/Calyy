import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { integrations } from '../api/client';
import Sidebar from '../components/Sidebar';
import { Calendar, CheckCircle, XCircle, Link2, Plus, Globe, LogOut, ArrowUpRight, Moon, Sun } from 'lucide-react';

export default function Settings() {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
      <Sidebar />
      <main className="ml-64 p-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage integrations, webhooks, and account settings.</p>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-6 text-sm border ${
            message.includes('Failed')
              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400'
              : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400'
          }`}>
            {message.includes('Failed') ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            {message}
          </div>
        )}

        {/* Appearance */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            {theme === 'dark' ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-slate-400" />}
            <h2 className="font-semibold text-slate-900 dark:text-white">Appearance</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {theme === 'dark' ? 'Easier on the eyes in low light' : 'Clean and bright interface'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="relative w-14 h-7 rounded-full bg-slate-200 dark:bg-slate-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:focus:ring-offset-[#0B1120]"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <div className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform duration-200 ${
                theme === 'dark' ? 'translate-x-7' : 'translate-x-0'
              }`}>
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                )}
              </div>
            </button>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Google Calendar</h2>
          </div>
          {googleStatus?.connected ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-4 dark:bg-green-500/10 dark:border-green-500/30">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-800 dark:text-green-300">Connected as <span className="font-semibold">{googleStatus.email}</span></p>
              </div>
              <button onClick={disconnectGoogle} className="btn-danger text-sm">Disconnect</button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4 dark:bg-slate-700/50">
              <p className="text-sm text-slate-600 dark:text-slate-300">Sync your availability with Google Calendar to avoid conflicts.</p>
              <button onClick={connectGoogle} className="btn-secondary text-sm">
                <ArrowUpRight className="w-3.5 h-3.5" />
                Connect Google Calendar
              </button>
            </div>
          )}
        </div>

        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Webhooks</h2>
          </div>
          <form onSubmit={addWebhook} className="flex items-end gap-3 mb-6">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">URL</label>
              <input
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                required
                className="input-field"
                placeholder="https://example.com/webhook"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Event</label>
              <select
                value={newWebhook.event}
                onChange={(e) => setNewWebhook({ ...newWebhook, event: e.target.value })}
                className="input-field appearance-none bg-white dark:bg-[#1E293B]"
              >
                <option value="booking.created">booking.created</option>
                <option value="booking.cancelled">booking.cancelled</option>
              </select>
            </div>
            <button type="submit" className="btn-secondary">
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>
          {webhooks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No webhooks configured.</p>
          ) : (
            <div className="space-y-2">
              {webhooks.map((w) => (
                <div key={w.id} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl text-sm dark:bg-slate-700/50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-700 dark:text-slate-300">{w.url}</span>
                    <span className="text-slate-400 dark:text-slate-500">({w.event})</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${w.is_active ? 'bg-green-400' : 'bg-red-400'}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <LogOut className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Account</h2>
          </div>
          <button onClick={logout} className="btn-danger">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </main>
    </div>
  );
}

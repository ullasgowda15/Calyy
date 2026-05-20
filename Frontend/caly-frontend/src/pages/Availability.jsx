import { useState, useEffect } from 'react';
import { availability } from '../api/client';
import Sidebar from '../components/Sidebar';
import { Clock, CalendarX, Plus, X, Save, CheckCircle } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function localToUTC(localDatetime) {
  if (!localDatetime) return '';
  const d = new Date(localDatetime);
  if (isNaN(d.getTime())) return localDatetime;
  return d.toISOString().slice(0, 19);
}

export default function AvailabilityPage() {
  const [windows, setWindows] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [blockForm, setBlockForm] = useState({ start_datetime: '', end_datetime: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const showMessage = (text, type = 'success') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  useEffect(() => {
    availability.getAvailability().then((res) => {
      const mapped = res.data.map((w) => ({
        ...w,
        start_time: w.start_time.slice(0, 5),
        end_time: w.end_time.slice(0, 5),
      }));
      setWindows(mapped);
    }).catch(() => {});
    availability.getBlockedTimes().then((res) => setBlocked(res.data)).catch(() => {});
  }, []);

  const getDayWindows = (dayIndex) => windows.filter((w) => w.weekday === dayIndex && w.is_active);

  const addWindow = (dayIndex) => {
    setWindows([...windows, { weekday: dayIndex, start_time: '09:00', end_time: '17:00', is_active: true, _new: true }]);
  };

  const updateWindow = (idx, field, value) => {
    const w = [...windows];
    w[idx] = { ...w[idx], _dirty: true, [field]: value };
    setWindows(w);
  };

  const removeWindow = (idx) => {
    const w = windows[idx];
    if (w.id) {
      availability.deleteAvailability(w.id).catch(() => {});
    }
    setWindows(windows.filter((_, i) => i !== idx));
  };

  const saveAll = async () => {
    setSaving(true);
    setMessage('');
    try {
      for (const w of windows) {
        if (w._new) {
          await availability.createAvailability({ weekday: w.weekday, start_time: w.start_time, end_time: w.end_time });
        } else if (w._dirty && w.id) {
          await availability.updateAvailability(w.id, { weekday: w.weekday, start_time: w.start_time, end_time: w.end_time });
        }
      }
      const fresh = await availability.getAvailability();
      setWindows(fresh.data.map((w) => ({ ...w, start_time: w.start_time.slice(0, 5), end_time: w.end_time.slice(0, 5) })));
      showMessage('Availability saved!', 'success');
    } catch {
      showMessage('Failed to save availability', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addBlocked = async () => {
    try {
      const payload = {
        start_datetime: localToUTC(blockForm.start_datetime),
        end_datetime: localToUTC(blockForm.end_datetime),
        reason: blockForm.reason,
      };
      await availability.createBlockedTime(payload);
      setBlockForm({ start_datetime: '', end_datetime: '', reason: '' });
      const fresh = await availability.getBlockedTimes();
      setBlocked(fresh.data);
      showMessage('Time blocked!', 'success');
    } catch {
      showMessage('Failed to block time', 'error');
    }
  };

  const removeBlocked = async (id) => {
    try {
      await availability.deleteBlockedTime(id);
      setBlocked(blocked.filter((b) => b.id !== id));
      showMessage('Block removed', 'success');
    } catch {
      showMessage('Failed to remove block', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
      <Sidebar />
      <main className="ml-64 p-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Availability</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Set your weekly hours and block out unavailable times.</p>
          </div>
          <button onClick={saveAll} disabled={saving} className="btn-primary">
            {saving ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save availability'}
          </button>
        </div>

        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-xl mb-6 text-sm border ${
            messageType === 'error'
              ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400'
              : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/30 dark:text-green-400'
          }`}>
            <CheckCircle className="w-4 h-4" />
            {message}
          </div>
        )}

        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Weekly hours</h2>
          </div>
          <div className="space-y-5">
            {DAYS.map((day, di) => {
              const dayWindows = getDayWindows(di);
              return (
                <div key={day} className="flex items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                  <div className="w-28 pt-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">{day}</div>
                  <div className="flex-1 space-y-2">
                    {dayWindows.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-slate-500 italic">Not available</p>
                    ) : (
                      windows.map((w, idx) => {
                        if (w.weekday !== di || !w.is_active) return null;
                        return (
                          <div key={w.id || idx} className="flex items-center gap-2">
                            <select
                              value={w.start_time}
                              onChange={(e) => updateWindow(idx, 'start_time', e.target.value)}
                              className="input-field py-1.5 text-sm appearance-none bg-white dark:bg-[#1E293B]"
                            >
                              {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <span className="text-slate-400 dark:text-slate-500 text-sm">to</span>
                            <select
                              value={w.end_time}
                              onChange={(e) => updateWindow(idx, 'end_time', e.target.value)}
                              className="input-field py-1.5 text-sm appearance-none bg-white dark:bg-[#1E293B]"
                            >
                              {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <button
                              onClick={() => removeWindow(idx)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    )}
                    <button
                      onClick={() => addWindow(di)}
                      className="text-accent text-sm font-medium hover:text-blue-700 dark:hover:text-blue-400 transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add time range
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-6">
            <CalendarX className="w-5 h-5 text-slate-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Blocked times</h2>
          </div>
          <div className="flex items-end gap-3 mb-6">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start</label>
              <input
                type="datetime-local"
                value={blockForm.start_datetime}
                onChange={(e) => setBlockForm({ ...blockForm, start_datetime: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End</label>
              <input
                type="datetime-local"
                value={blockForm.end_datetime}
                onChange={(e) => setBlockForm({ ...blockForm, end_datetime: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Reason</label>
              <input
                type="text"
                value={blockForm.reason}
                onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                className="input-field"
                placeholder="Lunch, vacation..."
              />
            </div>
            <button onClick={addBlocked} className="btn-secondary whitespace-nowrap">
              <CalendarX className="w-4 h-4" />
              Block
            </button>
          </div>
          {blocked.length > 0 && (
            <div className="space-y-2">
              {blocked.map((b) => (
                <div key={b.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 px-4 py-3 rounded-xl text-sm">
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {new Date(b.start_datetime).toLocaleString()} — {new Date(b.end_datetime).toLocaleString()}
                    </span>
                    {b.reason && <span className="text-slate-400 dark:text-slate-500 ml-2">({b.reason})</span>}
                  </div>
                  <button
                    onClick={() => removeBlocked(b.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

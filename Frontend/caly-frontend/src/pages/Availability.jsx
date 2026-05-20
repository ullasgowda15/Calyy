import { useState, useEffect } from 'react';
import { availability } from '../api/client';
import Sidebar from '../components/Sidebar';

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
      showMessage('Availability saved!');
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
      showMessage('Time blocked!');
    } catch {
      showMessage('Failed to block time', 'error');
    }
  };

  const removeBlocked = async (id) => {
    try {
      await availability.deleteBlockedTime(id);
      setBlocked(blocked.filter((b) => b.id !== id));
      showMessage('Block removed');
    } catch {
      showMessage('Failed to remove block', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 p-8 max-w-4xl min-h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Availability</h1>

        {message && (
          <div className={`p-3 rounded-lg mb-4 text-sm ${messageType === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Weekly hours</h2>
          <div className="space-y-4">
            {DAYS.map((day, di) => {
              const dayWindows = getDayWindows(di);
              return (
                <div key={day} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className="w-24 pt-2 text-sm font-medium text-gray-700">{day}</div>
                  <div className="flex-1 space-y-2">
                    {dayWindows.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">Not available</p>
                    ) : (
                      windows.map((w, idx) => {
                        if (w.weekday !== di || !w.is_active) return null;
                        return (
                          <div key={w.id || idx} className="flex items-center gap-2">
                            <select value={w.start_time} onChange={(e) => updateWindow(idx, 'start_time', e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm">
                              {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <span className="text-gray-400">to</span>
                            <select value={w.end_time} onChange={(e) => updateWindow(idx, 'end_time', e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-sm">
                              {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <button onClick={() => removeWindow(idx)} className="bg-red-50 text-red-500 p-1 rounded hover:bg-red-100 transition ml-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        );
                      })
                    )}
                    <button onClick={() => addWindow(di)} className="bg-[#3B82F6]/10 text-[#3B82F6] px-3 py-1 rounded text-sm hover:bg-[#3B82F6]/20 transition">+ Add time range</button>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={saveAll} disabled={saving} className="mt-6 bg-[#3B82F6] text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50">
            {saving ? 'Saving...' : 'Save availability'}
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Blocked times</h2>
          <div className="flex items-end gap-3 mb-4">
            <div><label className="block text-xs text-gray-500 mb-1">Start</label><input type="datetime-local" value={blockForm.start_datetime} onChange={(e) => setBlockForm({ ...blockForm, start_datetime: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">End</label><input type="datetime-local" value={blockForm.end_datetime} onChange={(e) => setBlockForm({ ...blockForm, end_datetime: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Reason</label><input type="text" value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} className="px-3 py-2 border border-gray-300 rounded text-sm" placeholder="Lunch" /></div>
            <button onClick={addBlocked} className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm">Block</button>
          </div>
          {blocked.length > 0 && (
            <ul className="space-y-2">
              {blocked.map((b) => (
                <li key={b.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm">
                  <span>{new Date(b.start_datetime).toLocaleString()} — {new Date(b.end_datetime).toLocaleString()}{b.reason ? ` (${b.reason})` : ''}</span>
                  <button onClick={() => removeBlocked(b.id)} className="bg-red-50 text-red-500 p-1 rounded hover:bg-red-100 transition ml-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

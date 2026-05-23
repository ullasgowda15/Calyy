import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { availability } from '../api/client';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import { getUserTimezone } from '../utils/datetime';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const TimeSelect = ({ value, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="field" style={{ width: '110px', padding: '7px 10px', fontSize: '13px' }}>
    {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
  </select>
);

function localToUTC(localDatetime) {
  if (!localDatetime) return '';
  const parts = localDatetime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!parts) return localDatetime;
  const d = new Date(Date.UTC(+parts[1], +parts[2] - 1, +parts[3], +parts[4], +parts[5]));
  if (isNaN(d.getTime())) return localDatetime;
  return d.toISOString().slice(0, 19);
}

export default function AvailabilityPage() {
  const toast = useToast();
  const [windows, setWindows] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [blockForm, setBlockForm] = useState({ start_datetime: '', end_datetime: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      availability.getAvailability(),
      availability.getBlockedTimes(),
    ]).then(([avRes, blRes]) => {
      setWindows(avRes.data.map((w) => ({ ...w, start_time: w.start_time.slice(0, 5), end_time: w.end_time.slice(0, 5) })));
      setBlocked(blRes.data);
    }).catch(() => {}).finally(() => setLoading(false));
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
    if (w.id) availability.deleteAvailability(w.id).catch(() => {});
    setWindows(windows.filter((_, i) => i !== idx));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const w of windows) {
        if (w._new) await availability.createAvailability({ weekday: w.weekday, start_time: w.start_time, end_time: w.end_time });
        else if (w._dirty && w.id) await availability.updateAvailability(w.id, { weekday: w.weekday, start_time: w.start_time, end_time: w.end_time });
      }
      const fresh = await availability.getAvailability();
      setWindows(fresh.data.map((w) => ({ ...w, start_time: w.start_time.slice(0, 5), end_time: w.end_time.slice(0, 5) })));
      toast('Availability saved!', 'success');
    } catch { toast('Failed to save availability', 'error'); }
    finally { setSaving(false); }
  };

  const addBlocked = async () => {
    try {
      const payload = { start_datetime: localToUTC(blockForm.start_datetime), end_datetime: localToUTC(blockForm.end_datetime), reason: blockForm.reason };
      await availability.createBlockedTime(payload);
      setBlockForm({ start_datetime: '', end_datetime: '', reason: '' });
      const fresh = await availability.getBlockedTimes();
      setBlocked(fresh.data);
      toast('Time blocked!', 'success');
    } catch { toast('Failed to block time', 'error'); }
  };

  const removeBlocked = async (id) => {
    try {
      await availability.deleteBlockedTime(id);
      setBlocked(blocked.filter((b) => b.id !== id));
      toast('Block removed', 'info');
    } catch { toast('Failed to remove block', 'error'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }} className="sidebar-main">
        <div className="page-content" style={{ maxWidth: '900px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Availability</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Set your weekly hours and block out times you're unavailable.</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 0' }}>Times shown in <strong>{getUserTimezone()}</strong> — update your timezone in <Link to="/profile" style={{ color: 'var(--accent)' }}>Profile</Link> if this is wrong.</p>
          </div>

          {/* Weekly hours */}
          <div className="card" style={{ marginBottom: '20px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>Weekly hours</h2>
            </div>
            <div style={{ padding: '8px 0' }}>
              {loading ? (
                <div style={{ padding: '20px' }}>
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                      <div className="skeleton" style={{ width: '90px', height: '14px', borderRadius: '6px' }} />
                      <div className="skeleton" style={{ width: '200px', height: '34px', borderRadius: '8px' }} />
                    </div>
                  ))}
                </div>
              ) : DAYS.map((day, di) => {
                const dayWins = windows.filter((w, idx) => w.weekday === di && w.is_active);
                return (
                  <div key={day} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '14px 20px', borderBottom: di < DAYS.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: '100px', paddingTop: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{day}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      {dayWins.length === 0 ? (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', paddingTop: '8px' }}>Unavailable</span>
                      ) : (
                        windows.map((w, idx) => {
                          if (w.weekday !== di || !w.is_active) return null;
                          return (
                            <div key={w.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                              <TimeSelect value={w.start_time} onChange={(v) => updateWindow(idx, 'start_time', v)} />
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>→</span>
                              <TimeSelect value={w.end_time} onChange={(v) => updateWindow(idx, 'end_time', v)} />
                              <button onClick={() => removeWindow(idx)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </button>
                            </div>
                          );
                        })
                      )}
                      <button onClick={() => addWindow(di)} style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-light)', border: 'none', borderRadius: '8px', padding: '5px 12px', cursor: 'pointer', marginTop: dayWins.length > 0 ? '4px' : 0, transition: 'background 0.15s' }}>
                        + Add hours
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
              <button onClick={saveAll} disabled={saving} className="btn btn-primary">
                {saving ? <><svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Saving…</> : 'Save availability'}
              </button>
            </div>
          </div>

          {/* Blocked times */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>Blocked times</h2>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'flex-end' }}>
                {[['start_datetime','Start'],['end_datetime','End']].map(([key, label]) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>{label}</label>
                    <input type="datetime-local" value={blockForm[key]} onChange={(e) => setBlockForm({ ...blockForm, [key]: e.target.value })} className="field" style={{ width: '200px', padding: '8px 10px', fontSize: '13px' }} />
                  </div>
                ))}
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Reason (optional)</label>
                  <input type="text" value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} className="field" style={{ padding: '8px 10px', fontSize: '13px' }} placeholder="e.g. Lunch break" />
                </div>
                <button onClick={addBlocked} className="btn btn-primary btn-sm" style={{ marginBottom: '1px' }}>Block time</button>
              </div>

              {blocked.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>No blocked times configured.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {blocked.map((b) => (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {new Date(b.start_datetime).toLocaleString()} — {new Date(b.end_datetime).toLocaleString()}
                        </span>
                        {b.reason && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>({b.reason})</span>}
                      </div>
                      <button onClick={() => removeBlocked(b.id)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


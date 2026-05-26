import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { availability } from '../api/client';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import { getUserTimezone, formatDateTimeUTC } from '../utils/datetime';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function to12h(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const HOURS_12 = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  const hh = String(h).padStart(2, '0');
  return { value: `${hh}:${m}`, label: to12h(`${hh}:${m}`) };
});

const TimeSelect = ({ value, onChange, style }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="field" style={{ minWidth: '120px', padding: '7px 10px', fontSize: '13px', ...style }}>
    {HOURS_12.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
  </select>
);

function localToUTC(localDatetime) {
  if (!localDatetime) return '';
  const parts = localDatetime.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!parts) return localDatetime;
  const d = new Date(+parts[1], +parts[2] - 1, +parts[3], +parts[4], +parts[5]);
  if (isNaN(d.getTime())) return localDatetime;
  return d.toISOString().slice(0, 19);
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function BlockCard({ block, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  const start = formatDateTimeUTC(block.start_datetime);
  const end = formatDateTimeUTC(block.end_datetime);

  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-error)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border-error)' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-error)', fontWeight: 500 }}>Remove this block?</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => { onRemove(block.id); setConfirming(false); }} className="btn btn-sm" style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Yes</button>
          <button onClick={() => setConfirming(false)} className="btn btn-sm" style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>No</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', borderRadius: '10px', padding: '12px 14px', border: '1px solid var(--border)', borderLeft: '3px solid var(--danger)', transition: 'box-shadow 0.15s', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }} className="avail-block-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)', flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }} className="avail-block-text">
            {start} — {end}
          </span>
          {block.reason && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>({block.reason})</span>}
        </div>
      </div>
      <button onClick={() => setConfirming(true)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  );
}

export default function AvailabilityPage() {
  const toast = useToast();
  const [windows, setWindows] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [blockForm, setBlockForm] = useState({ start_date: todayStr(), start_time: '09:00', end_date: todayStr(), end_time: '10:00', reason: '' });
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
      const start = `${blockForm.start_date}T${blockForm.start_time}`;
      const end = `${blockForm.end_date}T${blockForm.end_time}`;
      const payload = { start_datetime: localToUTC(start), end_datetime: localToUTC(end), reason: blockForm.reason };
      await availability.createBlockedTime(payload);
      setBlockForm({ start_date: todayStr(), start_time: '09:00', end_date: todayStr(), end_time: '10:00', reason: '' });
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
      <main style={{ flex: 1, minHeight: '100vh' }} className="sidebar-main">
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
                  <div key={day} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '14px 20px', borderBottom: di < DAYS.length - 1 ? '1px solid var(--border)' : 'none' }} className="avail-day-row">
                    <div style={{ minWidth: '100px', paddingTop: '8px', flexShrink: 0 }} className="avail-day-label">
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{day}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      {dayWins.length === 0 ? (
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', paddingTop: '8px' }}>Unavailable</span>
                      ) : (
                        windows.map((w, idx) => {
                          if (w.weekday !== di || !w.is_active) return null;
                          return (
                            <div key={w.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }} className="avail-time-row">
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
              {/* Add block form */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'flex-end' }} className="avail-block-form">
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Start date</label>
                  <input type="date" value={blockForm.start_date} onChange={(e) => setBlockForm({ ...blockForm, start_date: e.target.value })} className="field avail-block-input" style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Start time</label>
                  <TimeSelect value={blockForm.start_time} onChange={(v) => setBlockForm({ ...blockForm, start_time: v })} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>End date</label>
                  <input type="date" value={blockForm.end_date} onChange={(e) => setBlockForm({ ...blockForm, end_date: e.target.value })} className="field avail-block-input" style={{ padding: '8px 10px', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>End time</label>
                  <TimeSelect value={blockForm.end_time} onChange={(v) => setBlockForm({ ...blockForm, end_time: v })} />
                </div>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>Reason</label>
                  <input type="text" value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })} className="field" style={{ padding: '8px 10px', fontSize: '13px' }} placeholder="e.g. Lunch break, PTO" />
                </div>
                <button onClick={addBlocked} className="btn btn-primary btn-sm" style={{ marginBottom: '1px', height: '36px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '5px' }}><path d="M12 5v14M5 12h14"/></svg>
                  Block
                </button>
              </div>

              {/* Blocked list */}
              {blocked.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.4 }}>
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="8" y2="18"/><line x1="12" y1="18" x2="12" y2="18"/>
                  </svg>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 4px', fontWeight: 500 }}>No blocked times</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Use the form above to block out personal time, breaks, or days off.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {blocked.map((b) => (
                    <BlockCard key={b.id} block={b} onRemove={removeBlocked} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <style dangerouslySetInnerHTML={{ __html: `
        .avail-block-input, .avail-block-form select.field { width: 160px; }
        @media (max-width: 767px) {
          .avail-block-input, .avail-block-form select.field { width: 100% !important; }
          .avail-day-row { flex-direction: column !important; gap: 8px !important; }
          .avail-day-label { min-width: auto !important; width: 100% !important; padding-top: 0 !important; }
          .avail-time-row { flex-wrap: wrap !important; }
          .avail-time-row > select { width: calc(50% - 30px) !important; flex: 1; min-width: auto !important; }
          .avail-block-form { flex-direction: column !important; }
          .avail-block-form > div { width: 100% !important; }
          .avail-block-form .field { width: 100% !important; }
          .avail-block-form button { width: 100% !important; justify-content: center !important; }
          .avail-block-card { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .avail-block-text { white-space: normal !important; word-break: break-word !important; }
        }
      ` }} />
    </div>
  );
}

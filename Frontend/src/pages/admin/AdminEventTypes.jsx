import { useState, useEffect, useCallback } from 'react';
import { admin } from '../../api/admin';

export default function AdminEventTypes() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch = useCallback((searchVal, pageVal, activeVal) => {
    setLoading(true);
    setError('');
    admin.getEventTypes({ page: pageVal, search: searchVal, is_active: activeVal, sort: '-created_at', per_page: 15 })
      .then((res) => { setEvents(res.data.results); setTotal(res.data.total); })
      .catch(() => setError('Failed to load event types'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(search, page, isActive); }, [fetch, page, isActive]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetch(search, 1, isActive);
  };

  const toggleActive = async (ev) => {
    try {
      await admin.updateEventType({ id: ev.id, is_active: !ev.is_active });
      fetch(search, page, isActive);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to toggle event type status');
    }
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '22px', color: '#fff', margin: '0 0 20px', letterSpacing: '-0.02em' }}>Event Types <span style={{ fontSize: '14px', fontWeight: 400, color: '#7F7F8C' }}>({total})</span></h1>

      {error && <div style={{ background: '#7F1D1D', border: '1px solid #991B1B', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#FCA5A5' }}>{error}</div>}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search event name or host…" style={{ flex: 1, minWidth: '200px', padding: '9px 12px', borderRadius: '8px', background: '#1A1A1F', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none' }} />
        <select value={isActive} onChange={(e) => { setIsActive(e.target.value); setPage(1); }} style={{ padding: '9px 12px', borderRadius: '8px', background: '#1A1A1F', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none' }}>
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button type="submit" style={{ padding: '9px 16px', borderRadius: '8px', background: '#2563EB', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Search</button>
      </form>

      <div style={{ background: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A30' }}>
              {['Name', 'Host', 'Duration', 'Price', 'Bookings', 'Status', 'Created', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#7F7F8C', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#7F7F8C' }}>Loading…</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#7F7F8C' }}>No event types found</td></tr>
            ) : events.map((ev) => (
              <tr key={ev.id} style={{ borderBottom: '1px solid #2A2A30' }}>
                <td style={{ padding: '12px 14px', color: '#fff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ev.color || '#3B82F6', flexShrink: 0 }} />
                  {ev.name}
                </td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>{ev.host_username}</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>{ev.duration}m</td>
                <td style={{ padding: '12px 14px', color: ev.price ? '#F59E0B' : '#52525B', fontWeight: ev.price ? 600 : 400 }}>{ev.price ? `₹${ev.price}` : 'Free'}</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>{ev.bookings_count}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: ev.is_active ? '#064E3B' : '#451A03', color: ev.is_active ? '#6EE7B7' : '#FCD34D' }}>{ev.is_active ? 'Active' : 'Inactive'}</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA', fontSize: '12px' }}>{ev.created_at?.slice(0, 10)}</td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => toggleActive(ev)} style={{ padding: '4px 10px', borderRadius: '6px', background: ev.is_active ? '#451A03' : '#064E3B', border: 'none', color: ev.is_active ? '#FCD34D' : '#6EE7B7', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>{ev.is_active ? 'Deactivate' : 'Activate'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 15 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '8px 14px', borderRadius: '8px', background: '#1A1A1F', border: '1px solid #2A2A30', color: page <= 1 ? '#52525B' : '#fff', fontSize: '13px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <span style={{ padding: '8px 14px', color: '#7F7F8C', fontSize: '13px' }}>Page {page} of {Math.ceil(total / 15)}</span>
          <button disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(page + 1)} style={{ padding: '8px 14px', borderRadius: '8px', background: '#1A1A1F', border: '1px solid #2A2A30', color: page >= Math.ceil(total / 15) ? '#52525B' : '#fff', fontSize: '13px', cursor: page >= Math.ceil(total / 15) ? 'not-allowed' : 'pointer' }}>Next</button>
        </div>
      )}
    </div>
  );
}

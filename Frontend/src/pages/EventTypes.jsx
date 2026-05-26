import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventTypes } from '../api/client';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';

export default function EventTypes() {
  const { user } = useAuth();
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    eventTypes.getEventTypes().then((res) => setEvents(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleActive = async (id, current) => {
    try {
      await eventTypes.updateEventType(id, { is_active: !current });
      setEvents((prev) => prev.map((e) => e.id === id ? { ...e, is_active: !current } : e));
      toast(!current ? 'Event type activated' : 'Event type deactivated', 'success');
    } catch { toast('Failed to update', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event type?')) return;
    try {
      await eventTypes.deleteEventType(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      toast('Event type deleted', 'success');
    } catch { toast('Failed to delete', 'error'); }
  };

  const copyLink = (slug) => {
    navigator.clipboard.writeText(`${window.location.origin}/book/${user?.username}/${slug}`);
    setCopiedId(slug);
    toast('Link copied!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const locationIcons = {
    zoom: '📹', google_meet: '🎥', phone: '📞', in_person: '📍', custom: '🔗',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }} className="sidebar-main">
        <div className="page-content" style={{ maxWidth: '1280px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Event Types</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Create and manage the types of meetings you offer.</p>
            </div>
            <Link to="/event-types/new" className="btn btn-primary btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              New event type
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="card" style={{ padding: '24px' }}>
                  <div className="skeleton" style={{ height: '20px', width: '60%', marginBottom: '12px', borderRadius: '6px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '80%', marginBottom: '8px', borderRadius: '6px' }} />
                  <div className="skeleton" style={{ height: '14px', width: '40%', borderRadius: '6px' }} />
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="card" style={{ padding: '64px 24px', textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', background: 'var(--surface-3)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--text-muted)' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
              </div>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 8px' }}>No event types yet</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 24px' }}>Create your first event type to start accepting bookings.</p>
              <Link to="/event-types/new" className="btn btn-primary">Create event type</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {events.map((et) => (
                <div key={et.id} className="card fade-in" style={{ padding: '22px', transition: 'all 0.2s', opacity: et.is_active ? 1 : 0.6 }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
                >
                  {/* Color bar + name */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ width: '4px', height: '44px', borderRadius: '99px', background: et.color || 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{et.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{et.duration} min</span>
                        <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{locationIcons[et.location_type] || '📍'} {et.location_type.replace('_', ' ')}</span>
                        {et.price && <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>₹{et.price}</span>}
                      </div>
                    </div>
                    <label className="toggle" title={et.is_active ? 'Active — click to deactivate' : 'Inactive — click to activate'}>
                      <input type="checkbox" checked={et.is_active} onChange={() => toggleActive(et.id, et.is_active)} />
                      <div className="toggle-track" />
                      <div className="toggle-thumb" />
                    </label>
                  </div>

                  {et.description && (
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{et.description}</p>
                  )}

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px', flexWrap: 'wrap' }}>
                    <button onClick={() => copyLink(et.slug)} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', gap: '5px' }}>
                      {copiedId === et.slug
                        ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>Copied!</>
                        : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>Copy link</>
                      }
                    </button>
                    <Link to={`/event-types/${et.id}/edit`} className="btn btn-secondary btn-sm">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(et.id)} className="btn btn-danger btn-sm">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

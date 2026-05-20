import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventTypes } from '../api/client';
import Sidebar from '../components/Sidebar';
import { Plus, Copy, CopyCheck, Pencil, Trash2, CalendarDays, Clock, DollarSign, Link2 } from 'lucide-react';

export default function EventTypes() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventTypes.getEventTypes().then((res) => setEvents(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const toggleActive = async (id, current) => {
    try {
      await eventTypes.updateEventType(id, { is_active: !current });
      setEvents((prev) => prev.map((e) => e.id === id ? { ...e, is_active: !current } : e));
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event type?')) return;
    try {
      await eventTypes.deleteEventType(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {}
  };

  const copyLink = (slug) => {
    navigator.clipboard.writeText(`http://localhost:5173/book/${user?.username}/${slug}`);
    setCopiedId(slug);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
        <Sidebar />
        <div className="ml-64 p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="h-5 w-32 bg-slate-200 dark:bg-slate-600 rounded mb-3 animate-pulse" />
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded mb-2 animate-pulse" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Event Types</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your meeting types and booking links.</p>
          </div>
          <Link to="/event-types/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New event type
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="card p-12 text-center">
            <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">No event types yet</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 mb-6">Create your first event type to start accepting bookings.</p>
            <Link to="/event-types/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              Create event type
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((et) => (
              <div
                key={et.id}
                className={`bg-white dark:bg-[#1E293B] rounded-xl border p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                  et.is_active
                    ? 'border-slate-200 dark:border-slate-700'
                    : 'border-slate-100 dark:border-slate-700/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-[#1E293B] shadow-sm" style={{ backgroundColor: et.color || '#3B82F6' }} />
                  <h3 className="font-semibold text-slate-900 dark:text-white">{et.name}</h3>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{et.duration} min</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span>{et.location_type.replace('_', ' ')}</span>
                  </div>
                  {et.price && (
                    <div className="flex items-center gap-2 text-sm font-semibold text-accent">
                      <DollarSign className="w-3.5 h-3.5" />
                      ₹{et.price}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => copyLink(et.slug)}
                    className="flex-1 btn-primary text-xs py-2"
                  >
                    {copiedId === et.slug ? <CopyCheck className="w-3.5 h-3.5" /> : <Link2 className="w-3.5 h-3.5" />}
                    {copiedId === et.slug ? 'Copied!' : 'Copy link'}
                  </button>
                  <Link to={`/event-types/${et.id}/edit`} className="btn-secondary text-xs py-2 px-3">
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                  <button onClick={() => handleDelete(et.id)} className="btn-danger text-xs py-2 px-3">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer ml-auto">
                    <input type="checkbox" checked={et.is_active} onChange={() => toggleActive(et.id, et.is_active)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent" />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

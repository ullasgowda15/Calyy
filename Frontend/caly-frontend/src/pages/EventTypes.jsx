import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventTypes } from '../api/client';
import Sidebar from '../components/Sidebar';

export default function EventTypes() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    eventTypes.getEventTypes().then((res) => setEvents(res.data)).catch(() => {});
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 p-8 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Event Types</h1>
          <Link to="/event-types/new" className="bg-[#3B82F6] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">New event type</Link>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500">
            No event types yet. Create your first one!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((et) => (
              <div key={et.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: et.color || '#3B82F6' }} />
                  <h3 className="font-semibold text-gray-900">{et.name}</h3>
                </div>
                <div className="text-sm text-gray-500 space-y-1 mb-4">
                  <p>{et.duration} min — {et.location_type}</p>
                  {et.price && <p className="text-[#3B82F6] font-semibold">₹{et.price}</p>}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <button onClick={() => copyLink(et.slug)} className="bg-[#3B82F6] text-white px-3 py-1 rounded hover:bg-blue-600 transition">{copiedId === et.slug ? 'Copied!' : 'Copy link'}</button>
                  <Link to={`/event-types/${et.id}/edit`} className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 transition">Edit</Link>
                  <button onClick={() => handleDelete(et.id)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition ml-auto">Delete</button>
                  <label className="relative inline-flex items-center cursor-pointer ml-2">
                    <input type="checkbox" checked={et.is_active} onChange={() => toggleActive(et.id, et.is_active)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#3B82F6]" />
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventTypes, bookings } from '../api/client';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, upcoming: 0, active: 0 });
  const [bookingList, setBookingList] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    bookings.getMyBookings().then((res) => {
      const all = res.data;
      setBookingList(all.slice(0, 5));
      setStats((s) => ({ ...s, total: all.length, upcoming: all.filter((b) => b.status === 'confirmed').length }));
    }).catch(() => {});
    eventTypes.getEventTypes().then((res) => setStats((s) => ({ ...s, active: res.data.length }))).catch(() => {});
  }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(`http://localhost:5173/book/${user?.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookings.cancelBooking(id, '');
      setBookingList((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome back, {user?.username}</h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200"><p className="text-gray-500 text-sm">Total bookings</p><p className="text-3xl font-bold text-gray-900">{stats.total}</p></div>
            <div className="bg-white p-6 rounded-xl border border-gray-200"><p className="text-gray-500 text-sm">Upcoming</p><p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p></div>
            <div className="bg-white p-6 rounded-xl border border-gray-200"><p className="text-gray-500 text-sm">Active event types</p><p className="text-3xl font-bold text-gray-900">{stats.active}</p></div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <Link to="/event-types/new" className="bg-[#3B82F6] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">Create event type</Link>
            <Link to="/availability" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">Set availability</Link>
            <button onClick={copyLink} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
              {copied ? 'Copied!' : 'Copy booking link'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200"><h2 className="font-semibold text-gray-900">Recent bookings</h2></div>
            {bookingList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No bookings yet. Share your booking link to get started.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-left text-sm text-gray-500">
                    <tr><th className="p-4">Invitee</th><th className="p-4">Event</th><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4"></th></tr>
                  </thead>
                  <tbody>
                    {bookingList.map((b) => (
                      <tr key={b.id} className="border-t border-gray-100">
                        <td className="p-4 text-gray-900">{b.invitee_name}</td>
                        <td className="p-4 text-gray-600">{b.event_type_name}</td>
                        <td className="p-4 text-gray-600">{new Date(b.start_datetime).toLocaleDateString()}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{b.status}</span></td>
                        <td className="p-4">{b.status === 'confirmed' && <button onClick={() => handleCancel(b.id)} className="text-red-500 hover:underline text-sm">Cancel</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

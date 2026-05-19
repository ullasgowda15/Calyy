import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventTypes, bookings, payments } from '../api/client';
import { formatDateTimeUTC, formatDateLocal } from '../utils/datetime';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ total: 0, upcoming: 0, active: 0 });
  const [analytics, setAnalytics] = useState({ totalRevenue: 0, cancellationRate: 0, noShowRate: 0 });
  const [bookingList, setBookingList] = useState([]);
  const [todaysBookings, setTodaysBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = () => {
    setRefreshing(true);
    Promise.all([
      bookings.getMyBookings().then((res) => {
        const all = res.data;
        setBookingList(all.slice(0, 5));
        const today = new Date().toDateString();
        setTodaysBookings(all.filter((b) => new Date(b.start_datetime).toDateString() === today));
        setStats((s) => ({ ...s, total: all.length, upcoming: all.filter((b) => b.status === 'confirmed').length }));
        const confirmed = all.filter((b) => b.status === 'confirmed').length;
        const cancelled = all.filter((b) => b.status === 'cancelled').length;
        const noShow = all.filter((b) => b.status === 'no_show').length;
        const t = all.length || 1;
        setAnalytics({
          totalRevenue: all.filter((b) => b.payment_status === 'paid').reduce((sum, b) => sum + parseFloat(b.event_type_price || 0), 0),
          cancellationRate: ((cancelled / t) * 100).toFixed(1),
          noShowRate: ((noShow / t) * 100).toFixed(1),
        });
      }).catch(() => {}),
      eventTypes.getEventTypes().then((res) => setStats((s) => ({ ...s, active: res.data.length }))).catch(() => {}),
    ]).finally(() => setRefreshing(false));
  };

  useEffect(() => { fetchData(); }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(`http://localhost:5173/book/${user?.username}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancel = async (id, cancelToken) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookings.cancelBooking(id, cancelToken);
      setBookingList((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
      setTodaysBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
    } catch {}
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await bookings.updateBookingStatus(id, { status: newStatus });
      setBookingList((prev) => prev.map((b) => b.id === id ? { ...b, status: newStatus } : b));
      setTodaysBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: newStatus } : b));
    } catch {}
  };

  const handleRefund = async (id) => {
    if (!window.confirm('Refund this booking?')) return;
    try {
      await payments.refundBooking(id);
      setBookingList((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled', payment_status: 'refunded' } : b));
      setTodaysBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled', payment_status: 'refunded' } : b));
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200"><p className="text-gray-500 text-sm">Total revenue</p><p className="text-3xl font-bold text-green-600">${analytics.totalRevenue.toFixed(2)}</p></div>
            <div className="bg-white p-6 rounded-xl border border-gray-200"><p className="text-gray-500 text-sm">Cancellation rate</p><p className="text-3xl font-bold text-red-600">{analytics.cancellationRate}%</p></div>
            <div className="bg-white p-6 rounded-xl border border-gray-200"><p className="text-gray-500 text-sm">No-show rate</p><p className="text-3xl font-bold text-orange-600">{analytics.noShowRate}%</p></div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <Link to="/event-types/new" className="bg-[#3B82F6] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">Create event type</Link>
            <Link to="/availability" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">Set availability</Link>
            <button onClick={copyLink} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">Copy booking link</button>
            <button onClick={fetchData} disabled={refreshing} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center gap-1">
              <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition ml-auto">Logout</button>
          </div>

          {todaysBookings.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 mb-8">
              <div className="p-4 border-b border-gray-200"><h2 className="font-semibold text-gray-900">Today's Schedule</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-left text-sm text-gray-500">
                    <tr><th className="p-4">Time</th><th className="p-4">Invitee</th><th className="p-4">Event</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
                  </thead>
                  <tbody>
                    {todaysBookings.map((b) => (
                      <tr key={b.id} className="border-t border-gray-100">
                        <td className="p-4 text-gray-900">{formatDateTimeUTC(b.start_datetime, user?.timezone || 'UTC')}</td>
                        <td className="p-4 text-gray-600">{b.invitee_name}</td>
                        <td className="p-4 text-gray-600">{b.event_type_name}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : b.status === 'no_show' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{b.status}</span></td>
                        <td className="p-4 flex gap-2">
                          {b.status === 'confirmed' && (
                            <>
                              <button onClick={() => handleStatusUpdate(b.id, 'completed')} className="text-green-500 hover:underline text-sm">Complete</button>
                              <button onClick={() => handleStatusUpdate(b.id, 'no_show')} className="text-orange-500 hover:underline text-sm">No-show</button>
                              {b.payment_status === 'paid' && <button onClick={() => handleRefund(b.id)} className="text-yellow-500 hover:underline text-sm">Refund</button>}
                              <button onClick={() => handleCancel(b.id, b.cancel_token)} className="text-red-500 hover:underline text-sm">Cancel</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200"><h2 className="font-semibold text-gray-900">Recent bookings</h2></div>
            {bookingList.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No bookings yet. Share your booking link to get started.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-left text-sm text-gray-500">
                    <tr><th className="p-4">Invitee</th><th className="p-4">Event</th><th className="p-4">Date</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
                  </thead>
                  <tbody>
                    {bookingList.map((b) => (
                      <tr key={b.id} className="border-t border-gray-100">
                        <td className="p-4 text-gray-900">{b.invitee_name}</td>
                        <td className="p-4 text-gray-600">{b.event_type_name}</td>
                        <td className="p-4 text-gray-600">{formatDateLocal(b.start_datetime)}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : b.status === 'no_show' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{b.status}</span></td>
                        <td className="p-4 flex gap-2">
                          {b.status === 'confirmed' && (
                            <>
                              <button onClick={() => handleStatusUpdate(b.id, 'completed')} className="text-green-500 hover:underline text-sm">Complete</button>
                              <button onClick={() => handleStatusUpdate(b.id, 'no_show')} className="text-orange-500 hover:underline text-sm">No-show</button>
                              {b.payment_status === 'paid' && <button onClick={() => handleRefund(b.id)} className="text-yellow-500 hover:underline text-sm">Refund</button>}
                              <button onClick={() => handleCancel(b.id, b.cancel_token)} className="text-red-500 hover:underline text-sm">Cancel</button>
                            </>
                          )}
                        </td>
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

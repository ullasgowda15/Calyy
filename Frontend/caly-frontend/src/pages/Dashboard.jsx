import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventTypes, bookings, payments, integrations } from '../api/client';
import { formatDateTimeUTC, formatDateLocal, formatTimeLocal } from '../utils/datetime';
import Sidebar from '../components/Sidebar';

const FILTERABLE_STATUSES = ['', 'confirmed', 'pending', 'completed', 'cancelled', 'no_show'];

function FilterInput({ value, onChange, placeholder }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#3B82F6] outline-none bg-white"
    />
  );
}

function StatusFilter({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-[#3B82F6] outline-none bg-white"
    >
      {FILTERABLE_STATUSES.map((s) => (
        <option key={s} value={s}>{s || 'All'}</option>
      ))}
    </select>
  );
}

function ActionButton({ onClick, color, label }) {
  const colors = {
    green: 'bg-green-500 hover:bg-green-600 text-white',
    orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    yellow: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
  };
  return (
    <button onClick={onClick} className={`px-2 py-1 rounded text-xs font-medium ${colors[color] || color}`}>
      {label}
    </button>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ total: 0, upcoming: 0, active: 0 });
  const [analytics, setAnalytics] = useState({ totalRevenue: 0, cancellationRate: 0, noShowRate: 0 });
  const [allBookings, setAllBookings] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(true);

  const [recentFilters, setRecentFilters] = useState({ invitee: '', event: '', date: '', time: '', status: '' });
  const [todayFilters, setTodayFilters] = useState({ time: '', invitee: '', event: '', status: '' });

  useEffect(() => {
    integrations.getGoogleStatus().then((res) => setGoogleConnected(res.data.connected)).catch(() => {});
  }, []);

  const fetchData = () => {
    setRefreshing(true);
    Promise.all([
      bookings.getMyBookings().then((res) => {
        const all = res.data;
        setAllBookings(all);
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

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todaysBookings = useMemo(() =>
    allBookings.filter((b) => b.start_datetime.startsWith(today)),
    [allBookings, today]
  );

  const bookingList = useMemo(() =>
    allBookings.slice(0, 50),
    [allBookings]
  );

  const filteredToday = useMemo(() =>
    todaysBookings.filter((b) => {
      if (todayFilters.time && !formatTimeLocal(t, user?.timezone).toLowerCase().includes(todayFilters.time.toLowerCase())) return false;
      if (todayFilters.invitee && !(b.invitee_name || '').toLowerCase().includes(todayFilters.invitee.toLowerCase())) return false;
      if (todayFilters.event && !(b.event_type_name || '').toLowerCase().includes(todayFilters.event.toLowerCase())) return false;
      if (todayFilters.status && b.status !== todayFilters.status) return false;
      return true;
    }),
    [todaysBookings, todayFilters, user]
  );

  const filteredRecent = useMemo(() =>
    bookingList.filter((b) => {
      if (recentFilters.invitee && !(b.invitee_name || '').toLowerCase().includes(recentFilters.invitee.toLowerCase())) return false;
      if (recentFilters.event && !(b.event_type_name || '').toLowerCase().includes(recentFilters.event.toLowerCase())) return false;
      if (recentFilters.date && !formatDateLocal(b.start_datetime, user?.timezone).toLowerCase().includes(recentFilters.date.toLowerCase())) return false;
      if (recentFilters.time && !formatTimeLocal(b.start_datetime, user?.timezone).toLowerCase().includes(recentFilters.time.toLowerCase())) return false;
      if (recentFilters.status && b.status !== recentFilters.status) return false;
      return true;
    }),
    [bookingList, recentFilters, user]
  );

  const copyLink = () => {
    navigator.clipboard.writeText(`http://localhost:5173/book/${user?.username}`);
  };

  const handleCancel = async (id, cancelToken) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await bookings.cancelBooking(id, cancelToken);
      setAllBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
    } catch {}
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await bookings.updateBookingStatus(id, { status: newStatus });
      setAllBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: newStatus } : b));
    } catch {}
  };

  const handleRefund = async (id) => {
    if (!window.confirm('Refund this booking?')) return;
    try {
      await payments.refundBooking(id);
      setAllBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled', payment_status: 'refunded' } : b));
    } catch {}
  };

  const setRecentFilter = (key) => (val) => setRecentFilters((f) => ({ ...f, [key]: val }));
  const setTodayFilter = (key) => (val) => setTodayFilters((f) => ({ ...f, [key]: val }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 p-8 min-h-screen">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Welcome back, {user?.username}</h1>

          {!googleConnected && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between">
              <p className="text-sm text-yellow-800">Connect Google Calendar to sync your bookings and check availability conflicts.</p>
              <Link to="/settings" className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition whitespace-nowrap">Connect</Link>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200"><p className="text-gray-500 text-sm">Total bookings</p><p className="text-3xl font-bold text-gray-900">{stats.total}</p></div>
            <div className="bg-white p-6 rounded-xl border border-gray-200"><p className="text-gray-500 text-sm">Upcoming</p><p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p></div>
            <div className="bg-white p-6 rounded-xl border border-gray-200"><p className="text-gray-500 text-sm">Active event types</p><p className="text-3xl font-bold text-gray-900">{stats.active}</p></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200"><p className="text-gray-500 text-sm">Total revenue</p><p className="text-3xl font-bold text-green-600">₹{analytics.totalRevenue.toFixed(2)}</p></div>
            <div className="bg-white p-6 rounded-xl border border-gray-200"><p className="text-gray-500 text-sm">Cancellation rate</p><p className="text-3xl font-bold text-red-600">{analytics.cancellationRate}%</p></div>
            <div className="bg-white p-6 rounded-xl border border-gray-200"><p className="text-gray-500 text-sm">No-show rate</p><p className="text-3xl font-bold text-orange-600">{analytics.noShowRate}%</p></div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            <Link to="/event-types/new" className="bg-[#3B82F6] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">Create event type</Link>
            <Link to="/availability" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">Set availability</Link>
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
                  <thead className="bg-gray-50 text-left text-xs text-gray-500">
                    <tr>
                      <th className="p-2 pb-0 font-medium">Time</th>
                      <th className="p-2 pb-0 font-medium">Invitee</th>
                      <th className="p-2 pb-0 font-medium">Event</th>
                      <th className="p-2 pb-0 font-medium">Status</th>
                      <th className="p-2 pb-0 font-medium">Actions</th>
                    </tr>
                    <tr>
                      <th className="p-1 px-2"><FilterInput value={todayFilters.time} onChange={setTodayFilter('time')} placeholder="Filter time…" /></th>
                      <th className="p-1 px-2"><FilterInput value={todayFilters.invitee} onChange={setTodayFilter('invitee')} placeholder="Filter invitee…" /></th>
                      <th className="p-1 px-2"><FilterInput value={todayFilters.event} onChange={setTodayFilter('event')} placeholder="Filter event…" /></th>
                      <th className="p-1 px-2"><StatusFilter value={todayFilters.status} onChange={setTodayFilter('status')} /></th>
                      <th className="p-1 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredToday.map((b) => (
                      <tr key={b.id} className="border-t border-gray-100">
                        <td className="p-4 text-gray-900">{formatDateTimeUTC(b.start_datetime, user?.timezone || 'UTC')}</td>
                        <td className="p-4 text-gray-600">{b.invitee_name}</td>
                        <td className="p-4 text-gray-600">{b.event_type_name}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : b.status === 'no_show' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{b.status}</span></td>
                        <td className="p-4">
                          <div className="flex gap-1.5 flex-wrap">
                            {b.status === 'confirmed' && (
                              <>
                                <ActionButton onClick={() => handleStatusUpdate(b.id, 'completed')} color="green" label="Complete" />
                                <ActionButton onClick={() => handleStatusUpdate(b.id, 'no_show')} color="orange" label="No-show" />
                                {b.payment_status === 'paid' && <ActionButton onClick={() => handleRefund(b.id)} color="yellow" label="Refund" />}
                                <ActionButton onClick={() => handleCancel(b.id, b.cancel_token)} color="red" label="Cancel" />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredToday.length === 0 && (
                      <tr><td colSpan={5} className="p-4 text-center text-gray-400 text-sm">No matches</td></tr>
                    )}
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
                  <thead className="bg-gray-50 text-left text-xs text-gray-500">
                    <tr>
                      <th className="p-2 pb-0 font-medium">Invitee</th>
                      <th className="p-2 pb-0 font-medium">Event</th>
                      <th className="p-2 pb-0 font-medium">Date</th>
                      <th className="p-2 pb-0 font-medium">Time</th>
                      <th className="p-2 pb-0 font-medium">Status</th>
                      <th className="p-2 pb-0 font-medium">Actions</th>
                    </tr>
                    <tr>
                      <th className="p-1 px-2"><FilterInput value={recentFilters.invitee} onChange={setRecentFilter('invitee')} placeholder="Filter invitee…" /></th>
                      <th className="p-1 px-2"><FilterInput value={recentFilters.event} onChange={setRecentFilter('event')} placeholder="Filter event…" /></th>
                      <th className="p-1 px-2"><FilterInput value={recentFilters.date} onChange={setRecentFilter('date')} placeholder="Filter date…" /></th>
                      <th className="p-1 px-2"><FilterInput value={recentFilters.time} onChange={setRecentFilter('time')} placeholder="Filter time…" /></th>
                      <th className="p-1 px-2"><StatusFilter value={recentFilters.status} onChange={setRecentFilter('status')} /></th>
                      <th className="p-1 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecent.map((b) => (
                      <tr key={b.id} className="border-t border-gray-100">
                        <td className="p-4 text-gray-900">{b.invitee_name}</td>
                        <td className="p-4 text-gray-600">{b.event_type_name}</td>
                        <td className="p-4 text-gray-600">{formatDateLocal(b.start_datetime, user?.timezone)}</td>
                        <td className="p-4 text-gray-600">{formatTimeLocal(b.start_datetime, user?.timezone)}</td>
                        <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : b.status === 'completed' ? 'bg-blue-100 text-blue-700' : b.status === 'no_show' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>{b.status}</span></td>
                        <td className="p-4">
                          <div className="flex gap-1.5 flex-wrap">
                            {b.status === 'confirmed' && (
                              <>
                                <ActionButton onClick={() => handleStatusUpdate(b.id, 'completed')} color="green" label="Complete" />
                                <ActionButton onClick={() => handleStatusUpdate(b.id, 'no_show')} color="orange" label="No-show" />
                                {b.payment_status === 'paid' && <ActionButton onClick={() => handleRefund(b.id)} color="yellow" label="Refund" />}
                                <ActionButton onClick={() => handleCancel(b.id, b.cancel_token)} color="red" label="Cancel" />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRecent.length === 0 && (
                      <tr><td colSpan={6} className="p-4 text-center text-gray-400 text-sm">No matches</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

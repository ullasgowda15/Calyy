import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventTypes, bookings, payments, integrations } from '../api/client';
import { formatDateTimeUTC, formatDateLocal, formatTimeLocal } from '../utils/datetime';
import Sidebar from '../components/Sidebar';
import {
  Calendar, TrendingUp, Users, DollarSign, AlertTriangle, Eye,
  CheckCircle, XCircle, Clock, RefreshCw, Plus, CalendarDays,
} from 'lucide-react';

const FILTERABLE_STATUSES = ['', 'confirmed', 'pending', 'completed', 'cancelled', 'no_show'];

function StatusBadge({ status }) {
  const styles = {
    confirmed: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30',
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/30',
    completed: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30',
    cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30',
    no_show: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30'}`}>
      {status}
    </span>
  );
}

function ActionButton({ onClick, variant = 'default', label }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600',
    success: 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20',
    warning: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:hover:bg-yellow-500/20',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20',
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${variants[variant]}`}
    >
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
  const [loading, setLoading] = useState(true);

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
    ]).finally(() => {
      setRefreshing(false);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todaysBookings = useMemo(() =>
    allBookings.filter((b) => b.start_datetime.startsWith(today)),
    [allBookings, today]
  );

  const bookingList = useMemo(() => allBookings.slice(0, 50), [allBookings]);

  const filteredToday = useMemo(() =>
    todaysBookings.filter((b) => {
      if (todayFilters.time && !formatTimeLocal(b.start_datetime, user?.timezone).toLowerCase().includes(todayFilters.time.toLowerCase())) return false;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
        <Sidebar />
        <div className="ml-64 p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-600 rounded mb-3 animate-pulse" />
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const filterInputClass = "w-full px-2 py-1 text-xs border border-slate-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-accent outline-none bg-white dark:bg-[#1E293B] dark:text-slate-300";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
      <Sidebar />
      <main className="ml-64 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {user?.username}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Here&apos;s what&apos;s happening with your schedule today.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="btn-secondary flex items-center gap-1.5"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button onClick={logout} className="btn-danger">Logout</button>
          </div>
        </div>

        {!googleConnected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8 flex items-center justify-between dark:bg-yellow-500/10 dark:border-yellow-500/30">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-800 dark:text-yellow-300">Connect Google Calendar to sync your bookings and check availability conflicts.</p>
            </div>
            <Link to="/settings" className="btn-primary text-sm">Connect</Link>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total bookings</p>
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Upcoming</p>
              <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.upcoming}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active event types</p>
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total revenue</p>
              <div className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">₹{analytics.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cancellation rate</p>
              <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 rounded-xl flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">{analytics.cancellationRate}%</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No-show rate</p>
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Eye className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{analytics.noShowRate}%</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <Link to="/event-types/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Create event type
          </Link>
          <Link to="/availability" className="btn-secondary">Set availability</Link>
        </div>

        {todaysBookings.length > 0 && (
          <div className="card mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <h2 className="font-semibold text-slate-900 dark:text-white">Today&apos;s Schedule</h2>
                <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                  {filteredToday.length}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invitee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="px-6 py-2"><input value={todayFilters.time} onChange={(e) => setTodayFilter('time')(e.target.value)} placeholder="Filter time…" className={filterInputClass} /></th>
                    <th className="px-6 py-2"><input value={todayFilters.invitee} onChange={(e) => setTodayFilter('invitee')(e.target.value)} placeholder="Filter invitee…" className={filterInputClass} /></th>
                    <th className="px-6 py-2"><input value={todayFilters.event} onChange={(e) => setTodayFilter('event')(e.target.value)} placeholder="Filter event…" className={filterInputClass} /></th>
                    <th className="px-6 py-2">
                      <select value={todayFilters.status} onChange={(e) => setTodayFilter('status')(e.target.value)} className={filterInputClass}>
                        {FILTERABLE_STATUSES.map((s) => <option key={s} value={s}>{s || 'All'}</option>)}
                      </select>
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredToday.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{formatDateTimeUTC(b.start_datetime, user?.timezone || 'UTC')}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{b.invitee_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{b.event_type_name}</td>
                      <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {b.status === 'confirmed' && (
                            <>
                              <ActionButton onClick={() => handleStatusUpdate(b.id, 'completed')} variant="success" label="Complete" />
                              <ActionButton onClick={() => handleStatusUpdate(b.id, 'no_show')} variant="warning" label="No-show" />
                              {b.payment_status === 'paid' && <ActionButton onClick={() => handleRefund(b.id)} variant="warning" label="Refund" />}
                              <ActionButton onClick={() => handleCancel(b.id, b.cancel_token)} variant="danger" label="Cancel" />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredToday.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">No matches</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-slate-400" />
              <h2 className="font-semibold text-slate-900 dark:text-white">Recent bookings</h2>
              <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-medium">
                {filteredRecent.length}
              </span>
            </div>
          </div>
          {bookingList.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No bookings yet</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Share your booking link to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Invitee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="px-6 py-2"><input value={recentFilters.invitee} onChange={(e) => setRecentFilter('invitee')(e.target.value)} placeholder="Filter invitee…" className={filterInputClass} /></th>
                    <th className="px-6 py-2"><input value={recentFilters.event} onChange={(e) => setRecentFilter('event')(e.target.value)} placeholder="Filter event…" className={filterInputClass} /></th>
                    <th className="px-6 py-2"><input value={recentFilters.date} onChange={(e) => setRecentFilter('date')(e.target.value)} placeholder="Filter date…" className={filterInputClass} /></th>
                    <th className="px-6 py-2"><input value={recentFilters.time} onChange={(e) => setRecentFilter('time')(e.target.value)} placeholder="Filter time…" className={filterInputClass} /></th>
                    <th className="px-6 py-2">
                      <select value={recentFilters.status} onChange={(e) => setRecentFilter('status')(e.target.value)} className={filterInputClass}>
                        {FILTERABLE_STATUSES.map((s) => <option key={s} value={s}>{s || 'All'}</option>)}
                      </select>
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredRecent.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{b.invitee_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{b.event_type_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatDateLocal(b.start_datetime, user?.timezone)}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{formatTimeLocal(b.start_datetime, user?.timezone)}</td>
                      <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {b.status === 'confirmed' && (
                            <>
                              <ActionButton onClick={() => handleStatusUpdate(b.id, 'completed')} variant="success" label="Complete" />
                              <ActionButton onClick={() => handleStatusUpdate(b.id, 'no_show')} variant="warning" label="No-show" />
                              {b.payment_status === 'paid' && <ActionButton onClick={() => handleRefund(b.id)} variant="warning" label="Refund" />}
                              <ActionButton onClick={() => handleCancel(b.id, b.cancel_token)} variant="danger" label="Cancel" />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredRecent.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">No matches</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

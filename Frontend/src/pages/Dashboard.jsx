import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventTypes, bookings, payments, integrations } from '../api/client';
import { formatDateTimeUTC, formatDateLocal, formatTimeLocal, resolveTimezone } from '../utils/datetime';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

const FILTERABLE_STATUSES = ['', 'confirmed', 'pending', 'completed', 'cancelled', 'no_show'];
const PER_PAGE = 5;

function StatusBadge({ status }) {
  const map = { confirmed: 'badge-green', cancelled: 'badge-red', completed: 'badge-blue', no_show: 'badge-orange', pending: 'badge-gray' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status?.replace('_', ' ')}</span>;
}

function Skeleton({ w = '100%', h = '16px', style = {} }) {
  return <div className="skeleton" style={{ width: w, height: h, ...style }} />;
}

const isMeetingOver = (b) => {
  if (!b.start_datetime) return false;
  const end = new Date(b.start_datetime).getTime() + (b.event_type_duration || 0) * 60 * 1000;
  return Date.now() > end;
};

function PaginationBtn({ page, totalPages, goToPage }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="btn btn-ghost btn-sm" style={{ opacity: page <= 1 ? 0.4 : 1 }}>{'← Prev'}</button>
      {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
        const pg = i + 1;
        return (
          <button key={pg} onClick={() => goToPage(pg)} style={{
            width: '30px', height: '30px', borderRadius: '6px', border: pg === page ? 'none' : '1px solid var(--border)',
            background: pg === page ? 'var(--accent)' : 'var(--surface)', color: pg === page ? '#fff' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.1s',
          }}>{pg}</button>
        );
      })}
      <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="btn btn-ghost btn-sm" style={{ opacity: page >= totalPages ? 0.4 : 1 }}>{'Next \u2192'}</button>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ total: 0, upcoming: 0, active: 0 });
  const [analytics, setAnalytics] = useState({ totalRevenue: 0, cancellationRate: 0, noShowRate: 0 });
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(true);
  const [todayFilters, setTodayFilters] = useState({ time: '', invitee: '', event: '', status: '' });
  const [upcomingFilters, setUpcomingFilters] = useState({ invitee: '', event: '', date: '', status: '' });
  const [pastFilters, setPastFilters] = useState({ status: '' });
  const [todayPage, setTodayPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [cancelModal, setCancelModal] = useState({ show: false, id: null, cancelToken: '', reason: '' });
  const [refundModal, setRefundModal] = useState({ show: false, id: null });
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '' });
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('caly-onboarding-dismissed'));
  const [subStatus, setSubStatus] = useState(null);

  useEffect(() => {
    integrations.getGoogleStatus().then((res) => setGoogleConnected(res.data.connected)).catch(() => {});
    payments.getSubscriptionStatus().then((res) => setSubStatus(res.data)).catch(() => {});
  }, []);

  const fetchData = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    Promise.all([
      bookings.getMyBookings().then((res) => {
        const all = res.data;
        setAllBookings(all);
        const confirmed = all.filter((b) => b.status === 'confirmed').length;
        const cancelled = all.filter((b) => b.status === 'cancelled').length;
        const noShow = all.filter((b) => b.status === 'no_show').length;
        const t = all.length || 1;
        setStats((s) => ({ ...s, total: all.length, upcoming: confirmed }));
        setAnalytics({
          totalRevenue: all.filter((b) => b.payment_status === 'paid').reduce((sum, b) => sum + parseFloat(b.event_type_price || 0), 0),
          cancellationRate: ((cancelled / t) * 100).toFixed(1),
          noShowRate: ((noShow / t) * 100).toFixed(1),
        });
      }),
      eventTypes.getEventTypes().then((res) => setStats((s) => ({ ...s, active: res.data.length }))),
    ]).catch(() => {}).finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!loading && allBookings.length === 0 && stats.active === 0) {
      setShowOnboarding(true);
    }
  }, [loading, allBookings, stats.active]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const todaysBookings = useMemo(() => allBookings.filter((b) => b.start_datetime.startsWith(today)), [allBookings, today]);
  const upcomingBookings = useMemo(() => allBookings.filter((b) => {
    const bd = b.start_datetime.split('T')[0];
    return bd > today;
  }), [allBookings, today]);
  const pastBookings = useMemo(() => allBookings.filter((b) => {
    const bd = b.start_datetime.split('T')[0];
    return bd < today;
  }), [allBookings, today]);

  const filteredToday = useMemo(() =>
    todaysBookings.filter((b) => {
      if (todayFilters.invitee && !(b.invitee_name || '').toLowerCase().includes(todayFilters.invitee.toLowerCase())) return false;
      if (todayFilters.event && !(b.event_type_name || '').toLowerCase().includes(todayFilters.event.toLowerCase())) return false;
      if (todayFilters.status && b.status !== todayFilters.status) return false;
      return true;
    }), [todaysBookings, todayFilters]);

  const filteredUpcoming = useMemo(() =>
    upcomingBookings.filter((b) => {
      if (upcomingFilters.invitee && !(b.invitee_name || '').toLowerCase().includes(upcomingFilters.invitee.toLowerCase())) return false;
      if (upcomingFilters.event && !(b.event_type_name || '').toLowerCase().includes(upcomingFilters.event.toLowerCase())) return false;
      if (upcomingFilters.date && !formatDateLocal(b.start_datetime, user?.timezone).toLowerCase().includes(upcomingFilters.date.toLowerCase())) return false;
      if (upcomingFilters.status && b.status !== upcomingFilters.status) return false;
      return true;
    }), [upcomingBookings, upcomingFilters, user]);

  const filteredPast = useMemo(() =>
    pastBookings.filter((b) => {
      if (pastFilters.status && b.status !== pastFilters.status) return false;
      return true;
    }), [pastBookings, pastFilters]);

  const todayTotalPages = Math.max(1, Math.ceil(filteredToday.length / PER_PAGE));
  const todayPaginated = filteredToday.slice((todayPage - 1) * PER_PAGE, todayPage * PER_PAGE);
  const goToTodayPage = (p) => setTodayPage(Math.max(1, Math.min(p, todayTotalPages)));

  const upcomingTotalPages = Math.max(1, Math.ceil(filteredUpcoming.length / PER_PAGE));
  const upcomingPaginated = filteredUpcoming.slice((upcomingPage - 1) * PER_PAGE, upcomingPage * PER_PAGE);
  const goToUpcomingPage = (p) => setUpcomingPage(Math.max(1, Math.min(p, upcomingTotalPages)));

  const pastTotalPages = Math.max(1, Math.ceil(filteredPast.length / PER_PAGE));
  const pastPaginated = filteredPast.slice((pastPage - 1) * PER_PAGE, pastPage * PER_PAGE);
  const goToPastPage = (p) => setPastPage(Math.max(1, Math.min(p, pastTotalPages)));

  useEffect(() => { setTodayPage(1); }, [todayFilters]);
  useEffect(() => { setUpcomingPage(1); }, [upcomingFilters]);
  useEffect(() => { setPastPage(1); }, [pastFilters]);

  const pastAnalytics = useMemo(() => {
    const total = pastBookings.length;
    const completed = pastBookings.filter(b => b.status === 'completed').length;
    const cancelled = pastBookings.filter(b => b.status === 'cancelled').length;
    const noShow = pastBookings.filter(b => b.status === 'no_show').length;
    const paidRevenue = pastBookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + parseFloat(b.event_type_price || 0), 0);
    const nonPending = total - pastBookings.filter(b => b.status === 'pending').length;
    return {
      total, completed, cancelled, noShow,
      paidRevenue,
      completionRate: nonPending > 0 ? ((completed / nonPending) * 100).toFixed(1) : '0.0',
    };
  }, [pastBookings]);

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/book/${user?.username}`);
    toast('Booking link copied!', 'success');
  };

  const handleCancel = (id, cancelToken) => {
    setCancelModal({ show: true, id, cancelToken, reason: '' });
  };

  const handleHostCancel = (id) => {
    setCancelModal({ show: true, id, cancelToken: '', reason: '', isHost: true });
  };

  const confirmCancel = async () => {
    const { id, cancelToken, reason, isHost } = cancelModal;
    try {
      if (isHost) {
        await bookings.hostCancelBooking(id, { reason });
      } else {
        await bookings.cancelBooking(id, cancelToken, { reason });
      }
      setAllBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast(reason ? 'Booking cancelled. Invitee notified with your reason.' : 'Booking cancelled', 'info');
    } catch { toast('Failed to cancel booking', 'error'); }
    setCancelModal({ show: false, id: null, cancelToken: '', reason: '', isHost: false });
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await bookings.updateBookingStatus(id, { status: newStatus });
      setAllBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: newStatus } : b));
      toast(`Marked as ${newStatus.replace('_',' ')}`, 'success');
    } catch { toast('Failed to update status', 'error'); }
  };

  const handleRefund = (id) => {
    setRefundModal({ show: true, id });
  };

  const confirmRefund = async () => {
    const { id } = refundModal;
    try {
      await payments.refundBooking(id);
      setAllBookings((prev) => prev.map((b) => b.id === id ? { ...b, status: 'cancelled', payment_status: 'refunded' } : b));
      toast('Refund processed', 'success');
    } catch { toast('Failed to process refund', 'error'); }
    setRefundModal({ show: false, id: null });
  };

  const statItems = [
    { label: 'Total bookings', value: stats.total, color: 'var(--accent)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
    { label: 'Upcoming', value: stats.upcoming, color: 'var(--success)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
    { label: 'Active event types', value: stats.active, color: 'var(--accent)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> },
    { label: 'Total revenue', value: `\u20B9${analytics.totalRevenue.toFixed(2)}`, color: 'var(--success)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
    { label: 'Cancellation rate', value: `${analytics.cancellationRate}%`, color: 'var(--danger)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
    { label: 'No-show rate', value: `${analytics.noShowRate}%`, color: 'var(--warning)', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg> },
  ];

  const pastStatItems = [
    { label: 'Past bookings', value: pastAnalytics.total, color: 'var(--accent)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
    { label: 'Completed', value: pastAnalytics.completed, color: 'var(--success)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg> },
    { label: 'Cancelled', value: pastAnalytics.cancelled, color: 'var(--danger)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> },
    { label: 'No-show', value: pastAnalytics.noShow, color: 'var(--warning)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> },
    { label: 'Revenue', value: `\u20B9${pastAnalytics.paidRevenue.toFixed(2)}`, color: 'var(--success)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
    { label: 'Completion rate', value: `${pastAnalytics.completionRate}%`, color: 'var(--accent)', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
  ];

  const mainContent = (
    <div className="page-content" style={{ maxWidth: '1280px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.username} {'\uD83D\uDC4B'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Here's what's happening with your bookings today.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={copyLink} className="btn btn-ghost btn-sm" style={{ gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
            Copy booking link
          </button>
          <Link to="/event-types/new" className="btn btn-primary btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            New event type
          </Link>
          <button onClick={() => fetchData(true)} disabled={refreshing} className="btn btn-secondary btn-sm">
            <svg className={refreshing ? 'spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            {refreshing ? 'Refreshing\u2026' : 'Refresh'}
          </button>
        </div>
      </div>

      {subStatus && !subStatus.is_subscribed && (
        <div style={{ background: 'var(--surface-error)', border: '1.5px solid var(--border-error)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <p style={{ fontSize: '13px', color: 'var(--text-error)', flex: 1, margin: 0 }}>Your subscription has expired — booking links are disabled. <Link to="/settings" style={{ color: 'var(--text-error)', fontWeight: 600 }}>Resubscribe</Link> to re-enable them.</p>
        </div>
      )}
      {subStatus && subStatus.is_subscribed && subStatus.subscription_status === 'free_trial' && subStatus.trial_ends_at && new Date(subStatus.trial_ends_at) > new Date() && (
        <div style={{ background: 'var(--surface-info)', border: '1.5px solid var(--border-info)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <p style={{ fontSize: '13px', color: 'var(--text-info)', flex: 1, margin: 0 }}>
            Free trial ends {new Date(subStatus.trial_ends_at).toLocaleDateString()} — <Link to="/settings" style={{ color: 'var(--text-info)', fontWeight: 600 }}>subscribe</Link> to keep your booking links active.
          </p>
        </div>
      )}
      {subStatus && subStatus.is_subscribed && subStatus.subscription_status === 'active' && subStatus?.subscribed_until && (() => {
        const daysLeft = Math.ceil((new Date(subStatus.subscribed_until) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= 14) {
          return (
            <div style={{ background: 'var(--surface-info)', border: '1.5px solid var(--border-info)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <p style={{ fontSize: '13px', color: 'var(--text-info)', flex: 1, margin: 0 }}>
                Your subscription ends in {daysLeft} day{daysLeft > 1 ? 's' : ''} — <Link to="/settings" style={{ color: 'var(--text-info)', fontWeight: 600 }}>renew</Link> to avoid interruption.
              </p>
            </div>
          );
        }
        return null;
      })()}
      {!googleConnected && (
        <div style={{ background: 'var(--surface-info)', border: '1.5px solid var(--border-info)', borderRadius: '12px', padding: '14px 18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p style={{ fontSize: '13px', color: 'var(--text-info)', flex: 1, margin: 0 }}>Connect Google Calendar to sync bookings and check for conflicts automatically.</p>
          <Link to="/settings" className="btn btn-sm" style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)', fontWeight: 600 }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-2)'}>Connect</Link>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="stat-card"><Skeleton h="12px" w="60%" /><Skeleton h="32px" w="50%" style={{ marginTop: '8px' }} /></div>
        )) : statItems.map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">{s.label}</span>
              <div style={{ color: s.color, opacity: 0.6 }}>{s.icon}</div>
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Onboarding */}
      {showOnboarding && !loading && (
        <div className="card" style={{ marginBottom: '20px', overflow: 'hidden', background: 'var(--surface)', border: '1.5px solid var(--border)', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent)' }} />
          <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '44px', height: '44px', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', margin: '0 0 2px' }}>Welcome to YourCaly!</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0' }}>Create your first event type so people can book time with you.</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Link to="/event-types/new" className="btn btn-primary btn-sm">Create event type</Link>
              <Link to="/availability" className="btn btn-ghost btn-sm">Set availability</Link>
              <button onClick={() => { localStorage.setItem('caly-onboarding-dismissed', '1'); setShowOnboarding(false); }} className="btn btn-ghost btn-sm" style={{ opacity: 0.6 }}>Dismiss</button>
            </div>
          </div>
        </div>
      )}

      {/* Today's schedule */}
      {(todaysBookings.length > 0 || loading) && (
        <div className="card" style={{ marginBottom: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }} className="pulse-dot" />
              <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>Today's Schedule</h2>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '3px 10px', borderRadius: '99px' }}>{todaysBookings.length} {todaysBookings.length === 1 ? 'booking' : 'bookings'}</span>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
            {[['invitee','Invitee'],['event','Event'],['status','Status (select)']].map(([key, ph]) =>
              key === 'status' ? (
                <select key={key} value={todayFilters[key]} onChange={(e) => setTodayFilters(f => ({...f, [key]: e.target.value}))} className="field" style={{ width: '140px', padding: '7px 10px', fontSize: '12px' }}>
                  {FILTERABLE_STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
                </select>
              ) : (
                <input key={key} value={todayFilters[key]} onChange={(e) => setTodayFilters(f => ({...f, [key]: e.target.value}))} placeholder={`Filter ${ph}\u2026`} className="field" style={{ width: '150px', padding: '7px 10px', fontSize: '12px' }} />
              )
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Time</th><th>Invitee</th><th>Event</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {todayPaginated.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatDateTimeUTC(b.start_datetime, resolveTimezone(user?.timezone))}</td>
                    <td>{b.invitee_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{b.event_type_name}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate(`/booking/${b.id}`)} className="btn btn-sm" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '11px' }}>View</button>
                        {b.status === 'confirmed' && (
                          <>
                            {isMeetingOver(b) && <button onClick={() => handleStatusUpdate(b.id, 'completed')} className="btn btn-sm" style={{ background: 'var(--surface-success)', color: 'var(--text-success)', border: '1px solid var(--border-success)', fontSize: '11px' }}>Complete</button>}
                            {isMeetingOver(b) && <button onClick={() => handleStatusUpdate(b.id, 'no_show')} className="btn btn-sm" style={{ background: 'var(--surface-warning)', color: 'var(--text-warning)', border: '1px solid var(--border-warning)', fontSize: '11px' }}>No-show</button>}
                            {b.payment_status === 'paid' && <button onClick={() => handleRefund(b.id)} className="btn btn-sm" style={{ background: 'var(--surface-info)', color: 'var(--text-info)', border: '1px solid var(--border-info)', fontSize: '11px' }}>Refund</button>}
                            {!isMeetingOver(b) && <button onClick={() => handleHostCancel(b.id)} className="btn btn-danger btn-sm" style={{ fontSize: '11px' }}>Cancel</button>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {todayPaginated.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No matches</td></tr>}
              </tbody>
            </table>
          </div>
          <PaginationBtn page={todayPage} totalPages={todayTotalPages} goToPage={goToTodayPage} />
        </div>
      )}

      {/* Upcoming bookings */}
      <div className="card" style={{ marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>Upcoming Bookings</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '3px 10px', borderRadius: '99px' }}>{upcomingBookings.length} upcoming</span>
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
          {[['invitee','Invitee'],['event','Event'],['date','Date']].map(([key,ph]) => (
            <input key={key} value={upcomingFilters[key]} onChange={(e) => setUpcomingFilters(f => ({...f, [key]: e.target.value}))} placeholder={`Filter ${ph}\u2026`} className="field" style={{ width: '140px', padding: '7px 10px', fontSize: '12px' }} />
          ))}
          <select value={upcomingFilters.status} onChange={(e) => setUpcomingFilters(f => ({...f, status: e.target.value}))} className="field" style={{ width: '140px', padding: '7px 10px', fontSize: '12px' }}>
            {FILTERABLE_STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </select>
        </div>
        {loading ? (
          <div style={{ padding: '20px' }}>
            {Array(4).fill(0).map((_, i) => <div key={i} style={{ display: 'flex', gap: '16px', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>{[120,180,100,80].map((w,j) => <Skeleton key={j} w={`${w}px`} h="16px" />)}</div>)}
          </div>
        ) : upcomingBookings.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--surface-3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>No upcoming bookings</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Share your booking link to start receiving bookings.</p>
          </div>
        ) : (
          <>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Invitee</th><th>Event</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {upcomingPaginated.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500 }}>{b.invitee_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{b.event_type_name}</td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDateLocal(b.start_datetime, resolveTimezone(user?.timezone))}</td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatTimeLocal(b.start_datetime, resolveTimezone(user?.timezone))}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate(`/booking/${b.id}`)} className="btn btn-sm" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '11px' }}>View</button>
                        {b.status === 'confirmed' && (
                          <>
                            {isMeetingOver(b) && <button onClick={() => handleStatusUpdate(b.id, 'completed')} className="btn btn-sm" style={{ background: 'var(--surface-success)', color: 'var(--text-success)', border: '1px solid var(--border-success)', fontSize: '11px' }}>Complete</button>}
                            {isMeetingOver(b) && <button onClick={() => handleStatusUpdate(b.id, 'no_show')} className="btn btn-sm" style={{ background: 'var(--surface-warning)', color: 'var(--text-warning)', border: '1px solid var(--border-warning)', fontSize: '11px' }}>No-show</button>}
                            {b.payment_status === 'paid' && <button onClick={() => handleRefund(b.id)} className="btn btn-sm" style={{ background: 'var(--surface-info)', color: 'var(--text-info)', border: '1px solid var(--border-info)', fontSize: '11px' }}>Refund</button>}
                            {!isMeetingOver(b) && <button onClick={() => handleHostCancel(b.id)} className="btn btn-danger btn-sm" style={{ fontSize: '11px' }}>Cancel</button>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {upcomingPaginated.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No matches</td></tr>}
              </tbody>
            </table>
          </div>
          <PaginationBtn page={upcomingPage} totalPages={upcomingTotalPages} goToPage={goToUpcomingPage} />
          </>
        )}
      </div>

      {/* Past bookings & analytics */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>Past Bookings &amp; Analytics</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: 'var(--surface-3)', padding: '3px 10px', borderRadius: '99px' }}>{pastAnalytics.total} past</span>
        </div>
        {pastBookings.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            {pastStatItems.map((s) => (
              <div key={s.label} className="stat-card" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span className="stat-label" style={{ fontSize: '11px' }}>{s.label}</span>
                  <div style={{ color: s.color, opacity: 0.5 }}>{s.icon}</div>
                </div>
                <div className="stat-value" style={{ color: s.color, fontSize: '20px' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}
        {pastBookings.length > 0 && (
          <div style={{ padding: '12px 16px', display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
            <select value={pastFilters.status} onChange={(e) => setPastFilters(f => ({...f, status: e.target.value}))} className="field" style={{ width: '160px', padding: '7px 10px', fontSize: '12px' }}>
              {FILTERABLE_STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
            </select>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>{filteredPast.length} {filteredPast.length === 1 ? 'match' : 'matches'}</span>
          </div>
        )}
        {pastBookings.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', background: 'var(--surface-3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-muted)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>No past bookings</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Completed and past bookings will appear here.</p>
          </div>
        ) : (
          <>
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead><tr><th>Invitee</th><th>Event</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {pastPaginated.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500 }}>{b.invitee_name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{b.event_type_name}</td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatDateLocal(b.start_datetime, resolveTimezone(user?.timezone))}</td>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{formatTimeLocal(b.start_datetime, resolveTimezone(user?.timezone))}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate(`/booking/${b.id}`)} className="btn btn-sm" style={{ background: 'var(--surface-3)', color: 'var(--text-primary)', border: '1px solid var(--border)', fontSize: '11px' }}>View</button>
                        {b.status === 'confirmed' && (
                          <>
                            {isMeetingOver(b) && <button onClick={() => handleStatusUpdate(b.id, 'completed')} className="btn btn-sm" style={{ background: 'var(--surface-success)', color: 'var(--text-success)', border: '1px solid var(--border-success)', fontSize: '11px' }}>Complete</button>}
                            {isMeetingOver(b) && <button onClick={() => handleStatusUpdate(b.id, 'no_show')} className="btn btn-sm" style={{ background: 'var(--surface-warning)', color: 'var(--text-warning)', border: '1px solid var(--border-warning)', fontSize: '11px' }}>No-show</button>}
                            {b.payment_status === 'paid' && <button onClick={() => handleRefund(b.id)} className="btn btn-sm" style={{ background: 'var(--surface-info)', color: 'var(--text-info)', border: '1px solid var(--border-info)', fontSize: '11px' }}>Refund</button>}
                            {!isMeetingOver(b) && <button onClick={() => handleHostCancel(b.id)} className="btn btn-danger btn-sm" style={{ fontSize: '11px' }}>Cancel</button>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {pastPaginated.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No matches</td></tr>}
              </tbody>
            </table>
          </div>
          <PaginationBtn page={pastPage} totalPages={pastTotalPages} goToPage={goToPastPage} />
          </>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh' }} className="sidebar-main">
        {mainContent}
      </main>
      {cancelModal.show && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }} onClick={() => setCancelModal({ ...cancelModal, show: false })}>
          <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 12px 40px rgba(0,0,0,.25)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '17px', color: 'var(--text-primary)', margin: '0 0 6px' }}>Cancel booking</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 18px' }}>Let the invitee know why this booking is being cancelled (optional).</p>
            <textarea
              value={cancelModal.reason}
              onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
              placeholder="e.g. Host is unavailable, rescheduling, etc."
              className="field"
              rows={3}
              style={{ width: '100%', padding: '10px 12px', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button onClick={() => setCancelModal({ ...cancelModal, show: false })} className="btn btn-ghost btn-sm">Keep booking</button>
              <button onClick={confirmCancel} className="btn btn-danger btn-sm">Cancel booking</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal show={refundModal.show} title="Refund booking" message="This will refund the full amount to the invitee and cancel the booking. Continue?" confirmLabel="Process refund" onConfirm={confirmRefund} onCancel={() => setRefundModal({ show: false, id: null })} />
      <ConfirmModal show={deleteModal.show} title="Delete event type" message={deleteModal.name ? `Are you sure you want to delete "${deleteModal.name}"? This cannot be undone.` : 'Are you sure?'} confirmLabel="Delete" confirmDanger onConfirm={() => { const id = deleteModal.id; eventTypes.deleteEventType(id).then(() => { setAllBookings(prev => prev); toast('Deleted', 'success'); }).catch(() => toast('Failed to delete', 'error')); setDeleteModal({ show: false, id: null, name: '' }); }} onCancel={() => setDeleteModal({ show: false, id: null, name: '' })} />
    </div>
  );
}

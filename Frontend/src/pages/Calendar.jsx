import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookings } from '../api/client';
import Sidebar from '../components/Sidebar';
import { formatTimeLocal, getUserTimezone } from '../utils/datetime';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

export default function Calendar() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const tz = getUserTimezone();

  const fetchData = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    bookings.getMyBookings().then((res) => {
      setAllBookings(res.data);
    }).catch(() => {}).finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const bookingsByDate = useMemo(() => {
    const map = {};
    for (const b of allBookings) {
      const d = b.start_datetime.split('T')[0];
      if (!map[d]) map[d] = [];
      map[d].push(b);
    }
    return map;
  }, [allBookings]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);

  const calendarDays = useMemo(() => {
    const cells = [];
    const prevPadding = firstDay;
    for (let i = prevPadding - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, muted: true, date: null, bookings: [] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
      cells.push({ day: d, muted: false, date: dateStr, isToday, bookings: bookingsByDate[dateStr] || [] });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, muted: true, date: null, bookings: [] });
    }
    return cells;
  }, [currentYear, currentMonth, daysInMonth, firstDay, prevMonthDays, bookingsByDate, today]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear((y) => y - 1); setCurrentMonth(11); }
    else setCurrentMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear((y) => y + 1); setCurrentMonth(0); }
    else setCurrentMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const goToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(null);
  };

  const selectedBookings = selectedDate ? (bookingsByDate[selectedDate] || []) : [];

  const statusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'var(--success)';
      case 'cancelled': return 'var(--danger)';
      case 'no_show': return 'var(--warning)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, minHeight: '100vh' }} className="sidebar-main">
        <div className="page-content" style={{ maxWidth: '1200px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '28px', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>Calendar</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => fetchData(true)} disabled={refreshing} className="btn btn-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-2)'>
                <svg className={refreshing ? 'spin' : ''} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                {refreshing ? ' ' : 'Refresh'}
              </button>
              <button onClick={goToday} className="btn btn-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-2)'}>Today</button>
              <button onClick={prevMonth} className="btn btn-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '8px 10px', lineHeight: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-2)'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button onClick={nextMonth} className="btn btn-sm" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: '8px 10px', lineHeight: 0 }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-2)'}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
              <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', margin: 0, minWidth: '180px' }}>
                {MONTHS[currentMonth]} {currentYear}
              </h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
            {/* Calendar grid */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                {WEEKDAYS.map((d) => (
                  <div key={d} style={{ padding: '10px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {calendarDays.map((cell, i) => (
                  <div
                    key={i}
                    onClick={() => cell.date && setSelectedDate(cell.date === selectedDate ? null : cell.date)}
                    style={{
                      minHeight: '90px', padding: '6px', cursor: cell.date ? 'pointer' : 'default',
                      background: cell.date === selectedDate ? 'var(--accent-light)' : 'transparent',
                      borderBottom: '1px solid var(--border)', borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.1s',
                      opacity: cell.muted ? 0.35 : 1,
                    }}
                    onMouseEnter={(e) => { if (cell.date && cell.date !== selectedDate) e.currentTarget.style.background = 'var(--surface-2)'; }}
                    onMouseLeave={(e) => { if (cell.date && cell.date !== selectedDate) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: cell.isToday ? 'var(--accent)' : 'transparent',
                      color: cell.isToday ? '#fff' : 'var(--text-primary)',
                      fontSize: '12px', fontWeight: cell.isToday ? 700 : 500, marginBottom: '4px',
                    }}>{cell.day}</div>
                    {cell.bookings.slice(0, 3).map((b, j) => (
                      <div key={j} title={`${b.invitee_name || 'Booking'} - ${b.start_datetime}`}
                        style={{
                          fontSize: '10px', padding: '2px 4px', borderRadius: '3px', marginBottom: '2px',
                          background: statusColor(b.status) + '20', color: statusColor(b.status),
                          fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/booking/${b.id}`); }}
                      >{b.invitee_name || 'Booking'}</div>
                    ))}
                    {cell.bookings.length > 3 && (
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', paddingLeft: '4px', fontWeight: 500 }}>+{cell.bookings.length - 3} more</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Side panel - selected date details */}
            <div>
              <div className="card" style={{ padding: '20px', position: 'sticky', top: 'clamp(60px, 8vh, 80px)' }}>
                {selectedDate ? (
                  <>
                    <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 4px' }}>
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                      {selectedBookings.length} booking{selectedBookings.length !== 1 ? 's' : ''}
                    </p>
                    {loading ? (
                      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>
                    ) : selectedBookings.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.4 }}>
                          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                        </svg>
                        <p style={{ fontSize: '13px', margin: 0 }}>No bookings on this day</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedBookings.map((b) => (
                          <div key={b.id} onClick={() => navigate(`/booking/${b.id}`)} style={{ padding: '12px', borderRadius: '10px', background: 'var(--surface-2)', cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-2)'}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor(b.status), flexShrink: 0 }} />
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.event_type_name || 'Booking'}</span>
                              <span style={{ marginLeft: 'auto', fontSize: '10px', padding: '2px 6px', borderRadius: '99px', background: statusColor(b.status) + '20', color: statusColor(b.status), fontWeight: 600, textTransform: 'capitalize' }}>{b.status}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {formatTimeLocal(b.start_datetime, tz)} — {b.invitee_name || 'Unknown'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '12px', opacity: 0.3 }}>
                      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
                    </svg>
                    <p style={{ fontSize: '13px', margin: 0 }}>Select a date to view bookings</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) {
          .page-content > div > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
}

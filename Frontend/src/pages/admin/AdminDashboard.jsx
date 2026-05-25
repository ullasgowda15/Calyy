import { useState, useEffect } from 'react';
import { admin } from '../../api/admin';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
const RADIAN = Math.PI / 180;

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const StatCard = ({ label, value, sub, color }) => (
  <div style={{ background-color: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '20px' }}>
    <div style={{ fontSize: '12px', fontWeight: 500, color: '#7F7F8C', marginBottom: '6px' }}>{label}</div>
    <div style={{ fontSize: '28px', fontWeight: 800, color: color || '#fff', letterSpacing: '-0.02em' }}>{value}</div>
    {sub != null && <div style={{ fontSize: '12px', color: '#52525B', marginTop: '4px' }}>{sub}</div>}
  </div>
);

const thStyle = { textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#7F7F8C', padding: '8px 12px', borderBottom: '1px solid #2A2A30', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { fontSize: '13px', color: '#E4E4E7', padding: '10px 12px', borderBottom: '1px solid #1A1A1F' };

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [group, setGroup] = useState('day');

  useEffect(() => {
    Promise.all([
      admin.getDashboard(),
      admin.getAnalytics({ days }),
      admin.getRevenue({ days, group }),
    ]).then(([s, a, r]) => {
      setStats(s.data);
      setAnalytics(a.data);
      setRevenue(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [days, group]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#7F7F8C' }}>
        <svg className="spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '22px', color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Dashboard</h1>
          <p style={{ fontSize: '13px', color: '#7F7F8C', margin: 0 }}>Platform overview and key metrics</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <select value={group} onChange={(e) => setGroup(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', background-color: '#1A1A1F', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none' }}>
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
          </select>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '8px', background-color: '#1A1A1F', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none' }}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <StatCard label="Total Users" value={stats?.total_users || 0} color="#3B82F6" sub={`+${stats?.new_users_today || 0} today`} />
        <StatCard label="Total Bookings" value={stats?.total_bookings || 0} color="#10B981" sub={`${stats?.bookings_today || 0} today`} />
        <StatCard label="Booking Revenue" value={`₹${(stats?.total_revenue || 0).toLocaleString()}`} color="#F59E0B" />
        <StatCard label="Platform Revenue" value={`₹${(stats?.platform_revenue || 0).toLocaleString()}`} color="#10B981" sub="From subscriptions" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        <StatCard label="Active Subscribers" value={stats?.active_subscribers || 0} color="#3B82F6" sub={`${stats?.trial_users || 0} on free trial`} />
        <StatCard label="Active Events" value={stats?.active_event_types || 0} color="#8B5CF6" />
        <StatCard label="Confirmed" value={stats?.confirmed_bookings || 0} color="#10B981" />
        <StatCard label="Cancelled" value={stats?.cancelled_bookings || 0} color="#EF4444" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background-color: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '20px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#E4E4E7', margin: '0 0 16px' }}>Revenue — Booking vs Platform</h3>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '12px' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#F59E0B', marginRight: 6 }}></span> Booking: ₹{(revenue?.total_booking || 0).toLocaleString()}</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#10B981', marginRight: 6 }}></span> Platform: ₹{(revenue?.total_platform || 0).toLocaleString()}</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenue?.combined_revenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
              <XAxis dataKey={group === 'month' ? 'month' : group === 'week' ? 'week' : 'date'} tick={{ fill: '#7F7F8C', fontSize: 11 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis tick={{ fill: '#7F7F8C', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ background-color: '#1A1A1F', border: '1px solid #2A2A30', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
              <Bar dataKey="booking" name="Booking Revenue" fill="#F59E0B" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="platform" name="Platform Revenue" fill="#10B981" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background-color: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '20px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#E4E4E7', margin: '0 0 16px' }}>Bookings per {group === 'month' ? 'month' : group === 'week' ? 'week' : 'day'}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={
              group === 'week' ? (analytics?.bookings_by_week || []) :
              (analytics?.bookings_by_day || [])
            }>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
              <XAxis dataKey={group === 'week' ? 'week' : 'date'} tick={{ fill: '#7F7F8C', fontSize: 11 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis tick={{ fill: '#7F7F8C', fontSize: 11 }} />
              <Tooltip contentStyle={{ background-color: '#1A1A1F', border: '1px solid #2A2A30', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background-color: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '20px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#E4E4E7', margin: '0 0 16px' }}>Users over time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics?.users_by_day || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
              <XAxis dataKey="date" tick={{ fill: '#7F7F8C', fontSize: 11 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis tick={{ fill: '#7F7F8C', fontSize: 11 }} />
              <Tooltip contentStyle={{ background-color: '#1A1A1F', border: '1px solid #2A2A30', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
              <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background-color: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '20px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#E4E4E7', margin: '0 0 16px' }}>Booking Status Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={analytics?.status_distribution || []} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="count" nameKey="status"
                labelLine={true}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, payload }) => {
                  const radius = outerRadius + 30;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text x={x} y={y} fill="#E4E4E7" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '11px', fontWeight: 500 }}>
                      {`${payload.status} (${(percent * 100).toFixed(0)}%)`}
                    </text>
                  );
                }}>
                {(analytics?.status_distribution || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background-color: '#1A1A1F', border: '1px solid #2A2A30', borderRadius: '8px', fontSize: '12px', color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background-color: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '20px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#E4E4E7', margin: '0 0 16px' }}>Top Users by Bookings</h3>
          {analytics?.top_users_by_bookings?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analytics.top_users_by_bookings.map((u, i) => (
                <div key={u.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#0F0F11', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '20px', fontSize: '12px', fontWeight: 700, color: i < 3 ? '#F59E0B' : '#52525B' }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#E4E4E7' }}>{u.username}</div>
                      <div style={{ fontSize: '11px', color: '#52525B' }}>{u.email}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#3B82F6' }}>{u.bookings}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: '13px', color: '#52525B', margin: 0 }}>No bookings in this period.</p>}
        </div>

        <div style={{ background-color: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '20px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#E4E4E7', margin: '0 0 16px' }}>Top Users by Revenue</h3>
          {analytics?.top_users_by_revenue?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {analytics.top_users_by_revenue.map((u, i) => (
                <div key={u.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#0F0F11', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '20px', fontSize: '12px', fontWeight: 700, color: i < 3 ? '#F59E0B' : '#52525B' }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#E4E4E7' }}>{u.username}</div>
                      <div style={{ fontSize: '11px', color: '#52525B' }}>{u.email}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#10B981' }}>₹{u.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ fontSize: '13px', color: '#52525B', margin: 0 }}>No revenue in this period.</p>}
        </div>
      </div>

      <div style={{ background-color: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '20px' }}>
        <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#E4E4E7', margin: '0 0 16px' }}>
          Per-User Revenue Breakdown <span style={{ fontWeight: 400, color: '#52525B', fontSize: '12px' }}>(last {days} days)</span>
        </h3>
        {revenue?.per_user_revenue?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>User</th>
                  <th style={thStyle}>Email</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Bookings</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {revenue.per_user_revenue.map((u) => (
                  <tr key={u.user_id}>
                    <td style={tdStyle}>{u.first_name || u.username}</td>
                    <td style={{ ...tdStyle, color: '#7F7F8C' }}>{u.email}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#3B82F6', fontWeight: 600 }}>{u.booking_count}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#10B981', fontWeight: 600 }}>₹{u.total_revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p style={{ fontSize: '13px', color: '#52525B', margin: 0 }}>No revenue data in this period.</p>}
      </div>
    </div>
  );
}
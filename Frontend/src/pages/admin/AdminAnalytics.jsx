import { useState, useEffect } from 'react';
import { admin } from '../../api/admin';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      admin.getAnalytics({ days }),
      admin.getRevenue({ days }),
    ]).then(([a, r]) => {
      setAnalytics(a.data);
      setRevenue(r.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#7F7F8C' }}><svg className="spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '22px', color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Analytics</h1>
          <p style={{ fontSize: '13px', color: '#7F7F8C', margin: 0 }}>Detailed platform metrics and trends</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: '#1A1A1F', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none' }}>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
        </select>
      </div>

      <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '20px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#E4E4E7', margin: '0 0 16px' }}>Bookings Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.bookings_by_day || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
              <XAxis dataKey="date" tick={{ fill: '#7F7F8C', fontSize: 11 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis tick={{ fill: '#7F7F8C', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1F', border: '1px solid #2A2A30', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={{ backgroundColor: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '20px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#E4E4E7', margin: '0 0 16px' }}>New Users Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.users_by_day || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
              <XAxis dataKey="date" tick={{ fill: '#7F7F8C', fontSize: 11 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis tick={{ fill: '#7F7F8C', fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1F', border: '1px solid #2A2A30', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ backgroundColor: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '20px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#E4E4E7', margin: '0 0 16px' }}>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenue?.daily_revenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A30" />
              <XAxis dataKey="date" tick={{ fill: '#7F7F8C', fontSize: 11 }} tickFormatter={(v) => v?.slice(5) || ''} />
              <YAxis tick={{ fill: '#7F7F8C', fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1F', border: '1px solid #2A2A30', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="amount" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ backgroundColor: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '20px' }}>
          <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: '#E4E4E7', margin: '0 0 16px' }}>Booking Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={analytics?.status_distribution || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="count" nameKey="status" label={({ status, count }) => `${status}: ${count}`}>
                {(analytics?.status_distribution || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1A1A1F', border: '1px solid #2A2A30', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#A1A1AA' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@media (max-width: 767px) { .admin-chart-grid { grid-template-columns: 1fr !important; } }' }} />
    </div>
  );
}

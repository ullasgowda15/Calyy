import { useState, useEffect, useCallback } from 'react';
import { admin } from '../../api/admin';

const STATUS_COLORS = { confirmed: '#10B981', pending: '#F59E0B', cancelled: '#EF4444', completed: '#3B82F6', no_show: '#6B7280' };
const PAYMENT_COLORS = { paid: '#10B981', unpaid: '#F59E0B', refunded: '#EF4444', failed: '#EF4444' };

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch = useCallback((searchVal, pageVal, statusVal, paymentVal) => {
    setLoading(true);
    setError('');
    admin.getBookings({ page: pageVal, status: statusVal, payment_status: paymentVal, search: searchVal, sort: '-created_at', per_page: 15 })
      .then((res) => { setBookings(res.data.results); setTotal(res.data.total); })
      .catch(() => setError('Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(search, page, status, paymentStatus); }, [fetch, page, status, paymentStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetch(search, 1, status, paymentStatus);
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '22px', color: '#fff', margin: '0 0 20px', letterSpacing: '-0.02em' }}>Bookings <span style={{ fontSize: '14px', fontWeight: 400, color: '#7F7F8C' }}>({total})</span></h1>

      {error && <div style={{ background: '#7F1D1D', border: '1px solid #991B1B', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#FCA5A5' }}>{error}</div>}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invitee name or email…" style={{ flex: 1, minWidth: '200px', padding: '9px 12px', borderRadius: '8px', backgroundColor: '#1A1A1F', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none' }} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} style={{ padding: '9px 12px', borderRadius: '8px', backgroundColor: '#1A1A1F', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none' }}>
          <option value="">All status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
          <option value="no_show">No Show</option>
        </select>
        <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} style={{ padding: '9px 12px', borderRadius: '8px', backgroundColor: '#1A1A1F', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none' }}>
          <option value="">All payment</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="refunded">Refunded</option>
        </select>
        <button type="submit" style={{ padding: '9px 16px', borderRadius: '8px', background: '#2563EB', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Search</button>
      </form>

      <div style={{ backgroundColor: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A30' }}>
              {['Invitee', 'Email', 'Event', 'Host', 'Date', 'Status', 'Payment', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#7F7F8C', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#7F7F8C' }}>Loading…</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#7F7F8C' }}>No bookings found</td></tr>
            ) : bookings.map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #2A2A30' }}>
                <td style={{ padding: '12px 14px', color: '#fff', fontWeight: 500 }}>{b.invitee_name}</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>{b.invitee_email}</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>{b.event_type_name || '—'}</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>{b.host_username || '—'}</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA', fontSize: '12px' }}>{b.start_datetime?.slice(0, 16).replace('T', ' ')}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: `${STATUS_COLORS[b.status] || '#6B7280'}20`, color: STATUS_COLORS[b.status] || '#6B7280' }}>{b.status}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: `${PAYMENT_COLORS[b.payment_status] || '#6B7280'}20`, color: PAYMENT_COLORS[b.payment_status] || '#6B7280' }}>{b.payment_status}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ color: '#52525B', fontSize: '11px' }}>{b.razorpay_payment_id ? `₹${b.event_type_price || '—'}` : '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 15 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: '#1A1A1F', border: '1px solid #2A2A30', color: page <= 1 ? '#52525B' : '#fff', fontSize: '13px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <span style={{ padding: '8px 14px', color: '#7F7F8C', fontSize: '13px' }}>Page {page} of {Math.ceil(total / 15)}</span>
          <button disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(page + 1)} style={{ padding: '8px 14px', borderRadius: '8px', backgroundColor: '#1A1A1F', border: '1px solid #2A2A30', color: page >= Math.ceil(total / 15) ? '#52525B' : '#fff', fontSize: '13px', cursor: page >= Math.ceil(total / 15) ? 'not-allowed' : 'pointer' }}>Next</button>
        </div>
      )}
    </div>
  );
}

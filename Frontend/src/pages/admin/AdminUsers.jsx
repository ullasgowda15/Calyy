import { useState, useEffect, useCallback } from 'react';
import { admin } from '../../api/admin';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isActive, setIsActive] = useState('');
  const [isStaff, setIsStaff] = useState('');
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState('');

  const fetchUsers = useCallback((searchVal, pageVal, activeVal, staffVal) => {
    setLoading(true);
    setError('');
    admin.getUsers({ page: pageVal, search: searchVal, is_active: activeVal, is_staff: staffVal, sort: '-date_joined', per_page: 15 })
      .then((res) => { setUsers(res.data.results); setTotal(res.data.total); })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(search, page, isActive, isStaff); }, [fetchUsers, page, isActive, isStaff]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(search, 1, isActive, isStaff);
  };

  const updateUser = async (id, data) => {
    try {
      await admin.updateUser(id, data);
      setEditUser(null);
      fetchUsers(search, page, isActive, isStaff);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await admin.deleteUser(id);
      fetchUsers(search, page, isActive, isStaff);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '22px', color: '#fff', margin: '0 0 20px', letterSpacing: '-0.02em' }}>Users <span style={{ fontSize: '14px', fontWeight: 400, color: '#7F7F8C' }}>({total})</span></h1>

      {error && <div style={{ background: '#7F1D1D', border: '1px solid #991B1B', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#FCA5A5' }}>{error}</div>}

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search email, username…" style={{ flex: 1, minWidth: '200px', padding: '9px 12px', borderRadius: '8px', background: '#1A1A1F', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none' }} />
        <select value={isActive} onChange={(e) => { setIsActive(e.target.value); setPage(1); }} style={{ padding: '9px 12px', borderRadius: '8px', background: '#1A1A1F', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none' }}>
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <select value={isStaff} onChange={(e) => { setIsStaff(e.target.value); setPage(1); }} style={{ padding: '9px 12px', borderRadius: '8px', background: '#1A1A1F', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none' }}>
          <option value="">All roles</option>
          <option value="true">Admin</option>
          <option value="false">User</option>
        </select>
        <button type="submit" style={{ padding: '9px 16px', borderRadius: '8px', background: '#2563EB', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Search</button>
      </form>

      <div style={{ background: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A30' }}>
              {['User', 'Email', 'Status', 'Role', 'Events', 'Bookings', 'Joined', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#7F7F8C', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#7F7F8C' }}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#7F7F8C' }}>No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #2A2A30' }}>
                <td style={{ padding: '12px 14px', color: '#fff', fontWeight: 500 }}>{u.username}</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>{u.email}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: u.is_active ? '#064E3B' : '#451A03', color: u.is_active ? '#6EE7B7' : '#FCD34D' }}>{u.is_active ? 'Active' : 'Inactive'}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {u.is_superuser ? <span style={{ color: '#F59E0B', fontWeight: 600 }}>Super</span> : u.is_staff ? <span style={{ color: '#3B82F6', fontWeight: 600 }}>Staff</span> : <span style={{ color: '#A1A1AA' }}>User</span>}
                </td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>{u.event_types_count}</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA' }}>{u.bookings_count}</td>
                <td style={{ padding: '12px 14px', color: '#A1A1AA', fontSize: '12px' }}>{u.date_joined?.slice(0, 10)}</td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => setEditUser(u)} style={{ padding: '4px 10px', borderRadius: '6px', background: '#1D4ED8', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 600, cursor: 'pointer', marginRight: '6px' }}>Edit</button>
                  <button onClick={() => deleteUser(u.id)} style={{ padding: '4px 10px', borderRadius: '6px', background: '#7F1D1D', border: 'none', color: '#FCA5A5', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 15 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: '8px 14px', borderRadius: '8px', background: '#1A1A1F', border: '1px solid #2A2A30', color: page <= 1 ? '#52525B' : '#fff', fontSize: '13px', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <span style={{ padding: '8px 14px', color: '#7F7F8C', fontSize: '13px' }}>Page {page} of {Math.ceil(total / 15)}</span>
          <button disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(page + 1)} style={{ padding: '8px 14px', borderRadius: '8px', background: '#1A1A1F', border: '1px solid #2A2A30', color: page >= Math.ceil(total / 15) ? '#52525B' : '#fff', fontSize: '13px', cursor: page >= Math.ceil(total / 15) ? 'not-allowed' : 'pointer' }}>Next</button>
        </div>
      )}

      {editUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditUser(null)}>
          <div style={{ background: '#1A1A1F', borderRadius: '12px', border: '1px solid #2A2A30', padding: '24px', width: '400px', maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: '#fff', margin: '0 0 16px' }}>Edit User</h3>
            <EditUserForm user={editUser} onSave={(data) => updateUser(editUser.id, data)} onCancel={() => setEditUser(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function EditUserForm({ user, onSave, onCancel }) {
  const [form, setForm] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    is_active: user.is_active,
    is_staff: user.is_staff,
    is_superuser: user.is_superuser,
    email_verified: user.email_verified,
  });

  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  return (
    <div>
      {['first_name', 'last_name'].map((f) => (
        <div key={f} style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#A1A1AA', marginBottom: '4px' }}>{f.replace('_', ' ')}</label>
          <input type="text" value={form[f]} onChange={(e) => handleChange(f, e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#0F0F11', border: '1px solid #2A2A30', color: '#fff', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      ))}
      {['is_active', 'is_staff', 'is_superuser', 'email_verified'].map((f) => (
        <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}>
          <input type="checkbox" checked={form[f]} onChange={(e) => handleChange(f, e.target.checked)} style={{ accentColor: '#3B82F6' }} />
          <span style={{ fontSize: '13px', color: '#A1A1AA' }}>{f.replace(/_/g, ' ')}</span>
        </label>
      ))}
      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button onClick={() => onSave(form)} style={{ flex: 1, padding: '9px', borderRadius: '8px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
        <button onClick={onCancel} style={{ flex: 1, padding: '9px', borderRadius: '8px', background: '#2A2A30', border: 'none', color: '#A1A1AA', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

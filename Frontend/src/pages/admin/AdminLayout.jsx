import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

const NAV = [
  { path: '/adkrish', label: 'Dashboard', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>' },
  { path: '/adkrish/users', label: 'Users', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>' },
  { path: '/adkrish/bookings', label: 'Bookings', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>' },
  { path: '/adkrish/events', label: 'Event Types', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' },
  { path: '/adkrish/analytics', label: 'Analytics', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' },
  { path: '/adkrish/settings', label: 'Settings', icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' },
];

export default function AdminLayout() {
  const location = useLocation();
  const { adminUser, logout } = useAdminAuth();
  const initials = adminUser?.username?.[0]?.toUpperCase() || 'A';

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0F0F11' }}>
      <aside style={{ width: '240px', flexShrink: 0, background: '#0F0F11', borderRight: '1px solid #1F1F23', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #1F1F23', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #3B82F6, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '15px', fontWeight: 700 }}>C</div>
          <span style={{ color: '#fff', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', letterSpacing: '-0.01em' }}>YourCaly Admin</span>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map((item) => {
            const active = item.path === '/adkrish' ? location.pathname === '/adkrish' : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px',
                borderRadius: '8px', fontSize: '13px', fontWeight: active ? 600 : 400,
                color: active ? '#fff' : '#7F7F8C', textDecoration: 'none',
                background: active ? '#1A1A1F' : 'transparent', transition: 'all 0.15s',
              }}>
                <span dangerouslySetInnerHTML={{ __html: item.icon }} style={{ display: 'flex', opacity: active ? 1 : 0.5 }} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: '14px 16px', borderTop: '1px solid #1F1F23', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#E4E4E7' }}>{adminUser?.username || 'Admin'}</div>
            <div style={{ fontSize: '11px', color: '#52525B' }}>{adminUser?.email || ''}</div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: '#52525B', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }} title="Sign out">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, background: '#0F0F11', minWidth: 0, overflow: 'auto' }}>
        <div style={{ padding: '24px 32px', minHeight: '100%' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

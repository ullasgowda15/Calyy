import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const links = [
  {
    to: '/dashboard', label: 'Dashboard',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  },
  {
    to: '/event-types', label: 'Event Types',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  },
  {
    to: '/availability', label: 'Availability',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
  {
    to: '/how-it-works', label: 'How it works',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>,
  },
  {
    to: '/settings', label: 'Settings',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const initials = user?.username?.[0]?.toUpperCase() || '?';

  const NavLinks = () => (
    <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {links.map((l) => (
        <Link
          key={l.to} to={l.to}
          className={`sidebar-link${location.pathname === l.to || location.pathname.startsWith(l.to + '/') ? ' active' : ''}`}
          onClick={() => setDrawerOpen(false)}
        >
          {l.icon}
          {l.label}
        </Link>
      ))}
    </nav>
  );

  const UserSection = () => (
    <div style={{ borderTop: '1px solid var(--border)', padding: '10px' }}>
      <Link
        to="/profile"
        onClick={() => setDrawerOpen(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px',
          borderRadius: 'var(--radius)', textDecoration: 'none',
          background: 'var(--surface-3)', marginBottom: '8px',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
            fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
          }}>
            {initials}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username || 'Profile'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</div>
        </div>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <ThemeToggle />
        <button
          onClick={logout}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
            borderRadius: 'var(--radius)', fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)',
            background: 'transparent', border: 'none', cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <aside className="sidebar-desktop">
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)' }}>
          <img src="/YourCalyLogo.png" alt="YourCaly" style={{ width: '32px', height: '32px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '17px', color: 'var(--text-primary)' }}>YourCaly</span>
        </div>
        <NavLinks />
        <UserSection />
      </aside>

      {/* Mobile top navbar + drawer - hidden on desktop */}
      <header className="sidebar-mobile-header">
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px' }}>
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--surface-3)', border: '1.5px solid var(--border)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-primary)', flexShrink: 0,
            }}
            aria-label="Toggle menu"
          >
            {drawerOpen
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            }
          </button>

          <ThemeToggle />

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
              <img src="/YourCalyLogo.png" alt="YourCaly" style={{ width: '30px', height: '30px', borderRadius: '8px', objectFit: 'cover' }} />
              <span className="sidebar-brand-name" style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>YourCaly</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div className="sidebar-mobile-drawer">
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} />
          <aside style={{
            position: 'absolute', top: 0, left: 0, width: 'min(260px, 85vw)', height: '100%',
            background: 'var(--surface)', borderRight: '1.5px solid var(--border)',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)' }}>
                <img src="/YourCalyLogo.png" alt="YourCaly" style={{ width: '32px', height: '32px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '17px', color: 'var(--text-primary)' }}>YourCaly</span>
              </div>
              <NavLinks />
              <UserSection />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

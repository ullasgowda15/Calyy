import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const scrollTo = (section) => {
    setMenuOpen(false);
    if (location.pathname === '/') {
      const el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate(`/#${section}`);
    }
  };

  return (
    <nav style={{
      background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 24px', height: '60px', display: 'flex', alignItems: 'center', gap: '32px' }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', flexShrink: 0 }}>
          <img src="/YourCalyLogo.png" alt="YourCaly" style={{ width: '30px', height: '30px', borderRadius: '8px', objectFit: 'cover' }} />
          <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>YourCaly</span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
          {!isAuthenticated && (
            <>
              <span onClick={() => scrollTo('features')} style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Features</span>
              <span onClick={() => scrollTo('pricing')} style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Pricing</span>
            </>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ThemeToggle />

          {!isAuthenticated ? (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm nav-login">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Get started free</Link>
            </>
          ) : (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px',
                  borderRadius: '10px', background: 'var(--surface-3)', border: '1.5px solid var(--border)',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
              >
                <div style={{
                  width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: '#fff',
                }}>
                  {(user?.username || 'U')[0].toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.username}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {dropdownOpen && (
                <>
                  <div onClick={() => setDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                  <div style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: '180px',
                    background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)', padding: '6px', zIndex: 50,
                  }}>
                    {[
                      { to: '/dashboard', label: 'Dashboard' },
                      { to: '/profile', label: 'Profile' },
                      { to: '/settings', label: 'Settings' },
                    ].map((item) => (
                      <Link key={item.to} to={item.to} onClick={() => setDropdownOpen(false)}
                        style={{
                          display: 'block', padding: '8px 12px', borderRadius: '8px',
                          fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)',
                          textDecoration: 'none', transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >{item.label}</Link>
                    ))}
                    <div style={{ height: '1px', background: 'var(--border)', margin: '6px 0' }} />
                    <button onClick={() => { setDropdownOpen(false); logout(); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '8px 12px', borderRadius: '8px',
                        fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', background: 'transparent',
                        border: 'none', cursor: 'pointer', transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-3)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >Sign out</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="nav-hamburger"
            style={{
              width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'var(--surface-3)', border: '1.5px solid var(--border)',
              cursor: 'pointer', color: 'var(--text-primary)',
            }}
            aria-label="Toggle menu"
          >
            {menuOpen
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            }
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 24px 16px' }} className="nav-mobile-menu">
          {!isAuthenticated && (
            <>
              <span onClick={() => scrollTo('features')} style={{ display: 'block', padding: '10px 0', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' }}>Features</span>
              <span onClick={() => scrollTo('pricing')} style={{ display: 'block', padding: '10px 0', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' }}>Pricing</span>
              <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
              <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
                <Link to="/login" className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link to="/register" className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setMenuOpen(false)}>Get started</Link>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) { .nav-hamburger { display: none !important; } .nav-links { display: flex; gap: 24px; } .nav-mobile-menu { display: none !important; } .nav-login { display: flex; } }
        @media (max-width: 767px) { .nav-hamburger { display: flex !important; } .nav-links { display: none; } .nav-login { display: none; } }
      `}</style>
    </nav>
  );
}

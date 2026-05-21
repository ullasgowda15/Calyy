import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1.5px solid var(--border)', padding: '48px 24px 32px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '28px', height: '28px', background: 'var(--accent)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              </div>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>Caly</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '200px' }}>Scheduling infrastructure for everyone.</p>
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Product</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[['#features', 'Features'], ['#pricing', 'Pricing']].map(([href, label]) => (
                <a key={href} href={href} style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>{label}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Account</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[['/login', 'Sign in'], ['/register', 'Create account']].map(([to, label]) => (
                <Link key={to} to={to} style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/privacy" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Privacy Policy</Link>
              <Link to="/terms" style={{ fontSize: '14px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>Terms of Service</Link>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>&copy; {new Date().getFullYear()} Caly. All rights reserved.</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Built for modern scheduling.</p>
        </div>
      </div>
    </footer>
  );
}

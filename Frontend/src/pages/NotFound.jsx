import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <div style={{
            width: '96px', height: '96px', borderRadius: '24px', background: 'var(--surface-3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: '64px',
            color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.03em', lineHeight: 1,
          }}>404</h1>
          <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px' }}>Page not found</p>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 32px', lineHeight: 1.6 }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Go home
            </Link>
            <Link to="/dashboard" className="btn btn-ghost" style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, textDecoration: 'none' }}>
              Dashboard
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#0F0F11', borderTop: '1.5px solid #2A2A30', padding: '48px 24px 32px' }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', marginBottom: '40px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <img src="/YourCalyLogo.png" alt="YourCaly" style={{ width: '28px', height: '28px', borderRadius: '8px', objectFit: 'cover' }} />
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: '#E4E4E7' }}>YourCaly</span>
            </div>
            <p className="footer-desc" style={{ fontSize: '13px', color: '#52525B', lineHeight: 1.6, maxWidth: '200px' }}>Scheduling platform for Indian professionals.</p>
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Product</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[['#features', 'Features'], ['#pricing', 'Pricing']].map(([href, label]) => (
                <a key={href} href={href} style={{ fontSize: '14px', color: '#7F7F8C', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#E4E4E7'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#7F7F8C'}>{label}</a>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Account</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[['/login', 'Sign in'], ['/register', 'Create account']].map(([to, label]) => (
                <Link key={to} to={to} style={{ fontSize: '14px', color: '#7F7F8C', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#E4E4E7'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#7F7F8C'}>{label}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#A1A1AA', marginBottom: '14px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/privacy" style={{ fontSize: '14px', color: '#7F7F8C', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#E4E4E7'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#7F7F8C'}>Privacy Policy</Link>
              <Link to="/terms" style={{ fontSize: '14px', color: '#7F7F8C', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#E4E4E7'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#7F7F8C'}>Terms of Service</Link>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #2A2A30', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: '#52525B', margin: 0 }}>&copy; {new Date().getFullYear()} YourCaly. All rights reserved.</p>
          <p style={{ fontSize: '13px', color: '#52525B', margin: 0 }}>Contact: <a href="mailto:support@yourcaly.com" style={{ color: '#A1A1AA', textDecoration: 'none' }}>support@yourcaly.com</a></p>
        </div>
        <style dangerouslySetInnerHTML={{ __html: '@media (max-width: 767px) { .footer-desc { max-width: 100% !important; } }' }} />
      </div>
    </footer>
  );
}

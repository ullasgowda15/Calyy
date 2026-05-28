import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>Terms of Service</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>Last updated: May 2026</p>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>1. Acceptance of Terms</h2>
          <p>By creating a YourCaly account, you agree to these terms. If you do not agree, do not use the service.</p>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>2. Description of Service</h2>
          <p>YourCaly provides scheduling infrastructure, allowing users to create event types, manage availability, and accept bookings from invitees.</p>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>3. User Responsibilities</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. You agree not to use YourCaly for spam, fraud, or unlawful purposes.</p>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>4. Payments & Refunds</h2>
          <p>Paid bookings are processed via Razorpay. Refunds are at the host's discretion. YourCaly is not responsible for disputes between hosts and invitees.</p>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>5. Limitation of Liability</h2>
          <p>YourCaly is provided "as is" without warranties. We are not liable for damages arising from use of the service.</p>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>6. Changes</h2>
          <p>We may update these terms. Continued use after changes constitutes acceptance.</p>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>7. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:support@yourcaly.com" style={{ color: 'var(--accent)', textDecoration: 'none' }}>support@yourcaly.com</a>.</p>
        </div>
        <Link to="/" style={{ display: 'inline-block', marginTop: '24px', color: 'var(--accent)', fontSize: '14px', textDecoration: 'none' }}>&larr; Back to home</Link>
      </div>
      <Footer />
    </div>
  );
}

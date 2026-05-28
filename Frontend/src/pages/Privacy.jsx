import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>Privacy Policy</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>Last updated: May 2026</p>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>1. Information We Collect</h2>
          <p>We collect information you provide when creating an account: name, email address, username, and timezone. We also collect booking data such as invitee names, email addresses, and meeting notes.</p>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>2. How We Use Your Information</h2>
          <p>We use your information to facilitate scheduling, send booking confirmations and reminders, process payments via Razorpay, and sync events with Google Calendar (if connected).</p>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>3. Data Sharing</h2>
          <p>We do not sell your personal data. We share necessary data with third-party services you explicitly connect (Google Calendar) and payment processors (Razorpay) to complete transactions.</p>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>4. Data Retention</h2>
          <p>We retain your data as long as your account is active. You may request deletion by contacting us.</p>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>5. Contact</h2>
           <p>For questions about this policy, contact us at support@yourcaly.com.</p>
        </div>
        <Link to="/" style={{ display: 'inline-block', marginTop: '24px', color: 'var(--accent)', fontSize: '14px', textDecoration: 'none' }}>&larr; Back to home</Link>
      </div>
      <Footer />
    </div>
  );
}

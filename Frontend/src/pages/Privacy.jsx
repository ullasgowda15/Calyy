import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      <Navbar />
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '28px', color: 'var(--text-primary)', marginBottom: '8px' }}>Privacy Policy</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>Last updated: June 2026</p>
        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>1. Information We Collect</h2>
          <p>We collect information you provide when creating an account: name, email address, username, and timezone. We also collect booking data such as invitee names, email addresses, meeting notes, and custom question responses.</p>
          <p>When you connect Google Calendar, we access calendar events solely for the purpose of syncing your bookings and checking availability conflicts. We do not store your Google Calendar data beyond what is necessary for this sync functionality.</p>

          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>2. How We Use Your Information</h2>
          <p>We use your information to facilitate scheduling, send booking confirmations and reminders, process payments via Razorpay, and sync events with Google Calendar (if connected). We do not use Google user data for advertising, training AI models, or any purpose beyond providing the scheduling service you explicitly request.</p>

          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>3. Data Protection Mechanisms</h2>
          <p>We implement the following safeguards to protect your data:</p>
          <ul>
            <li><strong>Encryption in transit:</strong> All data transmitted between your browser and our servers is encrypted using TLS 1.3. API communications between our frontend and backend are also TLS-encrypted.</li>
            <li><strong>Encryption at rest:</strong> Sensitive user data stored in our PostgreSQL database is encrypted at rest using AES-256. Database backups are also encrypted.</li>
            <li><strong>Access controls:</strong> Only authenticated and authorized personnel have access to production servers. Access is granted on a least-privilege basis and logged for audit.</li>
            <li><strong>Google OAuth tokens:</strong> Google API tokens are stored encrypted in our database and are never exposed to the client side. Tokens are used only for the specific calendar operations you authorize and can be revoked at any time.</li>
            <li><strong>Payment data:</strong> All payment processing is handled by Razorpay. We do not store credit card numbers, UPI details, or bank account information on our servers.</li>
            <li><strong>API rate limiting:</strong> All API endpoints are rate-limited to prevent abuse and unauthorized bulk data extraction.</li>
          </ul>

          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>4. Google User Data — Limited Use</h2>
          <p>YourCaly's use and transfer of information received from Google APIs to any other app adheres to <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Google's Limited Use Requirements</a>, including:</p>
          <ul>
            <li>Google Calendar data is used only to sync bookings, check availability conflicts, and display your calendar within YourCaly.</li>
            <li>We do not transfer Google data to third parties except as necessary to provide this service (e.g., storing sync state) or as required by law.</li>
            <li>We do not use Google data for training machine learning models, advertising, or any unrelated purpose.</li>
            <li>You can disconnect Google Calendar access at any time via Settings or the <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Google Account permissions page</a>, which immediately stops all data access.</li>
          </ul>

          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>5. Data Sharing</h2>
          <p>We do not sell your personal data. We share necessary data only with:</p>
          <ul>
            <li><strong>Google (Calendar API):</strong> For calendar sync, only if you explicitly connect your Google Calendar.</li>
            <li><strong>Razorpay:</strong> For payment processing. We share only the transaction amount and order ID necessary for payment settlement.</li>
            <li><strong>Resend:</strong> For sending email notifications (booking confirmations, reminders, password resets).</li>
          </ul>
          <p>Each third-party service is contractually obligated to maintain the confidentiality and security of your data.</p>

          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>6. Data Retention</h2>
          <p>We retain your personal data for as long as your account is active. Upon account deletion, all associated data — including event types, bookings, availability settings, and connected service tokens — is permanently deleted within 30 days. Calendar events created on your Google Calendar via sync are not deleted by YourCaly upon account deletion; you can remove them manually from Google Calendar.</p>

          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>7. Data Breach Notification</h2>
          <p>In the event of a data breach that affects your personal data, we will notify you via email within 72 hours of becoming aware of the incident. We will also report the breach to the relevant supervisory authority as required by applicable law.</p>

          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>8. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li><strong>Access</strong> your personal data by visiting your Profile page.</li>
            <li><strong>Correct</strong> inaccurate data by editing your profile or contacting us.</li>
            <li><strong>Delete</strong> your account and all associated data by contacting us or using the account deletion option.</li>
            <li><strong>Export</strong> your data by requesting a copy of your information.</li>
            <li><strong>Revoke</strong> Google Calendar access at any time via Settings or your Google Account permissions.</li>
          </ul>
          <p>To exercise any of these rights, contact us at privacy@yourcaly.com.</p>

          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>9. International Data Transfers</h2>
          <p>Your data is stored on servers located in India. If you access YourCaly from outside India, your data may be transferred to and processed in our server location. We ensure appropriate safeguards are in place for such transfers in compliance with applicable data protection laws.</p>

          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or through a notice on our website. Continued use of YourCaly after changes constitutes acceptance of the updated policy.</p>

          <h2 style={{ fontSize: '18px', color: 'var(--text-primary)', marginTop: '28px' }}>11. Contact</h2>
          <p>For questions about this policy, to exercise your data rights, or to report a privacy concern, contact us at <strong>privacy@yourcaly.com</strong>.</p>
        </div>
        <Link to="/" style={{ display: 'inline-block', marginTop: '24px', color: 'var(--accent)', fontSize: '14px', textDecoration: 'none' }}>&larr; Back to home</Link>
      </div>
      <Footer />
    </div>
  );
}

import { Link } from 'react-router-dom';
import SeoMeta from '../components/SeoMeta';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const milestones = [
  { year: '2025', title: 'YourCaly founded', desc: 'Built to solve scheduling for Indian professionals — starting with coaches and freelancers.' },
  { year: '2025', title: 'Public launch', desc: 'YourCaly launched with booking pages, Google Calendar sync, and Razorpay subscriptions.' },
  { year: '2026', title: 'Platform growth', desc: 'Added landing pages, SEO optimization, and mobile-responsive design. 2,400+ professionals onboarded.' },
  { year: '2026+', title: 'What\'s next', desc: 'Payment collection at booking, GST invoices, team scheduling, and native mobile apps.' },
];

const values = [
  { title: 'Built for India', desc: 'Pricing in INR, payments via Razorpay (UPI, cards, net banking), and timezone-first design for IST.' },
  { title: 'Simplicity', desc: 'YourCaly is designed to be intuitive. Set up your booking page in minutes, not hours.' },
  { title: 'Reliability', desc: 'Automated reminders, Google Calendar sync, and Celery-backed task processing keep your schedule on track.' },
  { title: 'Continuous improvement', desc: 'We ship regularly. Every month brings new features based on user feedback.' },
];

export default function About() {
  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
      <SeoMeta title="About YourCaly — Scheduling Platform For Indian Professionals" description="YourCaly is a scheduling platform built for Indian professionals. Learn about our mission, values, and roadmap." canonical="/about" />
      <Navbar />

      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '100px 24px 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 20px', letterSpacing: '-0.02em' }}>
            About <span style={{ color: 'var(--accent)' }}>YourCaly</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
            YourCaly is a scheduling platform that makes it easy for professionals to share their availability, accept bookings, and automate their schedule — without the back-and-forth emails.
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(24px, 2.5vw, 32px)', color: 'var(--text-primary)', margin: '0 0 24px', letterSpacing: '-0.02em' }}>What is YourCaly?</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: '0 0 16px' }}>
            YourCaly is a scheduling platform built specifically for Indian professionals. Create a personalized booking page at yourcaly.com/yourname, set your availability, and share your link. Clients see your available slots in their timezone and book with one click.
          </p>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: '0 0 16px' }}>
            Every booking automatically syncs to your Google Calendar, sends confirmation emails to both parties, and blocks your availability to prevent double-booking. YourCaly handles the logistics so you can focus on your work.
          </p>
        </div>
      </section>

      <section style={{ padding: '60px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(24px, 2.5vw, 32px)', color: 'var(--text-primary)', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Who is YourCaly for?</h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>YourCaly serves a wide range of professionals across India.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {[
              { title: 'Coaches & Trainers', desc: 'Life coaches, fitness trainers, IELTS tutors, UPSC mentors — anyone who runs one-on-one or group sessions.' },
              { title: 'Consultants', desc: 'Business consultants, strategy advisors, finance planners, and CA professionals managing client meetings.' },
              { title: 'Freelancers', desc: 'Designers, developers, writers, photographers, and wedding planners who need a professional booking presence.' },
              { title: 'Service professionals', desc: 'Dermatologists, physiotherapists, therapists, lawyers, and interior designers scheduling client appointments.' },
            ].map((item) => (
              <div key={item.title} className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 8px' }}>{item.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(24px, 2.5vw, 32px)', color: 'var(--text-primary)', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Our mission</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: '0 0 16px' }}>
            YourCaly's mission is to make scheduling effortless for every Indian professional. We believe that no one should waste time coordinating calendars — your scheduling tool should just work, in your timezone, with your payment methods, at a price that makes sense for India.
          </p>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>
            We're building YourCaly in public, shipping regularly, and listening to our users. Every feature we build starts with the question: "Does this make scheduling easier for our users?"
          </p>
        </div>
      </section>

      <section style={{ padding: '60px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(24px, 2.5vw, 32px)', color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Our values</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {values.map((v) => (
              <div key={v.title} className="card fade-in" style={{ padding: '24px' }}>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 8px' }}>{v.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(24px, 2.5vw, 32px)', color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Milestones</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {milestones.map((m) => (
              <div key={m.year + m.title} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', padding: '20px', background: 'var(--surface-2)', borderRadius: '12px' }}>
                <div style={{ minWidth: '64px', fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '15px', color: 'var(--accent)', paddingTop: '1px' }}>{m.year}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>{m.title}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', background: 'var(--surface-2)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <div className="card" style={{ padding: '56px 40px', background: 'var(--accent)', border: 'none', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(26px, 3vw, 36px)', color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Start scheduling with YourCaly</h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', margin: '0 0 32px', lineHeight: 1.6 }}>Join 2,400+ Indian professionals using YourCaly. Start your 7-day free trial. No credit card required.</p>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', background: '#fff', color: 'var(--accent)', borderRadius: '12px', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', textDecoration: 'none', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >Get started with YourCaly <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

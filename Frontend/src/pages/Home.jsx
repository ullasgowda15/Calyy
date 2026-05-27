import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SeoMeta from '../components/SeoMeta';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'YourCaly',
      url: 'https://yourcaly.com',
      logo: 'https://yourcaly.com/YourCalyLogo.png',
      description: 'Scheduling platform built for Indian professionals. Create booking pages, manage availability, and automate meeting scheduling.',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'YourCaly',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: 'Create booking pages and schedule meetings easily. Built for coaches, consultants and freelancers in India.',
      offers: [
        { '@type': 'Offer', price: '0', priceCurrency: 'INR', description: '7-day free trial' },
        { '@type': 'Offer', price: '499', priceCurrency: 'INR', description: 'Standard plan per month' },
      ],
      featureList: [
        'Unlimited event types',
        'Smart availability management',
        'Automated email reminders',
        'Timezone-aware booking',
        'Google Calendar sync',
        'Public booking pages',
      ],
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do invitees book a meeting?',
      acceptedAnswer: { '@type': 'Answer', text: 'They visit your public booking link, pick an event type, select an available time slot, fill in their details, and confirm. You\'ll receive an email notification with their details.' },
    },
    {
      '@type': 'Question',
      name: 'Can I sync with Google Calendar?',
      acceptedAnswer: { '@type': 'Answer', text: 'Yes. Go to Settings and connect your Google Calendar. Events you create on YourCaly will automatically appear in your Google Calendar and vice versa.' },
    },
    {
      '@type': 'Question',
      name: 'What payment options are available?',
      acceptedAnswer: { '@type': 'Answer', text: 'Standard plan subscriptions (₹499/month) are processed through Razorpay, which supports credit/debit cards, UPI, net banking, and popular Indian wallets. Payment collection at booking is on the radar.' },
    },
    {
      '@type': 'Question',
      name: 'Can I customise my booking page?',
      acceptedAnswer: { '@type': 'Answer', text: 'Your booking page uses your name, username, and event type details. More customisation options are coming soon.' },
    },
    {
      '@type': 'Question',
      name: 'Is there a mobile app?',
      acceptedAnswer: { '@type': 'Answer', text: 'Not yet, but the web app is fully responsive and works great on mobile browsers.' },
    },
  ],
};

const features = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    title: 'Unlimited event types', desc: 'Create as many meeting types as you need — 1:1s, group sessions, paid consultations.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    title: 'Smart availability', desc: 'Set your hours once. YourCaly ensures you never get double-booked again.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
    title: 'Automated reminders', desc: 'Email confirmations and reminders sent automatically to both parties.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
    title: 'Payment collection', desc: 'Collect payments at booking time via UPI, cards, and net banking — powered by Razorpay.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    title: 'Google Calendar sync', desc: 'Two-way sync keeps your calendar always current, blocking off busy times automatically.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg>,
    title: 'Webhook integrations', desc: 'Connect to thousands of apps via webhooks. Automate your booking workflow.',
  },
];

const steps = [
  { num: '01', title: 'Set your availability', desc: 'Tell YourCaly when you\'re free. Customize buffers, blackout dates, and max bookings per day.' },
  { num: '02', title: 'Share your link', desc: 'Get a beautiful personal booking page at yourcaly.com/yourname. Share it everywhere.' },
  { num: '03', title: 'Get booked', desc: 'Invitees pick a time that works. You get notified. Done.' },
];

const plans = [
  { name: 'Free', price: 'Free', period: '7-day trial', desc: 'Full access, no commitment', features: ['1 event type', 'Unlimited bookings', 'Public booking page', 'Email confirmations'], popular: false },
  { name: 'Standard', price: '499', period: '/month', desc: 'For busy professionals', features: ['Unlimited event types', 'Google Calendar sync', 'Payment collection', 'Email reminders', 'Zapier webhooks'], popular: true },
  { name: 'Teams', price: '5999', period: '/month', desc: 'For growing teams', features: ['Everything in Standard', 'Round-robin routing', 'SMS reminders', 'Salesforce integration', 'Priority support'], popular: false },
];

const testimonials = [
  { initials: 'AK', name: 'Anita Kapoor', role: 'Life Coach, Mumbai', quote: 'YourCaly transformed how I schedule coaching sessions. My booking rate increased by 40% in the first month.' },
  { initials: 'RM', name: 'Rajesh Mehta', role: 'Freelance Designer, Bengaluru', quote: 'The automated reminders alone saved me hours of manual follow-up every week. Worth every rupee.' },
  { initials: 'PN', name: 'Priya Nair', role: 'Sales Consultant, Delhi', quote: 'Setting up my booking page took minutes, not hours. The calendar sync alone has been a game-changer.' },
];

const upcomingFeatures = [
  { title: 'Payment collection', desc: 'Accept payments when clients book your paid event types.' },
  { title: 'UPI checkout', desc: 'Let clients pay via UPI directly at the time of booking.' },
  { title: 'Prepaid booking payments', desc: 'Require upfront payment to confirm a booking.' },
];

const brandColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const profiles = [
  { role: 'Fitness Coach', name: 'G. Mann', initial: 'G' },
  { role: 'Dietician / Nutritionist', name: 'R. Diwekar', initial: 'R' },
  { role: 'Makeup Artist', name: 'P. Garg', initial: 'P' },
  { role: 'Physiotherapist', name: 'Dr. A. Jain', initial: 'A' },
  { role: 'Dermatologist', name: 'Dr. J. Sharad', initial: 'J' },
  { role: 'Career Coach', name: 'S. Maheshwari', initial: 'S' },
  { role: 'Business Consultant', name: 'A. Warikoo', initial: 'A' },
  { role: 'Finance Advisor', name: 'R. Ranade', initial: 'R' },
  { role: 'Therapist / Psychologist', name: 'S. Gupta', initial: 'S' },
  { role: 'Yoga Teacher', name: 'B. Ramdev', initial: 'B' },
  { role: 'Lawyer', name: 'H. Salve', initial: 'H' },
  { role: 'Interior Designer', name: 'G. Khan', initial: 'G' },
  { role: 'Wedding Photographer', name: 'J. Radhik', initial: 'J' },
  { role: 'Wedding Planner', name: 'V. Mohan', initial: 'V' },
  { role: 'Freelancer / SEO Consultant', name: 'N. Patel', initial: 'N' },
  { role: 'Coding Mentor', name: 'L. Babbar', initial: 'L' },
  { role: 'IELTS Trainer', name: 'K. Keshari', initial: 'K' },
  { role: 'UPSC Mentor', name: 'R. Saini', initial: 'R' },
  { role: 'CA / Tax Consultant', name: 'N. Bhatia', initial: 'N' },
  { role: 'Wedding Stylist', name: 'A. Hakim', initial: 'A' },
];

export default function Home() {
  const location = useLocation();
  useEffect(() => {
    const section = location.hash.replace('#', '');
    if (section) {
      setTimeout(() => {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location.hash]);

  const [profileIdx, setProfileIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setProfileIdx((i) => (i + 1) % profiles.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const current = profiles[profileIdx];
  const urlSlug = current.name.toLowerCase().replace(/^dr\.\s*/i, '').replace(/[^a-z0-9]/g, '');

  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
      <SeoMeta title="Booking Platform For Coaches, Consultants & Freelancers" canonical="/" ogImage="https://yourcaly.com/YourCalyLogo.png" />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>
      <Navbar />

      {/* Hero */}
      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '100px 24px 96px', overflow: 'hidden', position: 'relative' }}>
        {/* Background grid decoration */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.5, pointerEvents: 'none' }} />
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, var(--surface), transparent)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1120px', margin: '0 auto', position: 'relative' }}>
          {/* Hero: left text, right booking mockup */}
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', marginBottom: '64px' }}>
            {/* Left: text */}
            <div style={{ textAlign: 'left' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
                background: 'var(--accent-light)', borderRadius: '99px', fontSize: '13px', fontWeight: 600,
                color: 'var(--accent)', marginBottom: '24px', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
              }}>
                <span style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%' }} />
                Scheduling made effortless
              </div>
              <h1 style={{
                fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 60px)',
                lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 20px',
                letterSpacing: '-0.02em',
              }}>
                Scheduling platform<br />
                <span style={{ color: 'var(--accent)' }}>built for Indian professionals</span>
              </h1>
              <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: 1.6, margin: '0 0 36px' }}>
                Create professional booking pages and manage appointments with YourCaly. Built for Indian professionals.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary btn-lg">
                  Get started free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link to="/how-it-works" className="btn btn-ghost btn-lg">See how it works</Link>
              </div>
            </div>

            {/* Right: booking mockup */}
            <div>
              <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-2)' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['#FF5F57','#FEBC2E','#28C840'].map((c,i) => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
                  </div>
                  <div style={{ flex: 1, height: '28px', background: 'var(--surface)', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    yourcaly.com/book/{urlSlug}
                  </div>
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: '180px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '18px' }}>{current.initial}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{current.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{current.role}</div>
                      </div>
                    </div>
                    <div style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>May 2026</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {['‹','›'].map((a,i) => <div key={i} style={{ width: '20px', height: '20px', background: 'var(--surface)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>{a}</div>)}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center' }}>
                        {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, padding: '2px 0' }}>{d}</div>)}
                        {[null,null,null,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map((d,i) => (
                          <div key={i} style={{
                            fontSize: '11px', padding: '4px 2px', borderRadius: '4px',
                            background: d === 15 ? 'var(--accent)' : 'transparent',
                            color: d === 15 ? '#fff' : d ? 'var(--text-primary)' : 'transparent',
                            cursor: d ? 'pointer' : 'default',
                          }}>{d || ''}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ minWidth: '120px', flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Available times</div>
                    {['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '2:00 PM', '2:30 PM'].map((t) => (
                      <div key={t} style={{
                        padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: '8px',
                        marginBottom: '6px', fontSize: '13px', fontWeight: 500,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: t === '10:00 AM' ? 'var(--accent)' : 'var(--surface)',
                        color: t === '10:00 AM' ? '#fff' : 'var(--text-primary)',
                        borderColor: t === '10:00 AM' ? 'var(--accent)' : 'var(--border)',
                      }}>{t}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social proof */}
          <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {false && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex' }}>
                {brandColors.slice(0,5).map((c,i) => (
                  <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, border: '2px solid var(--surface)', marginLeft: i > 0 ? '-10px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: 700, boxShadow: '0 0 10px rgba(0,0,0,0.15)' }}>
                    {['P','M','K','R','T'][i]}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>2,400+</strong> professionals use YourCaly</span>
            </div>
            )}
            {false && (<div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {[1,2,3,4,5].map(i => <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>4.9/5 rating</span>
            </div>)}
          </div>
        </div>
      </section>

      {/* Built for */}
      <section style={{ padding: '60px 24px', background: 'var(--surface-2)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'var(--surface-3)', borderRadius: '99px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Built for
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {[
              { name: 'Coaches', link: '/for-coaches' },
              { name: 'Consultants', link: '/for-consultants' },
              { name: 'Freelancers', link: '/for-freelancers' },
              { name: 'Tutors', link: null },
              { name: 'Agencies', link: null },
            ].map((item) => (
              item.link ? (
                <Link key={item.name} to={item.link} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: '99px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', textDecoration: 'none', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                >
                  {item.name}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
              ) : (
                <span key={item.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', background: 'var(--surface)', border: '1.5px dashed var(--border)', borderRadius: '99px', fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: '14px', color: 'var(--text-muted)', opacity: 0.7 }}>
                  {item.name}
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>Coming soon</span>
                </span>
              )
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 24px', background: 'var(--surface-2)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'var(--surface-3)', borderRadius: '99px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Features
            </div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(28px, 3.5vw, 40px)', color: 'var(--text-primary)', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Everything you need to schedule</h2>
            <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>Powerful, intuitive tools for modern professionals and teams.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {features.map((f, i) => (
              <div key={f.title} className="card fade-in" style={{ padding: '24px', transition: 'all 0.2s', animationDelay: `${i * 0.05}s` }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
              >
                <div style={{ width: '44px', height: '44px', background: 'var(--accent-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: '16px' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'var(--surface-3)', borderRadius: '99px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              How it works
            </div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(28px, 3.5vw, 40px)', color: 'var(--text-primary)', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Up and running in minutes</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {steps.map((s, i) => (
              <div key={s.num} style={{ position: 'relative', padding: '32px 24px', textAlign: 'center' }}>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', top: '48px', right: '-12px', color: 'var(--border-strong)', fontSize: '20px', display: 'none' }} className="step-arrow">→</div>
                )}
                <div style={{
                  width: '56px', height: '56px', borderRadius: '16px', background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                  fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '18px', color: '#fff',
                }}>{s.num}</div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '80px 24px', background: 'var(--surface-2)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'var(--surface-3)', borderRadius: '99px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Pricing
            </div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(28px, 3.5vw, 40px)', color: 'var(--text-primary)', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Simple, transparent pricing</h2>
            <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto' }}>Start with a 7-day free trial. No credit card required.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', maxWidth: '900px', margin: '0 auto' }}>
            {plans.map((p) => (
              <div key={p.name} style={{
                background: 'var(--surface)', borderRadius: '16px', padding: '28px',
                border: p.popular ? '2px solid var(--accent)' : '1.5px solid var(--border)',
                position: 'relative', boxShadow: p.popular ? '0 0 0 4px color-mix(in srgb, var(--accent) 10%, transparent)' : 'var(--shadow)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {p.popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--accent)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '4px 14px', borderRadius: '99px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    Most popular
                  </div>
                )}
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', margin: '0 0 4px' }}>{p.name}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px' }}>{p.desc}</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'Plus Jakarta Sans', color: 'var(--text-primary)', lineHeight: 1 }}>{p.name === 'Free' ? 'Free' : `₹${p.price}`}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{p.period}</span>
                  </div>
                </div>
                <ul style={{ listStyle: 'none', margin: '0 0 24px', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {p.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: 'var(--text-primary)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
                {p.name === 'Teams' ? (
                  <span className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', opacity: 0.6, cursor: 'default' }}>
                    Upcoming
                  </span>
                ) : (
                  <Link to="/register" className={`btn ${p.name === 'Free' || p.popular ? 'btn-primary' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'center' }}>
                    Get started
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {false && (<>
      {/* Testimonials */}
      <section style={{ padding: '80px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(28px, 3.5vw, 40px)', color: 'var(--text-primary)', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Loved by thousands</h2>
            <p style={{ fontSize: '17px', color: 'var(--text-secondary)' }}>Join professionals who schedule smarter with YourCaly.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {testimonials.map((t) => (
              <div key={t.name} className="card fade-in" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', marginBottom: '6px' }}>
                  {[1,2,3,4,5].map(i => <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                </div>
                <p style={{ fontSize: '15px', color: 'var(--text-primary)', lineHeight: 1.7, margin: '0 0 20px', fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '14px', flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </>)}

      {/* FAQ */}
      <section style={{ padding: '60px 24px', background: 'var(--surface-2)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(24px, 2.5vw, 30px)', color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Frequently asked questions</h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Quick answers to common questions.</p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {[
              { q: 'How do invitees book a meeting?', a: 'They visit your public booking link, pick an event type, select an available time slot, fill in their details, and confirm. You\'ll receive an email notification with their details.' },
              { q: 'Can I sync with Google Calendar?', a: 'Yes. Go to Settings and connect your Google Calendar. Events you create on YourCaly will automatically appear in your Google Calendar and vice versa.' },
              { q: 'What payment options are available?', a: 'Standard plan subscriptions (₹499/month) are processed through Razorpay, which supports credit/debit cards, UPI, net banking, and popular Indian wallets. Event-level payment collection is coming soon.' },
              { q: 'Can I customise my booking page?', a: 'Your booking page uses your name, username, and event type details. More customisation options are coming soon.' },
              { q: 'Is there a mobile app?', a: 'Not yet — but the web app is fully responsive and works great on mobile browsers.' },
            ].map((item, i) => (
              <details key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <summary style={{ padding: '18px 0', cursor: 'pointer', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" className="faq-chevron" style={{ flexShrink: 0, transition: 'transform 0.2s' }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                  {item.q}
                </summary>
                <div style={{ padding: '0 0 18px 26px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* What's coming */}
      <section style={{ padding: '60px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'var(--surface-3)', borderRadius: '99px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Coming soon
          </div>
          <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(26px, 3vw, 36px)', color: 'var(--text-primary)', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Coming soon</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 48px', lineHeight: 1.6 }}>Features on our radar.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {upcomingFeatures.map((uf) => (
              <div key={uf.title} style={{ padding: '24px', background: 'var(--surface-2)', borderRadius: '12px', border: '1px dashed var(--border)', textAlign: 'left' }}>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', margin: '0 0 6px' }}>{uf.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{uf.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', background: 'var(--surface-2)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <div className="card" style={{ padding: '56px 40px', background: 'var(--accent)', border: 'none', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(26px, 3vw, 36px)', color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Start scheduling smarter today</h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', margin: '0 0 32px', lineHeight: 1.6 }}>Start your 7-day free trial. No credit card required.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px',
                background: '#fff', color: 'var(--accent)', borderRadius: '12px',
                fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', textDecoration: 'none',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                Get started free
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <style dangerouslySetInnerHTML={{ __html: '@media (max-width: 768px) { .hero-grid { grid-template-columns: 1fr !important; } .hero-grid > div:last-child { order: -1; } }' }} />
    </div>
  );
}

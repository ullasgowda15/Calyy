import { Link } from 'react-router-dom';
import SeoMeta from '../components/SeoMeta';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const features = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    title: 'Unlimited event types', desc: 'Create as many meeting types as you need — 1:1s, group sessions, interviews, and more. No limits, no restrictions.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
    title: 'Smart availability', desc: 'Set your hours once. YourCaly ensures you never get double-booked again. Supports buffers, blackout dates, and max daily bookings.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
    title: 'Email reminders', desc: 'Automated confirmations and reminders sent via Resend. Professional email delivery your invitees will trust.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    title: 'Google Calendar sync', desc: 'Two-way sync keeps your calendar always current. Block busy times automatically and avoid double-booking.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: 'Indian pricing (₹)', desc: '₹499/month for Standard plan. Pay via Razorpay with UPI, cards, or net banking. No dollar conversion, no international fees.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/></svg>,
    title: 'Timezone-aware', desc: 'Your invitees see times in IST or their local timezone, you see them in yours. Automatic timezone detection — no confusion.',
  },
];

export default function CalendlyAlternativeIndia() {
  return (
    <div style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
      <SeoMeta title="Best Calendly Alternative for India" description="Indian-owned scheduling platform with ₹ pricing, UPI support, and timezone-ready booking pages. A better Calendly alternative for Indian professionals." canonical="/calendly-alternative-india" />
      <Navbar />

      <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '100px 24px 96px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.5, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, var(--surface), transparent)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1120px', margin: '0 auto', position: 'relative' }}>
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center', marginBottom: '64px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'var(--accent-light)', borderRadius: '99px', fontSize: '13px', fontWeight: 600, color: 'var(--accent)', marginBottom: '24px', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
                <span style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%' }} />
                Made in India — For India
              </div>
              <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(36px, 5vw, 60px)', lineHeight: 1.1, color: 'var(--text-primary)', margin: '0 0 20px', letterSpacing: '-0.02em' }}>
                YourCaly — The Calendly alternative<br /><span style={{ color: 'var(--accent)' }}>India deserves</span>
              </h1>
              <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text-secondary)', maxWidth: '480px', lineHeight: 1.6, margin: '0 0 36px' }}>
                Pricing in INR. Payments via Razorpay (UPI, cards, net banking). Timezone-ready for IST. YourCaly is built for Indian professionals — from freelancers to enterprises.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary btn-lg">Get started free</Link>
                <Link to="/how-it-works" className="btn btn-ghost btn-lg">See how it works</Link>
              </div>
            </div>
            <div>
              <div className="card" style={{ padding: '0', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-2)' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['#FF5F57','#FEBC2E','#28C840'].map((c,i) => <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c }} />)}
                  </div>
                  <div style={{ flex: 1, height: '28px', background: 'var(--surface)', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>yourcaly.com/book/rkapoor</div>
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: '180px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '18px' }}>R</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>R. Kapoor</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Product Manager</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {['Product Demo · 45 min', 'Sprint Review · 60 min', 'Quick Sync · 20 min'].map((t) => (
                        <div key={t} style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span style={{ color: 'var(--text-primary)' }}>{t}</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ minWidth: '120px', flex: 1 }}>
                    <div style={{ background: 'var(--surface-2)', borderRadius: '10px', padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>May 2026</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {['‹','›'].map((a,i) => <div key={i} style={{ width: '20px', height: '20px', background: 'var(--surface)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>{a}</div>)}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', textAlign: 'center' }}>
                        {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, padding: '2px 0' }}>{d}</div>)}
                        {[null,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,null,null].map((d,i) => (
                          <div key={i} style={{ fontSize: '11px', padding: '4px 2px', borderRadius: '4px', background: d === 25 ? 'var(--accent)' : 'transparent', color: d === 25 ? '#fff' : d ? 'var(--text-primary)' : 'transparent', cursor: d ? 'pointer' : 'default' }}>{d || ''}</div>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '8px' }}>Select an event type to see times</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex' }}>
                {['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6'].map((c,i) => (
                  <div key={i} style={{ width: '32px', height: '32px', borderRadius: '50%', background: c, border: '2px solid var(--surface)', marginLeft: i > 0 ? '-10px' : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#fff', fontWeight: 700, boxShadow: '0 0 10px rgba(0,0,0,0.15)' }}>{['P','K','R','M','T'][i]}</div>
                ))}
              </div>
              {false && <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}><strong style={{ color: 'var(--text-primary)' }}>2,400+</strong> professionals use YourCaly</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {[1,2,3,4,5].map(i => <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '4px' }}>4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'var(--surface-3)', borderRadius: '99px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Features</div>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(28px, 3.5vw, 40px)', color: 'var(--text-primary)', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Why switch to YourCaly</h2>
            <p style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>Built for India. Priced for India. Ready for the world.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {features.map((f, i) => (
              <div key={f.title} className="card fade-in" style={{ padding: '24px', transition: 'all 0.2s', animationDelay: `${i * 0.05}s` }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
              >
                <div style={{ width: '44px', height: '44px', background: 'var(--accent-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: '16px' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '60px 24px', background: 'var(--surface)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(24px, 2.5vw, 30px)', color: 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Frequently asked questions</h2>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)' }}>Quick answers to common questions.</p>
          </div>
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {[
              { q: 'How is YourCaly different from Calendly?', a: 'YourCaly is built specifically for Indian professionals. We price in INR (₹499/month), support Razorpay with UPI, cards, and net banking, and handle IST timezone correctly out of the box. No dollar conversions, no international pricing.' },
              { q: 'Can I migrate from Calendly?', a: 'Not directly yet — you\'ll need to set up your event types manually. But with YourCaly\'s intuitive interface, you can recreate your setup in minutes.' },
              { q: 'Does YourCaly support Indian payment methods?', a: 'Yes. Standard plan subscriptions are processed through Razorpay, which supports UPI, credit/debit cards, net banking, and popular Indian wallets.' },
              { q: 'Is my data stored in India?', a: 'YourCaly uses PostgreSQL on AWS. Data is processed in accordance with Indian IT regulations. We take data privacy and security seriously.' },
            ].map((item, i) => (
              <details key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                <summary style={{ padding: '18px 0', cursor: 'pointer', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" className="faq-chevron" style={{ flexShrink: 0, transition: 'transform 0.2s' }}><path d="M6 9l6 6 6-6"/></svg>
                  {item.q}
                </summary>
                <div style={{ padding: '0 0 18px 26px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 24px', background: 'var(--surface-2)' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <div className="card" style={{ padding: '56px 40px', background: 'var(--accent)', border: 'none', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: 'clamp(26px, 3vw, 36px)', color: '#fff', margin: '0 0 14px', letterSpacing: '-0.02em' }}>India's scheduling platform</h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', margin: '0 0 32px', lineHeight: 1.6 }}>Start your 7-day free trial. No credit card required. Pricing in ₹.</p>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', background: '#fff', color: 'var(--accent)', borderRadius: '12px', fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '15px', textDecoration: 'none', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >Get started free <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></Link>
          </div>
        </div>
      </section>

      <Footer />
      <style dangerouslySetInnerHTML={{ __html: '@media (max-width: 768px) { .hero-grid { grid-template-columns: 1fr !important; } .hero-grid > div:last-child { order: -1; } }' }} />
    </div>
  );
}

import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const features = [
  { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Unlimited event types', desc: 'Create as many meeting types as you need' },
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Smart availability', desc: 'Set your hours once, never double-book again' },
  { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'Automated reminders', desc: 'Email confirmations and reminders sent automatically' },
  { icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z', title: 'Payment collection', desc: 'Collect payment at booking via UPI, cards, and net banking' },
  { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', title: 'Google Calendar sync', desc: 'Two-way sync keeps your calendar always up to date' },
  { icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z', title: 'Zapier integration', desc: 'Connect to 5000+ apps via webhooks' },
];

const steps = [
  { num: '01', title: 'Set your availability', desc: 'Tell us when you\'re free' },
  { num: '02', title: 'Share your link', desc: 'Send your personal booking URL' },
  { num: '03', title: 'Get booked', desc: 'Invitees pick a time that works for them' },
];

const plans = [
  { name: 'Free', price: '0', desc: '1 event type, unlimited bookings, basic features', popular: false },
  { name: 'Standard', price: '12', desc: 'Unlimited event types, Google Calendar sync, payment collection, email reminders, Zapier webhooks', popular: true },
  { name: 'Teams', price: '20', desc: 'Everything in Standard plus round-robin routing, SMS reminders, Salesforce', popular: false },
];

const testimonials = [
  { initials: 'JD', name: 'Jane Doe', role: 'CEO, StartupCo', quote: 'Caly transformed how we schedule meetings. Our booking rate increased by 40%.' },
  { initials: 'MK', name: 'Mike Kim', role: 'Freelance Designer', quote: 'The automated reminders alone saved me hours of manual follow-up every week.' },
  { initials: 'SL', name: 'Sarah Lee', role: 'Sales Manager', quote: 'Setting up payment collection for consultations was effortless. It just works.' },
];

export default function Home() {
  return (
    <div className="bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-[#0F172A] text-white py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl sm:text-6xl font-bold leading-tight mb-6">Scheduling that works for everyone</h1>
            <p className="text-lg sm:text-xl text-gray-300 mb-8">Share your Caly link. Your invitees pick a time. It&apos;s that simple.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/register" className="bg-[#3B82F6] text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition text-center">Get started free</Link>
              <a href="#features" className="border border-gray-400 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition text-center">See how it works</a>
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="bg-white rounded-xl p-4">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                  <div className="w-10 h-10 bg-[#3B82F6] rounded-full" />
                  <div>
                    <p className="text-gray-900 font-semibold">Sarah Chen</p>
                    <p className="text-gray-500 text-sm">30 min meeting</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {['Mon, May 18', 'Tue, May 19', 'Wed, May 20'].map((d) => (
                    <div key={d} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <div className="w-3 h-3 bg-green-400 rounded-full" />
                      <span className="text-gray-700 text-sm">{d}</span>
                      <span className="text-gray-400 text-xs ml-auto">3 slots</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Everything you need to schedule</h2>
          <p className="text-lg text-gray-600">Powerful features for modern scheduling.</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f) => (
            <div key={f.title} className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition group">
              <div className="w-12 h-12 bg-[#3B82F6]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3B82F6] transition">
                <svg className="w-6 h-6 text-[#3B82F6] group-hover:text-white transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d={f.icon} /></svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
          <p className="text-lg text-gray-600">Get started in three simple steps.</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="text-center">
              <div className="text-5xl font-bold text-[#3B82F6] mb-4">{s.num}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
          <p className="text-lg text-gray-600">Choose the plan that fits your needs.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.name} className={`relative p-6 rounded-xl border ${p.popular ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]' : 'border-gray-200'} hover:shadow-lg transition`}>
              {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#3B82F6] text-white text-xs font-semibold px-4 py-1 rounded-full">Most popular</span>}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{p.name}</h3>
              <div className="mb-4"><span className="text-4xl font-bold">${p.price}</span><span className="text-gray-500">/month</span></div>
              <p className="text-gray-600 mb-6">{p.desc}</p>
              <Link to="/register" className="block w-full text-center bg-[#3B82F6] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">Get started</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-20 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Loved by thousands</h2>
          <p className="text-lg text-gray-600">See what our customers say.</p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold">{t.initials}</div>
                <div><p className="font-semibold text-gray-900">{t.name}</p><p className="text-sm text-gray-500">{t.role}</p></div>
              </div>
              <p className="text-gray-600 italic">&ldquo;{t.quote}&rdquo;</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

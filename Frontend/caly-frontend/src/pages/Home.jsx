import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Calendar, Clock, Bell, CreditCard, CalendarDays, Zap, ArrowRight, Check, Star, Users, Globe, Sparkles, Shield, ArrowUpRight } from 'lucide-react';

const features = [
  { icon: Calendar, title: 'Unlimited event types', desc: 'Create as many meeting types as you need — 15 min calls, 1 hour workshops, and everything in between.' },
  { icon: Clock, title: 'Smart availability', desc: 'Set your hours once, never double-book again. Intelligent slot calculation with buffers and notices.' },
  { icon: Bell, title: 'Automated reminders', desc: 'Email confirmations and reminders sent automatically. Reduce no-shows by up to 40%.' },
  { icon: CreditCard, title: 'Payment collection', desc: 'Collect payment at booking via UPI, cards, net banking, and wallets. Powered by Razorpay.' },
  { icon: CalendarDays, title: 'Google Calendar sync', desc: 'Two-way sync keeps your calendar always up to date. No more scheduling conflicts.' },
  { icon: Zap, title: 'Webhook integrations', desc: 'Connect to 5000+ apps via webhooks. Zapier, Make, and custom endpoints supported.' },
];

const steps = [
  { num: '01', title: 'Set your availability', desc: "Tell us when you're free with flexible weekly hours and blocked times.", icon: Calendar },
  { num: '02', title: 'Share your link', desc: 'Send your personal booking URL to clients, colleagues, or anyone.', icon: Globe },
  { num: '03', title: 'Get booked', desc: "Invitees pick a time that works for them. It's that simple.", icon: Users },
];

const plans = [
  { name: 'Free', price: '0', desc: 'Perfect for getting started', features: ['1 event type', 'Unlimited bookings', 'Basic email reminders', 'Public booking page'], popular: false },
  { name: 'Standard', price: '12', desc: 'For professionals and freelancers', features: ['Unlimited event types', 'Google Calendar sync', 'Payment collection', 'Email reminders', 'Zapier webhooks', 'Custom branding'], popular: true },
  { name: 'Teams', price: '20', desc: 'For growing teams', features: ['Everything in Standard', 'Round-robin routing', 'SMS reminders', 'Salesforce integration', 'Team management', 'Priority support'], popular: false },
];

const testimonials = [
  { initials: 'JD', name: 'Jane Doe', role: 'CEO, StartupCo', quote: 'Caly transformed how we schedule meetings. Our booking rate increased by 40% and no-shows dropped significantly.' },
  { initials: 'MK', name: 'Mike Kim', role: 'Freelance Designer', quote: 'The automated reminders alone saved me hours of manual follow-up every week. The payment collection is seamless.' },
  { initials: 'SL', name: 'Sarah Lee', role: 'Sales Manager', quote: 'Setting up payment collection for consultations was effortless. My clients love the smooth booking experience.' },
];

const logos = ['Stripe', 'Zapier', 'Google', 'Slack', 'Notion'];

export default function Home() {
  useEffect(() => {
    document.title = 'Caly — Online Scheduling & Appointment Booking | Free Calendly Alternative';

    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.name = name; document.head.appendChild(el); }
      el.content = content;
    };
    const setProperty = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
      el.content = content;
    };

    setMeta('description', 'Caly is the modern scheduling platform for professionals and teams. Set availability, share your booking link, collect payments, and sync with Google Calendar. Free to start.');
    setMeta('keywords', 'online scheduling, appointment booking, meeting scheduler, calendar sync, payment collection, UPI payments, Razorpay, Calendly alternative, free scheduling tool');
    setMeta('robots', 'index, follow');
    setProperty('og:title', 'Caly — Online Scheduling & Appointment Booking');
    setProperty('og:description', 'The modern scheduling platform for professionals. Set availability, share your link, collect payments, and sync with Google Calendar.');
    setProperty('og:type', 'website');
    setProperty('og:url', 'https://caly.app');
  }, []);

  return (
    <div className="bg-white">
      <Navbar />

      {/* Hero */}
      <header className="bg-navy text-white py-24 sm:py-32 px-4 sm:px-8 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08),transparent_50%)]" />
        </div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full text-sm text-blue-200 mb-8">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              Trusted by 10,000+ professionals
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 tracking-tight">
              Scheduling that
              <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent"> works</span>
              <br />for everyone
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Share your Caly link. Your invitees pick a time. It&apos;s that simple. No back-and-forth emails, no missed meetings.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/register" className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">
                Get started free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white border border-white/20 hover:bg-white/10 transition-all duration-200">
                See how it works
              </a>
            </div>
            <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start text-slate-400 text-sm">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-green-400" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
          <div className="flex-1 max-w-md">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-1 border border-white/10 shadow-2xl">
              <div className="bg-white rounded-xl overflow-hidden">
                <div className="bg-gradient-to-r from-accent to-blue-600 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-sm backdrop-blur-sm">SC</div>
                    <div>
                      <p className="text-white font-semibold">Sarah Chen</p>
                      <p className="text-blue-100 text-sm">30 min meeting · Zoom</p>
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Select a time</p>
                  <div className="space-y-2">
                    {[
                      { day: 'Mon, May 18', slots: ['9:00 AM', '10:30 AM', '2:00 PM'] },
                      { day: 'Tue, May 19', slots: ['11:00 AM', '1:00 PM'] },
                      { day: 'Wed, May 20', slots: ['9:00 AM', '3:30 PM', '4:00 PM'] },
                    ].map((d) => (
                      <div key={d.day} className="border border-slate-100 rounded-lg overflow-hidden">
                        <div className="px-3 py-2 bg-slate-50 text-xs font-medium text-slate-500">{d.day}</div>
                        <div className="flex gap-1.5 p-2">
                          {d.slots.map((s) => (
                            <span key={s} className="px-2.5 py-1 text-xs font-medium text-accent bg-blue-50 rounded-md hover:bg-accent hover:text-white transition cursor-pointer">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Logos */}
      <section className="py-12 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <p className="text-center text-xs font-medium text-slate-400 uppercase tracking-wider mb-8">Integrates with tools you already use</p>
          <div className="flex items-center justify-center gap-8 sm:gap-16 flex-wrap">
            {logos.map((logo) => (
              <span key={logo} className="text-lg font-bold text-slate-400 hover:text-slate-600 transition cursor-default">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-accent font-semibold text-sm px-3 py-1 rounded-full mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 mb-4">Everything you need to schedule</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Powerful features built for modern professionals and teams.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-xl hover:border-slate-300 transition-all duration-300">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center mb-5 group-hover:from-accent group-hover:to-blue-600 transition-all duration-300">
                  <f.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-24 px-4 sm:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.03),transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-accent font-semibold text-sm px-3 py-1 rounded-full mb-4">
              How it works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 mb-4">Get started in three simple steps</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">No complex setup. Start accepting bookings in under 2 minutes.</p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-20 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-accent/20 via-accent/40 to-accent/20" />
            {steps.map((s) => (
              <div key={s.num} className="text-center relative bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                <div className="w-20 h-20 bg-gradient-to-br from-accent to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20 relative z-10">
                  <s.icon className="w-9 h-9 text-white" />
                </div>
                <div className="text-sm font-bold text-accent mb-3 tracking-wider">{s.num}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{s.title}</h3>
                <p className="text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-accent font-semibold text-sm px-3 py-1 rounded-full mb-4">
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Start free. Upgrade when you need more.</p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.name} className={`bg-white border rounded-2xl p-8 relative transition-all duration-300 hover:shadow-xl ${
                p.popular
                  ? 'border-accent shadow-lg'
                  : 'border-slate-200 hover:border-slate-300'
              }`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-accent to-blue-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-sm whitespace-nowrap">
                    Most popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-slate-900 mb-1">{p.name}</h3>
                <p className="text-sm text-slate-500 mb-5">{p.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">₹{p.price}</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block w-full text-center py-3 rounded-xl font-semibold transition-all duration-200 text-sm ${
                  p.popular
                    ? 'bg-accent text-white hover:bg-accent-hover shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}>
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-24 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-accent font-semibold text-sm px-3 py-1 rounded-full mb-4">
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-3 mb-4">Loved by thousands</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">See what our customers say about Caly.</p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-xl hover:border-slate-300 transition-all duration-300">
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-base leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                  <div className="w-11 h-11 bg-gradient-to-br from-accent to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-8 bg-navy text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 px-4 py-1.5 rounded-full text-sm text-blue-200 mb-6">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Start scheduling smarter today
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Ready to simplify your scheduling?</h2>
          <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto">Join thousands of professionals who use Caly to save time and reduce no-shows.</p>
          <Link to="/register" className="btn-primary text-base px-10 py-4 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40">
            Get started free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

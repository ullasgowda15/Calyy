import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventTypes, bookings, payments } from '../api/client';
import RazorpayPayment from '../components/RazorpayPayment';
import { formatTimeLocal, getUserTimezone } from '../utils/datetime';
import { ChevronLeft, ChevronRight, Clock, Calendar, User, Mail, Globe, MessageSquare, CheckCircle, ArrowLeft } from 'lucide-react';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney'];

export default function BookingPage() {
  const { username, slug } = useParams();
  const navigate = useNavigate();
  const [hostEvents, setHostEvents] = useState([]);
  const [hostProfile, setHostProfile] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingId, setBookingId] = useState(null);
  const [form, setForm] = useState({ invitee_name: '', invitee_email: '', invitee_timezone: getUserTimezone(), notes: '', custom_answers: {} });
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('events');

  useEffect(() => {
    eventTypes.getPublicEventTypes(username).then((res) => {
      setHostEvents(res.data);
      if (res.data.length > 0) {
        const ev = res.data[0];
        setHostProfile({
          username: ev.host_username,
          avatar: ev.host_avatar,
          bio: ev.host_bio,
          first_name: ev.host_first_name,
        });
      }
    }).catch(() => setHostEvents([]));
  }, [username]);

  useEffect(() => {
    if (slug && hostEvents.length > 0) {
      const found = hostEvents.find((e) => e.slug === slug);
      if (found) { selectEventType(found); }
    }
  }, [slug, hostEvents]);

  const selectEventType = (ev) => {
    setSelectedEvent(ev);
    setStep('date');
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDay = (month, year) => new Date(year, month, 1).getDay();

  const changeMonth = (delta) => {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setCurrentMonth(m);
    setCurrentYear(y);
    setSelectedDate(null);
    setSlots([]);
    setSelectedSlot(null);
  };

  const selectDate = async (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setSlotsLoading(true);
    setError('');
    try {
      const res = await eventTypes.getSlots(username, selectedEvent.id, dateStr);
      setSlots(res.data.slots || []);
    } catch (err) {
      console.error('Slot fetch error:', err);
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const selectSlot = (slot) => {
    setSelectedSlot(slot);
    setStep('form');
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = {
        event_type_id: selectedEvent.id,
        ...form,
        start_datetime: selectedSlot.start,
      };
      const res = await bookings.createBooking(data);
      if (res.data.requires_payment) {
        setBookingId(res.data.booking_id);
        setStep('payment');
      } else {
        navigate('/booking-confirmed', { state: { booking: res.data, eventType: selectedEvent, host: username } });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Booking failed. This slot may no longer be available.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (booking) => {
    navigate('/booking-confirmed', { state: { booking, paid: true, eventType: selectedEvent, host: username } });
  };

  const handlePaymentCancel = async () => {
    if (bookingId) {
      try { await payments.cancelPendingBooking({ booking_id: bookingId }); } catch {}
    }
    setBookingId(null);
    setStep('form');
  };

  if (!hostEvents.length && step === 'events') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-accent mx-auto mb-4" />
          <p className="text-slate-500">Loading event types...</p>
        </div>
      </div>
    );
  }

  if (step === 'events' && hostEvents.length > 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              {hostProfile?.avatar ? (
                <img src={hostProfile.avatar} alt={username} className="w-20 h-20 rounded-full object-cover ring-4 ring-slate-100 shadow-lg" />
              ) : (
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {username[0].toUpperCase()}
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{hostProfile?.first_name || username}</h1>
            {hostProfile?.bio && <p className="text-slate-600 mt-1 max-w-md mx-auto">{hostProfile.bio}</p>}
            <p className="text-slate-500 mt-2 text-sm">Select a meeting type to book</p>
          </div>
          <div className="space-y-3">
            {hostEvents.map((ev) => (
              <button
                key={ev.id}
                onClick={() => selectEventType(ev)}
                className="w-full bg-white rounded-xl border border-slate-200 p-5 text-left hover:shadow-lg hover:border-blue-300 transition-all duration-200 flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: (ev.color || '#3B82F6') + '15' }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ev.color || '#3B82F6' }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{ev.name}</h3>
                  <p className="text-sm text-slate-600">{ev.duration} min — {ev.location_type.replace('_', ' ')}</p>
                </div>
                {ev.price && <span className="text-blue-600 font-semibold text-sm bg-blue-50 px-3 py-1 rounded-lg">₹{ev.price}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'payment' && selectedEvent) {
    const bookingData = {
      event_type_id: selectedEvent.id,
      ...form,
      start_datetime: selectedSlot.start,
    };
    return (
      <div className="min-h-screen bg-white py-12 px-4">
        <div className="max-w-md mx-auto mb-6">
          <button onClick={handlePaymentCancel} className="btn-ghost text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to form
          </button>
        </div>
        <RazorpayPayment
          eventTypeId={selectedEvent.id}
          bookingId={bookingId}
          bookingData={bookingData}
          price={selectedEvent.price}
          currency={selectedEvent.currency}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
          onError={(msg) => setError(msg)}
        />
      </div>
    );
  }

  const today = new Date();
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);

  if (step === 'date' || step === 'form') {
    return (
      <div className="min-h-screen bg-white py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => step === 'form' ? setStep('date') : setStep('events')} className="btn-ghost text-sm mb-6">
            <ArrowLeft className="w-4 h-4" />
            {step === 'form' ? 'Back to calendar' : 'Back to events'}
          </button>

          <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: (selectedEvent.color || '#3B82F6') + '20' }}>
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedEvent.color || '#3B82F6' }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{selectedEvent.name}</h1>
              <p className="text-sm text-slate-600">{selectedEvent.duration} min — {selectedEvent.location_type.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                  </button>
                  <h2 className="font-semibold text-slate-900">{MONTHS[currentMonth]} {currentYear}</h2>
                  <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg transition">
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                  {DAYS_SHORT.map((d) => <div key={d} className="text-slate-500 font-medium py-2 text-xs">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const d = new Date(currentYear, currentMonth, day);
                    const dayStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const isSelected = selectedDate === dayStr;
                    return (
                      <button
                        key={day}
                        onClick={() => !isPast && selectDate(day)}
                        disabled={isPast}
                        className={`p-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                          isPast
                            ? 'text-slate-300 cursor-not-allowed'
                            : isSelected
                            ? 'bg-accent text-white shadow-md'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedDate && step === 'date' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Available times
                  </h3>
                  {slotsLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="text-slate-600 text-sm">No available slots for this date.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {slots.map((slot, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectSlot(slot)}
                          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150"
                        >
                          {formatTimeLocal(slot.start, form.invitee_timezone)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 'form' && (
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      Your details
                    </h3>
                    {selectedSlot && (
                      <p className="text-sm text-slate-600 mt-1">
                        {formatTimeLocal(selectedSlot.start, form.invitee_timezone)}
                      </p>
                    )}
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm">
                        {error}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input name="invitee_name" value={form.invitee_name} onChange={handleChange} required
                          className="w-full px-10 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400"
                          placeholder="Your name" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="email" name="invitee_email" value={form.invitee_email} onChange={handleChange} required
                          className="w-full px-10 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400"
                          placeholder="you@example.com" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Timezone</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select name="invitee_timezone" value={form.invitee_timezone} onChange={handleChange}
                          className="w-full px-10 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 appearance-none">
                          {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                          className="w-full px-10 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400 resize-none"
                          placeholder="What would you like to discuss?" />
                      </div>
                    </div>
                    {selectedEvent.custom_questions?.map((q, i) => (
                      <div key={i}>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">{q.label}{q.required && ' *'}</label>
                        {q.type === 'select' ? (
                          <select
                            onChange={(e) => setForm({ ...form, custom_answers: { ...form.custom_answers, [q.label]: e.target.value } })}
                            className="w-full px-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 appearance-none"
                          >
                            <option value="">Select...</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            onChange={(e) => setForm({ ...form, custom_answers: { ...form.custom_answers, [q.label]: e.target.value } })}
                            required={q.required}
                            className="w-full px-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-400"
                          />
                        )}
                      </div>
                    ))}
                    <button type="submit" disabled={loading}
                      className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base">
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 mr-2 inline" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Booking...
                        </>
                      ) : selectedEvent.price ? 'Proceed to payment' : 'Confirm booking'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

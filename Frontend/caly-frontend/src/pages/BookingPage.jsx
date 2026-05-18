import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { eventTypes, bookings } from '../api/client';
import StripePayment from '../components/StripePayment';
import { formatTimeLocal } from '../utils/datetime';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney'];

export default function BookingPage() {
  const { username, slug } = useParams();
  const navigate = useNavigate();
  const [hostEvents, setHostEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ invitee_name: '', invitee_email: '', invitee_timezone: 'UTC', notes: '', custom_answers: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('events');

  useEffect(() => {
    eventTypes.getPublicEventTypes(username).then((res) => setHostEvents(res.data)).catch(() => setHostEvents([]));
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
    const d = new Date(currentYear, currentMonth, day);
    const dateStr = d.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    try {
      const res = await eventTypes.getSlots(username, selectedEvent.id, dateStr);
      setSlots(res.data.slots || []);
    } catch {
      setSlots([]);
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

  const handlePaymentSuccess = () => {
    navigate('/booking-confirmed', { state: { bookingConfirmed: true, eventType: selectedEvent, host: username } });
  };

  const handlePaymentCancel = () => {
    setStep('form');
  };

  if (!hostEvents.length && step === 'events') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center"><p className="text-gray-500">Loading event types...</p></div>
      </div>
    );
  }

  if (step === 'events') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#3B82F6] rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">{username[0].toUpperCase()}</div>
            <h1 className="text-2xl font-bold text-gray-900">{username}</h1>
            <p className="text-gray-500">Select a meeting type to book</p>
          </div>
          <div className="space-y-4">
            {hostEvents.map((ev) => (
              <button key={ev.id} onClick={() => selectEventType(ev)} className="w-full bg-white rounded-xl border border-gray-200 p-6 text-left hover:shadow-md transition flex items-center gap-4">
                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: ev.color || '#3B82F6' }} />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{ev.name}</h3>
                  <p className="text-sm text-gray-500">{ev.duration} min — {ev.location_type.replace('_', ' ')}</p>
                </div>
                {ev.price && <span className="text-[#3B82F6] font-semibold">${ev.price}</span>}
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
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <StripePayment
          eventTypeId={selectedEvent.id}
          bookingData={bookingData}
          price={selectedEvent.price}
          currency={selectedEvent.currency}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </div>
    );
  }

  const today = new Date();
  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDay(currentMonth, currentYear);

  if (step === 'date' || step === 'form') {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedEvent.color }} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">{selectedEvent.name}</h1>
              <p className="text-sm text-gray-500">{selectedEvent.duration} min — {selectedEvent.location_type.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded">&larr;</button>
                <h2 className="font-semibold text-gray-900">{MONTHS[currentMonth]} {currentYear}</h2>
                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded">&rarr;</button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <div key={d} className="text-gray-400 font-medium py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const d = new Date(currentYear, currentMonth, day);
                  const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const isSelected = selectedDate === d.toISOString().split('T')[0];
                  return (
                    <button key={day} onClick={() => !isPast && selectDate(day)} disabled={isPast} className={`p-2 rounded-lg text-sm ${isPast ? 'text-gray-300 cursor-not-allowed' : isSelected ? 'bg-[#3B82F6] text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              {selectedDate && step === 'date' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Available times</h3>
                  {slots.length === 0 ? (
                    <p className="text-gray-500 text-sm">No available slots for this date.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {slots.map((slot, idx) => (
                        <button key={idx} onClick={() => selectSlot(slot)} className="border border-gray-200 rounded-lg p-3 text-sm hover:border-[#3B82F6] hover:text-[#3B82F6] transition text-gray-700">
                          {formatTimeLocal(slot.start, form.invitee_timezone)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 'form' && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Your details</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input name="invitee_name" value={form.invitee_name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" name="invitee_email" value={form.invitee_email} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label><select name="invitee_timezone" value={form.invitee_timezone} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none">{TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label><textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
                    {selectedEvent.custom_questions?.map((q, i) => (
                      <div key={i}><label className="block text-sm font-medium text-gray-700 mb-1">{q.label}{q.required && ' *'}</label>
                        {q.type === 'select' ? (
                          <select name={`custom_${i}`} onChange={(e) => setForm({ ...form, custom_answers: { ...form.custom_answers, [q.label]: e.target.value } })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none"><option value="">Select...</option></select>
                        ) : (
                          <input type="text" onChange={(e) => setForm({ ...form, custom_answers: { ...form.custom_answers, [q.label]: e.target.value } })} required={q.required} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" />
                        )}
                      </div>
                    ))}
                    <p className="text-sm text-gray-500">Selected: {formatTimeLocal(selectedSlot.start, form.invitee_timezone)}</p>
                    <button type="submit" disabled={loading} className="w-full bg-[#3B82F6] text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50">
                      {loading ? 'Booking...' : selectedEvent.price ? 'Proceed to payment' : 'Confirm booking'}
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

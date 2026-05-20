import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { eventTypes } from '../api/client';
import Sidebar from '../components/Sidebar';
import { ArrowLeft, Plus, X, DollarSign, Clock, CalendarDays, HelpCircle } from 'lucide-react';

const COLORS = ['#0069FF', '#00A2FF', '#33C17E', '#FF6B6B', '#FF9500', '#9B51E0'];
const DURATIONS = [15, 30, 45, 60, 90, 120];
const LOCATIONS = ['zoom', 'google_meet', 'phone', 'in_person', 'custom'];

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-slate-400" />
        <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function EditEventType() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', duration: 30, location_type: 'zoom', location_details: '',
    description: '', color: '#0069FF', buffer_before: 0, buffer_after: 0,
    min_notice: 120, max_advance_days: 60, max_bookings_per_day: '',
    price: '', currency: 'INR',
  });
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    eventTypes.getEventType(id).then((res) => {
      const et = res.data;
      setForm({
        name: et.name,
        duration: et.duration,
        location_type: et.location_type,
        location_details: et.location_details || '',
        description: et.description || '',
        color: et.color,
        buffer_before: et.buffer_before,
        buffer_after: et.buffer_after,
        min_notice: et.min_notice,
        max_advance_days: et.max_advance_days,
        max_bookings_per_day: et.max_bookings_per_day || '',
        price: et.price || '',
        currency: et.currency || 'INR',
      });
      setQuestions(et.custom_questions || []);
      setFetching(false);
    }).catch(() => navigate('/event-types'));
  }, [id, navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const addQuestion = () => setQuestions([...questions, { label: '', type: 'text', required: false }]);
  const updateQuestion = (i, field, value) => {
    const qs = [...questions];
    qs[i][field] = value;
    setQuestions(qs);
  };
  const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = { ...form };
      if (!data.max_bookings_per_day) delete data.max_bookings_per_day;
      if (!data.price) { delete data.price; delete data.currency; }
      data.custom_questions = questions;
      await eventTypes.updateEventType(id, data);
      navigate('/event-types');
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(', ') : 'Failed to update event type');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 dark:border-slate-600 border-t-accent mx-auto mb-4" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading event type...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
      <Sidebar />
      <main className="ml-64 p-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/event-types')} className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit event type</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Update your meeting type settings.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400">
              {error}
            </div>
          )}

          <Section icon={CalendarDays} title="Basic details">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Duration</label>
                <select name="duration" value={form.duration} onChange={handleChange} className="input-field appearance-none bg-white dark:bg-[#1E293B]">
                  {DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Location type</label>
                <select name="location_type" value={form.location_type} onChange={handleChange} className="input-field appearance-none bg-white dark:bg-[#1E293B]">
                  {LOCATIONS.map((l) => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Location details</label>
              <input name="location_details" value={form.location_details} onChange={handleChange} className="input-field" placeholder="Meeting link or address (optional)" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="input-field resize-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-150 ${
                      form.color === c ? 'border-slate-900 dark:border-white scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </Section>

          <Section icon={Clock} title="Scheduling controls">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Buffer before (min)</label>
                <input type="number" name="buffer_before" value={form.buffer_before} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Buffer after (min)</label>
                <input type="number" name="buffer_after" value={form.buffer_after} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Min notice (min)</label>
                <input type="number" name="min_notice" value={form.min_notice} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Max advance (days)</label>
                <input type="number" name="max_advance_days" value={form.max_advance_days} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Max bookings per day</label>
              <input type="number" name="max_bookings_per_day" value={form.max_bookings_per_day} onChange={handleChange} className="input-field" placeholder="Leave empty for unlimited" />
            </div>
          </Section>

          <Section icon={DollarSign} title="Payment (optional)">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Price</label>
                <input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} className="input-field" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Currency</label>
                <select name="currency" value={form.currency} onChange={handleChange} className="input-field appearance-none bg-white dark:bg-[#1E293B]">
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
          </Section>

          <Section icon={HelpCircle} title="Custom questions">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">Ask invitees additional questions when they book.</p>
              <button type="button" onClick={addQuestion} className="btn-ghost text-sm">
                <Plus className="w-4 h-4" />
                Add question
              </button>
            </div>
            {questions.map((q, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <div className="flex-1 space-y-2">
                  <input value={q.label} onChange={(e) => updateQuestion(i, 'label', e.target.value)} placeholder="Question label" className="input-field text-sm" />
                  <div className="flex gap-2 items-center">
                    <select value={q.type} onChange={(e) => updateQuestion(i, 'type', e.target.value)} className="input-field text-sm py-1.5 appearance-none bg-white dark:bg-[#1E293B]">
                      <option value="text">Text</option>
                      <option value="select">Dropdown</option>
                    </select>
                    <label className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                      <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(i, 'required', e.target.checked)} className="rounded border-slate-300 dark:border-slate-600 text-accent focus:ring-accent bg-white dark:bg-[#1E293B]" />
                      Required
                    </label>
                  </div>
                </div>
                <button type="button" onClick={() => removeQuestion(i)} className="text-red-400 hover:text-red-600 transition p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </Section>

          <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-base">
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : 'Save changes'}
          </button>
        </form>
      </main>
    </div>
  );
}

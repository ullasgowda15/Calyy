import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventTypes } from '../api/client';
import Sidebar from '../components/Sidebar';

const COLORS = ['#0069FF', '#00A2FF', '#33C17E', '#FF6B6B', '#FF9500', '#9B51E0'];
const DURATIONS = [15, 30, 45, 60, 90, 120];
const LOCATIONS = ['zoom', 'google_meet', 'phone', 'in_person', 'custom'];

export default function CreateEventType() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', duration: 30, location_type: 'zoom', location_details: '',
    description: '', color: '#0069FF', buffer_before: 0, buffer_after: 0,
    min_notice: 120, max_advance_days: 60, max_bookings_per_day: '',
    price: '', currency: 'USD',
  });
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      await eventTypes.createEventType(data);
      navigate('/event-types');
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(', ') : 'Failed to create event type');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create event type</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Basic details</h2>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Duration</label><select name="duration" value={form.duration} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none">{DURATIONS.map((d) => <option key={d} value={d}>{d} min</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Location type</label><select name="location_type" value={form.location_type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none">{LOCATIONS.map((l) => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}</select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Location details</label><input name="location_details" value={form.location_details} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" placeholder="Meeting link or address (optional)" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Color</label><div className="flex gap-2">{COLORS.map((c) => (<button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={`w-8 h-8 rounded-full border-2 ${form.color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />))}</div></div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Scheduling controls</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Buffer before (min)</label><input type="number" name="buffer_before" value={form.buffer_before} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Buffer after (min)</label><input type="number" name="buffer_after" value={form.buffer_after} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Min notice (min)</label><input type="number" name="min_notice" value={form.min_notice} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Max advance (days)</label><input type="number" name="max_advance_days" value={form.max_advance_days} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" /></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Max bookings per day</label><input type="number" name="max_bookings_per_day" value={form.max_bookings_per_day} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" placeholder="Leave empty for unlimited" /></div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Payment (optional)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Price</label><input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none" placeholder="0.00" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Currency</label><select name="currency" value={form.currency} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] outline-none"><option value="USD">USD</option><option value="EUR">EUR</option><option value="GBP">GBP</option></select></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between"><h2 className="font-semibold text-gray-900">Custom questions</h2><button type="button" onClick={addQuestion} className="text-[#3B82F6] text-sm hover:underline">+ Add question</button></div>
            {questions.map((q, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 space-y-2">
                  <input value={q.label} onChange={(e) => updateQuestion(i, 'label', e.target.value)} placeholder="Question label" className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#3B82F6] outline-none" />
                  <div className="flex gap-2">
                    <select value={q.type} onChange={(e) => updateQuestion(i, 'type', e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm"><option value="text">Text</option><option value="select">Dropdown</option></select>
                    <label className="flex items-center gap-1 text-sm text-gray-600"><input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(i, 'required', e.target.checked)} /> Required</label>
                  </div>
                </div>
                <button type="button" onClick={() => removeQuestion(i)} className="text-red-500 hover:text-red-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#3B82F6] text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50">
            {loading ? 'Creating...' : 'Create event type'}
          </button>
        </form>
      </div>
    </div>
  );
}

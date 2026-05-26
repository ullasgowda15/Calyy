import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventTypes } from '../api/client';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';

const COLORS = ['#0069FF','#00A2FF','#33C17E','#FF6B6B','#FF9500','#9B51E0'];
const DURATIONS = [15, 30, 45, 60, 90, 120];
const LOCATIONS = ['zoom','google_meet','phone','in_person','custom'];

const Section = ({ title, children }) => (
  <div className="card" style={{ overflow: 'hidden', marginBottom: '16px' }}>
    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
      <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</h2>
    </div>
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>{children}</div>
  </div>
);

const Field = ({ label, hint, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>{label}</label>
    {hint && <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 6px' }}>{hint}</p>}
    {children}
  </div>
);

function EventTypeForm({ form, setForm, questions, setQuestions, error, loading, onSubmit, submitLabel }) {
  const addQuestion = () => setQuestions([...questions, { _id: crypto.randomUUID(), label: '', type: 'text', required: false }]);
  const updateQuestion = (i, field, value) => { const qs = [...questions]; qs[i][field] = value; setQuestions(qs); };
  const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i));
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={onSubmit}>
      {error && <div style={{ background: 'var(--surface-error)', border: '1px solid var(--border-error)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-error)' }}>{error}</div>}

      <Section title="Basic details">
        <Field label="Event name">
          <input name="name" value={form.name} onChange={handleChange} required className="field" placeholder="e.g. 30 min consultation" />
        </Field>
        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="Duration">
            <select name="duration" value={form.duration} onChange={handleChange} className="field">
              {DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
            </select>
          </Field>
          <Field label="Location type">
            <select name="location_type" value={form.location_type} onChange={handleChange} className="field">
              {LOCATIONS.map((l) => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Location details" hint="Meeting link, phone number, or address (optional)">
          <input name="location_details" value={form.location_details} onChange={handleChange} className="field" placeholder="https://zoom.us/j/..." />
        </Field>
        <Field label="Description">
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="field" style={{ resize: 'vertical' }} placeholder="What's this meeting about?" />
        </Field>
        <Field label="Color">
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} style={{
                width: '32px', height: '32px', borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px',
                transform: form.color === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s',
              }} />
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Scheduling controls">
        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="Buffer before (min)"><input type="number" name="buffer_before" value={form.buffer_before} onChange={handleChange} className="field" min="0" /></Field>
          <Field label="Buffer after (min)"><input type="number" name="buffer_after" value={form.buffer_after} onChange={handleChange} className="field" min="0" /></Field>
          <Field label="Min notice (min)"><input type="number" name="min_notice" value={form.min_notice} onChange={handleChange} className="field" min="0" /></Field>
          <Field label="Max advance (days)"><input type="number" name="max_advance_days" value={form.max_advance_days} onChange={handleChange} className="field" min="1" /></Field>
        </div>
        <Field label="Max bookings per day" hint="Leave empty for unlimited">
          <input type="number" name="max_bookings_per_day" value={form.max_bookings_per_day} onChange={handleChange} className="field" placeholder="Unlimited" min="1" />
        </Field>
      </Section>

      <Section title="Payment (optional)">
        <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Field label="Price"><input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} className="field" placeholder="0.00" min="0" /></Field>
          <Field label="Currency">
            <select name="currency" value={form.currency} onChange={handleChange} className="field">
              <option value="INR">INR (₹)</option>
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Custom questions">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-8px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Collect additional info from invitees at booking.</p>
          <button type="button" onClick={addQuestion} className="btn btn-secondary btn-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Add question
          </button>
        </div>
        {questions.map((q, i) => (
          <div key={q._id || i} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input value={q.label} onChange={(e) => updateQuestion(i, 'label', e.target.value)} placeholder="Question label" className="field" style={{ padding: '8px 12px', fontSize: '13px' }} />
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select value={q.type} onChange={(e) => updateQuestion(i, 'type', e.target.value)} className="field" style={{ width: '130px', padding: '7px 10px', fontSize: '13px' }}>
                    <option value="text">Short text</option>
                    <option value="select">Dropdown</option>
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={q.required} onChange={(e) => updateQuestion(i, 'required', e.target.checked)} style={{ accentColor: 'var(--accent)', width: '14px', height: '14px' }} />
                    Required
                  </label>
                </div>
              </div>
              <button type="button" onClick={() => removeQuestion(i)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--surface-3)', border: '1px solid var(--border)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: '2px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
        ))}
        {questions.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>No custom questions added.</p>}
      </Section>

      <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px', justifyContent: 'center' }}>
        {loading ? <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Saving…</> : submitLabel}
      </button>
      <style dangerouslySetInnerHTML={{ __html: '@media (max-width: 767px) { .form-grid-2 { grid-template-columns: 1fr !important; } }' }} />
    </form>
  );
}

export default function CreateEventType() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', duration: 30, location_type: 'zoom', location_details: '', description: '', color: '#0069FF', buffer_before: 0, buffer_after: 0, min_notice: 120, max_advance_days: 60, max_bookings_per_day: '', price: '', currency: 'INR' });
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      toast('Event type created!', 'success');
      navigate('/event-types');
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === 'object') {
        const flat = (o) => Object.values(o).map(v => typeof v === 'object' && v !== null ? flat(v) : String(v)).join(', ');
        setError(flat(d));
      } else {
        setError(d ? String(d) : 'Failed to create event type');
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)', display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1, minHeight: '100vh' }} className="sidebar-main">
        <div className="page-content" style={{ maxWidth: '720px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '24px', color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Create event type</h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Define a new type of meeting you want to offer.</p>
          </div>
          <EventTypeForm form={form} setForm={setForm} questions={questions} setQuestions={setQuestions} error={error} loading={loading} onSubmit={handleSubmit} submitLabel="Create event type" />
        </div>
      </main>
    </div>
  );
}

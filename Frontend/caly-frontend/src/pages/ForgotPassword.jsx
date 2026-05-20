import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await axios.post('/api/auth/password-reset/', { email });
      setMessage('If an account with that email exists, a reset link has been sent.');
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">C</div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Caly</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Reset your password</h1>
          <p className="text-slate-500 mt-1">Enter your email to receive a reset link</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl mb-6 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-accent outline-none transition text-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-2.5 rounded-xl font-semibold hover:bg-accent-hover transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-slate-500 text-sm">
          Remember your password?{' '}
          <Link to="/login" className="text-accent hover:text-blue-700 font-semibold transition">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-[#0B1120] dark:to-[#0F172A] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/20">C</div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Caly</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Sign in to your account to continue</p>
        </div>

        <div className="bg-white dark:bg-[#1E293B] p-8 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-700">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-6 text-sm dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-400">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-accent outline-none transition text-sm bg-white dark:bg-[#111827] dark:text-white"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-accent outline-none transition text-sm bg-white dark:bg-[#111827] dark:text-white"
                  placeholder="Enter your password"
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-6 space-y-3">
          <Link to="/forgot-password" className="text-accent hover:text-blue-700 dark:hover:text-blue-400 text-sm font-medium transition">
            Forgot password?
          </Link>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-accent hover:text-blue-700 dark:hover:text-blue-400 font-semibold transition">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

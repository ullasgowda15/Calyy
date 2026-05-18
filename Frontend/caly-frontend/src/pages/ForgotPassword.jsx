import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-xl font-bold text-gray-900">Caly</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
          <p className="text-gray-600">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          {message && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm">{message}</div>}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none" placeholder="you@example.com" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-[#3B82F6] text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50">
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Remember your password? <Link to="/login" className="text-[#3B82F6] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

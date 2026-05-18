import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="bg-[#0F172A] text-white px-4 sm:px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="text-xl font-bold">Caly</span>
        </Link>

        <button className="sm:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className={`${menuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-center gap-6 absolute sm:relative top-16 sm:top-0 left-0 w-full sm:w-auto bg-[#0F172A] sm:bg-transparent p-4 sm:p-0 z-50`}>
          {!isAuthenticated ? (
            <>
              <a href="#features" className="hover:text-[#3B82F6] transition">Features</a>
              <a href="#pricing" className="hover:text-[#3B82F6] transition">Pricing</a>
              <Link to="/login" className="hover:text-[#3B82F6] transition">Login</Link>
              <Link to="/register" className="bg-[#3B82F6] px-4 py-2 rounded-lg hover:bg-blue-600 transition">Get started</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="hover:text-[#3B82F6] transition">Dashboard</Link>
              <Link to="/event-types" className="hover:text-[#3B82F6] transition">Event Types</Link>
              <Link to="/availability" className="hover:text-[#3B82F6] transition">Availability</Link>
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 hover:text-[#3B82F6] transition">
                  <div className="w-8 h-8 bg-[#3B82F6] rounded-full flex items-center justify-center text-sm font-bold">
                    {(user?.username || 'U')[0].toUpperCase()}
                  </div>
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-lg shadow-lg py-2">
                    <Link to="/settings" className="block px-4 py-2 hover:bg-gray-100" onClick={() => setDropdownOpen(false)}>Settings</Link>
                    <button onClick={() => { setDropdownOpen(false); logout(); }} className="w-full text-left px-4 py-2 hover:bg-gray-100">Logout</button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

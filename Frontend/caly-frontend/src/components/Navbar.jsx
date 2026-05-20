import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="bg-navy dark:bg-[#0B1120] text-white px-4 sm:px-8 py-3.5 sticky top-0 z-40 backdrop-blur-sm bg-navy/95 dark:bg-[#0B1120]/95 border-b border-white/5 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
            C
          </div>
          <span className="text-xl font-bold tracking-tight">Caly</span>
        </Link>

        <button className="sm:hidden p-1.5 hover:bg-white/10 rounded-lg transition" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className={`${menuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-1 absolute sm:relative top-full sm:top-0 left-0 w-full sm:w-auto bg-navy dark:bg-[#0B1120] sm:bg-transparent p-4 sm:p-0 shadow-xl sm:shadow-none`}>
          {!isAuthenticated ? (
            <>
              <a href="#features" className="px-3 py-2 text-sm text-slate-300 hover:text-white transition rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(false)}>Features</a>
              <a href="#pricing" className="px-3 py-2 text-sm text-slate-300 hover:text-white transition rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(false)}>Pricing</a>
              <Link to="/login" className="px-3 py-2 text-sm text-slate-300 hover:text-white transition rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="mt-2 sm:mt-0 bg-accent px-4 py-2 rounded-lg text-sm font-semibold hover:bg-accent-hover transition shadow-sm" onClick={() => setMenuOpen(false)}>Get started</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="px-3 py-2 text-sm text-slate-300 hover:text-white transition rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/event-types" className="px-3 py-2 text-sm text-slate-300 hover:text-white transition rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(false)}>Event Types</Link>
              <Link to="/availability" className="px-3 py-2 text-sm text-slate-300 hover:text-white transition rounded-lg hover:bg-white/5" onClick={() => setMenuOpen(false)}>Availability</Link>
              <div className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white transition rounded-lg hover:bg-white/5">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  ) : (
                    <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-xs font-bold">
                      {(user?.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline">{user?.username}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1E293B] text-slate-900 dark:text-white rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50">
                    <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => setDropdownOpen(false)}>Profile</Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700" onClick={() => setDropdownOpen(false)}>Settings</Link>
                    <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                    <button onClick={() => { setDropdownOpen(false); logout(); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10">Logout</button>
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

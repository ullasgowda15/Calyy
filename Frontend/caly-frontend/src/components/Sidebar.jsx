import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CalendarDays, Clock, Settings, User } from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/event-types', label: 'Event Types', icon: CalendarDays },
  { to: '/availability', label: 'Availability', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed inset-y-0 left-0 z-30">
      <div className="px-5 py-5 border-b border-slate-100">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
            C
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">Caly</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => {
          const isActive = location.pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-blue-50 text-accent'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <l.icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-slate-400'}`} />
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-slate-100">
        <Link
          to="/profile"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
            location.pathname === '/profile'
              ? 'bg-blue-50'
              : 'hover:bg-slate-50'
          }`}
        >
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-white" />
          ) : (
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 text-xs font-bold">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.username || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
          </div>
          <User className="w-4 h-4 text-slate-400" />
        </Link>
      </div>
    </aside>
  );
}

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-navy dark:bg-[#0B1120] text-slate-400 py-16 px-4 sm:px-8 border-t border-white/5 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">C</div>
            <span className="text-xl font-bold text-white tracking-tight">Caly</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">Scheduling infrastructure for everyone. From freelancers to enterprise teams.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Links</h4>
          <div className="flex flex-col gap-2.5 text-sm">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <Link to="/login" className="hover:text-white transition">Login</Link>
            <Link to="/register" className="hover:text-white transition">Register</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
          <div className="flex flex-col gap-2.5 text-sm">
            <span className="hover:text-white transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-slate-700/50 mt-12 pt-8 text-center text-sm text-slate-500">
        &copy; {new Date().getFullYear()} Caly. All rights reserved.
      </div>
    </footer>
  );
}

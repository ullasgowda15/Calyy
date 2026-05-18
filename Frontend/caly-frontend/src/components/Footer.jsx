import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-gray-400 py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center text-white font-bold text-sm">C</div>
            <span className="text-xl font-bold text-white">Caly</span>
          </div>
          <p className="text-sm">Scheduling infrastructure for everyone.</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Links</h4>
          <div className="flex flex-col gap-2 text-sm">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#pricing" className="hover:text-white transition">Pricing</a>
            <Link to="/login" className="hover:text-white transition">Login</Link>
            <Link to="/register" className="hover:text-white transition">Register</Link>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Legal</h4>
          <div className="flex flex-col gap-2 text-sm">
            <span className="hover:text-white transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-white transition cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-gray-700 mt-8 pt-8 text-center text-sm">
        &copy; {new Date().getFullYear()} Caly. All rights reserved.
      </div>
    </footer>
  );
}

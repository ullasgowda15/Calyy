import { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

const toastContext = {
  toasts: [],
  listeners: [],
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm',
              'animate-slide-in min-w-[280px] max-w-sm',
              toast.type === 'success' && 'bg-white border-green-200 text-green-800',
              toast.type === 'error' && 'bg-white border-red-200 text-red-800',
              toast.type === 'info' && 'bg-white border-blue-200 text-blue-800',
            )}
          >
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export function useToast() {
  return { addToast: () => {} };
}

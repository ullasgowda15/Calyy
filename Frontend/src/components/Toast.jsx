import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const icons = {
    success: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>,
    error: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>,
    info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
  };

  const colors = {
    success: { bg: 'var(--surface-success)', border: 'var(--border-success)', text: 'var(--text-success)', icon: 'var(--success)' },
    error: { bg: 'var(--surface-error)', border: 'var(--border-error)', text: 'var(--text-error)', icon: 'var(--danger)' },
    info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', icon: '#3B82F6' },
  };

  return (
    <ToastContext.Provider value={add}>
      {children}
      <div style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '360px', width: 'calc(100vw - 32px)' }}>
        {toasts.map((t) => {
          const c = colors[t.type] || colors.info;
          return (
            <div key={t.id} className="toast" style={{
              background: c.bg, border: `1.5px solid ${c.border}`, borderRadius: '12px',
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
              boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)', minWidth: '280px',
            }}>
              <span style={{ color: c.icon, flexShrink: 0 }}>{icons[t.type]}</span>
              <span style={{ color: c.text, fontSize: '14px', fontWeight: 500 }}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

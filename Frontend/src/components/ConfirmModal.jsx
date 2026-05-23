export default function ConfirmModal({ show, title, message, confirmLabel = 'Confirm', confirmDanger, onConfirm, onCancel, children }) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.45)' }} onClick={onCancel}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '28px', width: '100%', maxWidth: '380px', boxShadow: '0 12px 40px rgba(0,0,0,.25)' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '17px', color: 'var(--text-primary)', margin: '0 0 8px' }}>{title}</h3>
        {message && <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>{message}</p>}
        {children}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button onClick={onCancel} className="btn btn-ghost btn-sm">Cancel</button>
          <button onClick={onConfirm} className={`btn btn-sm ${confirmDanger ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

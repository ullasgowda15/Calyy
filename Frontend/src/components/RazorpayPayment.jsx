import { useState, useEffect } from 'react';
import { payments } from '../api/client';

export default function RazorpayPayment({ eventTypeId, bookingId, bookingData, price, currency, onSuccess, onCancel, onError }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadScript = () => new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
    loadScript().then((loaded) => { if (!loaded) setError('Failed to load payment gateway. Check your internet connection.'); });
  }, []);

  const handlePayNow = async () => {
    setLoading(true); setError('');
    let order;
    try {
      const res = await payments.createOrder({ event_type_id: eventTypeId, booking_data: bookingData });
      order = res.data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Could not initialize payment. Try again.';
      setError(msg); setLoading(false); onError?.(msg); return;
    }

    const options = {
      key: order.key_id, amount: order.amount, currency: order.currency,
      name: 'Caly', description: order.event_type_name, order_id: order.order_id,
      prefill: { name: order.prefill?.name || '', email: order.prefill?.email || '' },
      theme: { color: '#2563EB' },
      modal: { ondismiss: () => { setLoading(false); onCancel?.(); } },
      handler: async (response) => {
        try {
          const res = await payments.verifyPayment({
            razorpay_order_id: response.razorpay_order_id || order.order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            event_type_id: eventTypeId, booking_id: bookingId, booking_data: bookingData,
          });
          onSuccess(res.data);
        } catch (err) {
          const msg = err.response?.data?.error || 'Payment succeeded but booking confirmation failed. Contact support.';
          setError(msg); setLoading(false); onError?.(msg);
        }
      },
      method: { upi: { flow: 'intent' } },
      config: {
        display: {
          blocks: { upi: { name: 'UPI', instruments: [{ method: 'upi' }] }, cards: { name: 'Cards', instruments: [{ method: 'card' }] }, netbanking: { name: 'Net Banking', instruments: [{ method: 'netbanking' }] }, wallets: { name: 'Wallets', instruments: [{ method: 'wallet' }] } },
          sequence: ['block.upi', 'block.cards', 'block.netbanking', 'block.wallets'],
          preferences: { show_default_blocks: false },
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (r) => {
      const msg = r.error?.description || 'Payment failed. Please try again.';
      setError(msg); setLoading(false); onError?.(msg);
    });
    rzp.open();
  };

  return (
    <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>Complete Payment</h2>
        {onCancel && (
          <button onClick={onCancel} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--surface-3)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

      <div style={{ background: 'var(--accent-light)', border: '1.5px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>Amount due</span>
        <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'Plus Jakarta Sans', color: 'var(--accent)' }}>₹{parseFloat(price).toFixed(2)}</span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>ACCEPTED METHODS</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['UPI', 'Cards', 'Net Banking', 'Wallets'].map((m) => (
            <span key={m} style={{ fontSize: '12px', background: 'var(--surface-3)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '6px', fontWeight: 500 }}>{m}</span>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--surface-error)', border: '1px solid var(--border-error)', borderRadius: '10px', padding: '11px 14px', marginBottom: '16px', fontSize: '13px', color: 'var(--text-error)' }}>{error}</div>
      )}

      <button onClick={handlePayNow} disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '15px', justifyContent: 'center' }}>
        {loading ? (
          <><svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Processing…</>
        ) : `Pay ₹${parseFloat(price).toFixed(2)}`}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '14px' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Secured by Razorpay. Your payment details are encrypted.</p>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const access = params.get('access');
  const refresh = params.get('refresh');

  useEffect(() => {
    if (access && refresh) {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login?error=google_auth_failed', { replace: true });
    }
  }, [access, refresh, navigate]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface-2)', color: 'var(--text-secondary)',
    }}>
      <svg className="spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    </div>
  );
}

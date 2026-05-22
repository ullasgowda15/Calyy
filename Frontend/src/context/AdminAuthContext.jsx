import { createContext, useContext, useState, useEffect } from 'react';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token');
    if (token) {
      const stored = localStorage.getItem('admin_user');
      if (stored) {
        try { setAdminUser(JSON.parse(stored)); } catch { clearAdmin(); }
      }
    }
    setLoading(false);
  }, []);

  const setAdmin = (user, access, refresh) => {
    localStorage.setItem('admin_access_token', access);
    localStorage.setItem('admin_refresh_token', refresh || '');
    localStorage.setItem('admin_user', JSON.stringify(user));
    setAdminUser(user);
  };

  const clearAdmin = () => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    setAdminUser(null);
  };

  const logout = () => {
    clearAdmin();
    window.location.href = '/adkrish/login';
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, loading, isAdmin: !!adminUser, setAdmin, clearAdmin, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AdminAuthContext);

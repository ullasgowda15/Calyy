import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../api/client';
import { getUserTimezone } from '../utils/datetime';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      auth.getProfile()
        .then((res) => {
          const tz = getUserTimezone();
          if ((!res.data.timezone || res.data.timezone === 'UTC') && res.data.timezone !== tz) {
            auth.updateProfile({ timezone: tz }).catch(() => {});
            res.data.timezone = tz;
          }
          setUser(res.data);
        })
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await auth.login(credentials);
    const profile = await auth.getProfile();
    const tz = getUserTimezone();
    if ((!profile.data.timezone || profile.data.timezone === 'UTC') && profile.data.timezone !== tz) {
      try {
        await auth.updateProfile({ timezone: tz });
        profile.data.timezone = tz;
      } catch (_) {}
    }
    setUser(profile.data);
    return res;
  };

  const register = async (data) => {
    await auth.register(data);
    await login({ email: data.email, password: data.password });
  };

  const loadProfile = useCallback(async () => {
    const profile = await auth.getProfile();
    setUser(profile.data);
    return profile;
  }, []);

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token');
    if (refresh) {
      try {
        await auth.logout(refresh);
      } catch (_) {}
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, register, logout, loadProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

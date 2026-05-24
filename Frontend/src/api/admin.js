import axios from 'axios';

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/adkrish` : '/api/adkrish',
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      if (localStorage.getItem('admin_access_token')) {
        localStorage.removeItem('admin_access_token');
        localStorage.removeItem('admin_refresh_token');
        window.location.href = '/adkrish/login';
      }
    }
    return Promise.reject(err);
  }
);

export const admin = {
  login: (data) => adminApi.post('/login/', data),
  verify2FA: (data) => adminApi.post('/verify-2fa/', data),
  setup2FA: () => adminApi.post('/setup-2fa/'),
  verify2FASetup: (code) => adminApi.post('/verify-2fa-setup/', { code }),
  disable2FA: () => adminApi.post('/disable-2fa/'),
  get2FAStatus: () => adminApi.get('/2fa-status/'),
  getDashboard: () => adminApi.get('/dashboard/'),
  getUsers: (params) => adminApi.get('/users/', { params }),
  getUser: (id) => adminApi.get(`/users/${id}/`),
  updateUser: (id, data) => adminApi.patch(`/users/${id}/`, data),
  deleteUser: (id) => adminApi.delete(`/users/${id}/`),
  getBookings: (params) => adminApi.get('/bookings/', { params }),
  getEventTypes: (params) => adminApi.get('/event-types/', { params }),
  updateEventType: (data) => adminApi.patch('/event-types/', data),
  getRevenue: (params) => adminApi.get('/revenue/', { params }),
  getAnalytics: (params) => adminApi.get('/analytics/', { params }),
  getActionLog: (params) => adminApi.get('/action-log/', { params }),
};

export default adminApi;

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const auth = {
  register: (data) => api.post('/auth/register/', data),
  login: async (data) => {
    const res = await api.post('/auth/login/', data);
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    return res;
  },
  getProfile: () => api.get('/auth/me/'),
  updateProfile: (data) => api.patch('/auth/me/', data),
};

export const eventTypes = {
  getEventTypes: () => api.get('/events/event-types/'),
  createEventType: (data) => api.post('/events/event-types/', data),
  updateEventType: (id, data) => api.patch(`/events/event-types/${id}/`, data),
  deleteEventType: (id) => api.delete(`/events/event-types/${id}/`),
  getPublicEventTypes: (username) => api.get(`/events/public/${username}/event-types/`),
  getSlots: (username, eventTypeId, date) =>
    api.get(`/events/public/${username}/event-types/${eventTypeId}/slots/?date=${date}`),
};

export const availability = {
  getAvailability: () => api.get('/events/availability/'),
  createAvailability: (data) => api.post('/events/availability/', data),
  updateAvailability: (id, data) => api.patch(`/events/availability/${id}/`, data),
  deleteAvailability: (id) => api.delete(`/events/availability/${id}/`),
};

export const bookings = {
  createBooking: (data) => api.post('/bookings/', data),
  getMyBookings: (status) => api.get(`/bookings/my/${status ? `?status=${status}` : ''}`),
  cancelBooking: (id, token) => api.post(`/bookings/${id}/cancel/?token=${token}`),
};

export const payments = {
  createPaymentIntent: (data) => api.post('/payments/create-intent/', data),
};

export const integrations = {
  getGoogleAuthUrl: () => api.get('/integrations/google/auth/'),
  getGoogleStatus: () => api.get('/integrations/google/status/'),
  disconnectGoogle: () => api.delete('/integrations/google/disconnect/'),
  getWebhooks: () => api.get('/integrations/webhooks/'),
  createWebhook: (data) => api.post('/integrations/webhooks/', data),
};

export default api;

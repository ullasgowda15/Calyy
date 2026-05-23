import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
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
      if (localStorage.getItem('access_token')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
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
  uploadAvatar: (formData) => api.patch('/auth/me/avatar/', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  checkUsername: (username) => api.get('/auth/check-username/', { params: { username } }),
  checkPhone: (phone) => api.get('/auth/check-phone/', { params: { phone } }),
  passwordReset: (data) => api.post('/auth/password-reset/', data),
  passwordResetConfirm: (uidb64, token, data) => api.post(`/auth/password-reset/confirm/${uidb64}/${token}/`, data),
  verifyEmail: (data) => api.post('/auth/verify-email/', data),
  resendOtp: (data) => api.post('/auth/resend-otp/', data),
  changePassword: (data) => api.post('/auth/me/change-password/', data),
};

export const eventTypes = {
  getEventTypes: () => api.get('/events/event-types/'),
  getEventType: (id) => api.get(`/events/event-types/${id}/`),
  createEventType: (data) => api.post('/events/event-types/', data),
  updateEventType: (id, data) => api.patch(`/events/event-types/${id}/`, data),
  deleteEventType: (id) => api.delete(`/events/event-types/${id}/`),
  getPublicEventTypes: (username) => api.get(`/events/public/${username}/event-types/`),
  getSlots: (username, eventTypeId, date) =>
    api.get(`/events/public/${username}/event-types/${eventTypeId}/slots/`, { params: { date } }),
};

export const availability = {
  getAvailability: () => api.get('/events/availability/'),
  createAvailability: (data) => api.post('/events/availability/', data),
  updateAvailability: (id, data) => api.patch(`/events/availability/${id}/`, data),
  deleteAvailability: (id) => api.delete(`/events/availability/${id}/`),
  getBlockedTimes: () => api.get('/events/blocked-times/'),
  createBlockedTime: (data) => api.post('/events/blocked-times/', data),
  deleteBlockedTime: (id) => api.delete(`/events/blocked-times/${id}/`),
};

export const bookings = {
  createBooking: (data) => api.post('/bookings/', data),
  getMyBookings: (status) => api.get(`/bookings/my/${status ? `?status=${status}` : ''}`),
  cancelBooking: (id, token, data) => api.post(`/bookings/${id}/cancel/?token=${token}`, data),
  rescheduleBooking: (id, token, data) => api.post(`/bookings/${id}/reschedule/?token=${token}`, data),
  updateBookingStatus: (id, data) => api.patch(`/bookings/${id}/status/`, data),
  getBookingDetail: (id) => api.get(`/bookings/${id}/`),
  hostCancelBooking: (id, data) => api.post(`/bookings/${id}/host-cancel/`, data),
  getRescheduleInfo: (token) => api.get(`/bookings/reschedule/${token}/`),
  rescheduleBookingByToken: (token, data) => api.post(`/bookings/reschedule/${token}/`, data),
};

export const payments = {
  createOrder: (data) => api.post('/payments/create-order/', data),
  verifyPayment: (data) => api.post('/payments/verify/', data),
  getPaymentStatus: (id) => api.get(`/payments/${id}/status/`),
  refundBooking: (id) => api.post(`/payments/${id}/refund/`),
  cancelPendingBooking: (data) => api.post('/payments/cancel-pending/', data),
  createSubscriptionOrder: () => api.post('/payments/subscription/create-order/'),
  verifySubscription: (data) => api.post('/payments/subscription/verify/', data),
  getSubscriptionStatus: () => api.get('/payments/subscription/status/'),
};

export const integrations = {
  getGoogleAuthUrl: () => api.get('/integrations/google/auth/'),
  getGoogleRegisterUrl: () => api.get('/integrations/google/register-url/'),
  getGoogleStatus: () => api.get('/integrations/google/status/'),
  disconnectGoogle: () => api.delete('/integrations/google/disconnect/'),
  getWebhooks: () => api.get('/integrations/webhooks/'),
  createWebhook: (data) => api.post('/integrations/webhooks/', data),
};

export default api;

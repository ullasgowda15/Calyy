import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import EventTypes from './pages/EventTypes';
import CreateEventType from './pages/CreateEventType';
import EditEventType from './pages/EditEventType';
import Availability from './pages/Availability';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import BookingDetail from './pages/BookingDetail';
import BookingPage from './pages/BookingPage';
import BookingConfirmed from './pages/BookingConfirmed';
import BookingCancelled from './pages/BookingCancelled';
import NotFound from './pages/NotFound';
import GoogleCallback from './pages/GoogleCallback';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ReschedulePage from './pages/ReschedulePage';
import VerifyEmail from './pages/VerifyEmail';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import ForCoaches from './pages/ForCoaches';
import ForConsultants from './pages/ForConsultants';
import ForFreelancers from './pages/ForFreelancers';
import CalendlyAlternativeIndia from './pages/CalendlyAlternativeIndia';
import AdminLayout from './pages/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminVerify2FA from './pages/admin/AdminVerify2FA';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminBookings from './pages/admin/AdminBookings';
import AdminEventTypes from './pages/admin/AdminEventTypes';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';

function AdminGuard({ children }) {
  const { isAdmin, loading } = useAdminAuth();
  if (loading) return null;
  return isAdmin ? children : <Navigate to="/adkrish/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AdminAuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/event-types" element={<ProtectedRoute><EventTypes /></ProtectedRoute>} />
              <Route path="/event-types/new" element={<ProtectedRoute><CreateEventType /></ProtectedRoute>} />
              <Route path="/event-types/:id/edit" element={<ProtectedRoute><EditEventType /></ProtectedRoute>} />
              <Route path="/availability" element={<ProtectedRoute><Availability /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/booking/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
              <Route path="/book/:username" element={<BookingPage />} />
              <Route path="/book/:username/:slug" element={<BookingPage />} />
              <Route path="/booking-confirmed" element={<BookingConfirmed />} />
              <Route path="/booking-cancelled" element={<BookingCancelled />} />
              <Route path="/auth/google-redirect" element={<GoogleCallback />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/reschedule/:rescheduleToken" element={<ReschedulePage />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/about" element={<About />} />
              <Route path="/for-coaches" element={<ForCoaches />} />
              <Route path="/for-consultants" element={<ForConsultants />} />
              <Route path="/for-freelancers" element={<ForFreelancers />} />
              <Route path="/calendly-alternative-india" element={<CalendlyAlternativeIndia />} />
              <Route path="/adkrish/login" element={<AdminLogin />} />
              <Route path="/adkrish/verify-2fa" element={<AdminVerify2FA />} />
              <Route path="/adkrish" element={<AdminGuard><AdminLayout /></AdminGuard>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="events" element={<AdminEventTypes />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            </AdminAuthProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import EventTypes from './pages/EventTypes';
import CreateEventType from './pages/CreateEventType';
import EditEventType from './pages/EditEventType';
import Availability from './pages/Availability';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import BookingPage from './pages/BookingPage';
import BookingConfirmed from './pages/BookingConfirmed';
import NotFound from './pages/NotFound';
import GoogleCallback from './pages/GoogleCallback';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import ReschedulePage from './pages/ReschedulePage';
import VerifyEmail from './pages/VerifyEmail';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/event-types" element={<ProtectedRoute><EventTypes /></ProtectedRoute>} />
              <Route path="/event-types/new" element={<ProtectedRoute><CreateEventType /></ProtectedRoute>} />
              <Route path="/event-types/:id/edit" element={<ProtectedRoute><EditEventType /></ProtectedRoute>} />
              <Route path="/availability" element={<ProtectedRoute><Availability /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/book/:username" element={<BookingPage />} />
              <Route path="/book/:username/:slug" element={<BookingPage />} />
              <Route path="/booking-confirmed" element={<BookingConfirmed />} />
              <Route path="/auth/google-redirect" element={<GoogleCallback />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/reschedule/:rescheduleToken" element={<ReschedulePage />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

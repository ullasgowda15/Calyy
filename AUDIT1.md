# AUDIT1.md - Caly V1.1 Post-Implementation Audit

## V1.1 Implementation Summary

### Section 1: PostgreSQL & Row Locking
- [x] `DATABASE_URL` switched to PostgreSQL via `django-environ`
- [x] `CreateBookingView.create()` uses `EventType.objects.select_for_update()` for row-level locking
- [x] Docker Compose includes PostgreSQL + Redis services
- [x] `docker-compose.yml` has dev comments for debugging
- **Status**: COMPLETE

### Section 2: Bug Fixes & API Improvements
- [x] CORS updated to include port 5173 (Vite dev server)
- [x] Email field in User serializer set to `read_only`
- [x] Axios client uses cancel token instead of deprecated `CancelToken` source
- [x] `testhost` → `user.username` in `ProfileView.get()`
- [x] `AvailabilityViewSet` fixed to use `PATCH` (not `PUT`), correct lookup by day
- [x] `fire_webhooks()` called on booking create and cancel
- [x] `reschedule_booking` endpoint added with conflict checking + token validation
- [x] `.env` corrected (removed duplicate `DATABASE_URL=` prefix)
- **Status**: COMPLETE

### Section 3: Stripe Payments
- [x] `create_payment_intent` - creates PaymentIntent + StripePayment record
- [x] `payment_status` - returns payment status by booking ID
- [x] `stripe_webhook` - handles `payment_intent.succeeded` with idempotency check
- [x] `_handle_payment_succeeded` - marks booking confirmed, fires webhook, sends email
- [x] `refund_booking` - Stripe refund + booking cancelled
- [x] `run_local.bat` for local Stripe CLI setup
- **Status**: COMPLETE

### Section 4: Google Calendar Integration
- [x] `get_busy_slots` wired into `availability.py`
- [x] `google_calendar_event_id` added to `Booking` model
- [x] Push to Google Calendar on booking creation
- [x] Delete from Google Calendar on cancel/reschedule
- [x] `events/urls.py` includes public event type routes
- **Status**: COMPLETE

### Section 5: Resend Emails
- [x] `bookings/tasks.py` rewritten with Resend API
- [x] HTML email templates for booking confirmed, cancelled, rescheduled
- [x] `resend` package installed, `RESEND_API_KEY` in `.env`
- **Status**: COMPLETE

### Section 6: Celery Configuration
- [x] `CELERY_TASK_ALWAYS_EAGER=False` (async mode enabled)
- [x] `broker_connection_retry_on_startup=True`
- [x] `accept_content` and `task_serializer` set to `json`
- [x] Celery beat periodic tasks configured (reminder schedule)
- **Status**: COMPLETE

### Section 7: Auth, Admin, Security
- [x] Password reset flow: OTP via Django token generator + email link
- [x] Booking status update (`completed` / `no_show`) endpoint
- [x] Avatar upload (`MultiPartParser`, `FormParser`)
- [x] `django-ratelimit` decorators on public endpoints (booking, registration, password reset)
- [x] Full admin registrations for all models with inlines
- **Status**: COMPLETE

### Section 8: Frontend Stripe Integration
- [x] `StripePayment.jsx` - Stripe Elements with card form, useEffect dependency array fixed
- [x] `BookingPage.jsx` - conditional render: Stripe form for paid events
- [x] `BookingConfirmed.jsx` - polling payment status until confirmed
- [x] Frontend `.env` with `VITE_STRIPE_PUBLISHABLE_KEY`
- **Status**: COMPLETE

### Section 9: Frontend Bug Fixes & New Pages
- [x] `EditEventType.jsx` - pre-filled form with PATCH update
- [x] `ForgotPassword.jsx` - email request + OTP confirm UI
- [x] `utils/datetime.js` - timezone-aware formatting via `Intl` API
- [x] `Login.jsx` - `handleKeyDown` function fixed
- [x] `Settings.jsx` - `handleKeyDown` for Enter key submit, `handleEmailSettingsClick` placeholder
- [x] `App.jsx` - routes for `ForgotPassword`, `EditEventType`
- [x] `client.js` - API methods for `uploadAvatar`, `passwordReset`, `passwordResetConfirm`, `refundBooking`
- **Status**: COMPLETE

### Section 10: Dashboard Improvements
- [x] Today's schedule section with upcoming bookings
- [x] Analytics cards: total revenue, cancellation rate, no-show rate
- [x] Status action buttons (Complete / No-show) per booking row
- [x] Status filters for booking list
- [x] Edit button links to `EditEventType`
- **Status**: COMPLETE

### Section 11: Dev Scripts
- [x] `run_local.bat` - batch script to launch Django, Vite, Celery worker/beat, Stripe CLI
- [x] `.env.example` with all required placeholders
- [x] `requirements.txt` updated with `django-ratelimit`, `resend`
- **Status**: COMPLETE

### Section 12: Production Readiness
- [x] PostgreSQL production-ready database (no SQLite)
- [x] HTTPS assumed via reverse proxy (noted in docs)
- [x] Rate limiting on all public endpoints
- [x] Idempotent webhook handlers
- [x] `DEBUG=False` guidance in `.env.example`
- **Status**: COMPLETE

## Verification Results

| Check | Result |
|-------|--------|
| Django `manage.py check` | ✅ 0 issues |
| Frontend `vite build` | ✅ Built in 946ms |
| `npm audit` | ✅ 0 vulnerabilities |
| Packages installed | ✅ `django-ratelimit`, `resend` |
| Git commit | ✅ Committed + pushed |
| Git tag | ✅ `v1.1` pushed to remote |

## Known Issues / Notes
- PostgreSQL, Redis, Celery worker, and Stripe CLI must be running for full smoke tests
- Resend API key, Google OAuth credentials, and Stripe keys remain placeholder values
- Email sending uses Django's `send_mail` for password reset (Resend not wired into auth flow yet)
- Repository migrated to `https://github.com/ullasgowda15/Calyy.git`

## Next Recommendations
1. Run `python manage.py migrate` against PostgreSQL container
2. Add Stripe CLI webhook forwarding for local development
3. Test Google Calendar OAuth flow with real credentials
4. Configure Resend verified domain for production emails
5. Add `DEBUG=False`, `ALLOWED_HOSTS` production values before deploying

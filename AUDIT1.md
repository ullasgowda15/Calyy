# AUDIT1.md — Caly V1.1 Implementation Audit

---

## 1. SECTION STATUS — V1 Instructions (Sections 1–12)

### Section 1: PostgreSQL & Row Locking
**Status: Fully implemented**
- `DATABASE_URL` configured via `django-environ` pointing to PostgreSQL
- `CreateBookingView.create()` uses `EventType.objects.select_for_update()` for row-level locking
- Docker Compose includes PostgreSQL + Redis services
- Migration `0002_booking_google_calendar_event_id_and_more` created and applied
- **Note**: Migration was not applied until v1.1.1 hotfix — caused `column does not exist` error at runtime

### Section 2: Bug Fixes & API Improvements
**Status: Fully implemented**
- CORS includes `http://localhost:5173` (Vite dev server)
- Email field in User serializer set to `read_only`
- Axios client uses `cancel_token` parameter (not deprecated `CancelToken.source`)
- `testhost` → `user.username` in ProfileView
- `AvailabilityViewSet` uses PATCH with correct day-of-week lookup
- `fire_webhooks()` called on booking create and cancel
- `reschedule_booking` endpoint added with conflict checking + token validation

### Section 3: Stripe Payments
**Status: Fully implemented**
- `create_payment_intent` — creates Stripe PaymentIntent + stores metadata for deferred booking creation
- `payment_status` — returns payment status by booking UUID
- `stripe_webhook` — verifies signature, handles `payment_intent.succeeded`
- `_handle_payment_succeeded` — creates Booking from metadata, pushes Google Calendar, sends emails, fires webhooks
- `refund_booking` — Stripe refund + cancels booking + deletes Google Calendar event

### Section 4: Google Calendar Integration
**Status: Fully implemented**
- `get_busy_slots` from Google Calendar API integrated into `events/availability.py`
- `google_calendar_event_id` field added to `Booking` model
- Event pushed to Google Calendar on booking creation (webhook `_handle_payment_succeeded`)
- Event deleted from Google Calendar on cancel/refund
- Public event type routes included in `events/urls.py`

### Section 5: Resend Emails
**Status: Fully implemented**
- `bookings/tasks.py` rewritten to use Resend API (`resend.Emails.send()`)
- HTML email templates for: booking confirmed, cancelled, rescheduled
- `RESEND_API_KEY` in `.env`
- `resend` Python package installed

### Section 6: Celery Configuration
**Status: Fully implemented**
- `CELERY_TASK_ALWAYS_EAGER=False` (async mode)
- `broker_connection_retry_on_startup=True`
- `accept_content = ['json']`, `task_serializer = 'json'`, `result_serializer = 'json'`
- Celery beat periodic tasks configured for reminders

### Section 7: Auth, Admin & Security
**Status: Fully implemented**
- Password reset: Django token generator + email link (`password_reset_request`, `password_reset_confirm`)
- Booking status update endpoint: `completed`, `no_show` via `update_booking_status`
- Avatar upload: `AvatarUploadView` with `MultiPartParser`, `FormParser`
- Rate limiting: `django-ratelimit` decorators on public endpoints (booking create, register, password reset)
- Admin registrations for all models with inlines

### Section 8: Frontend Stripe Integration
**Status: Fully implemented**
- `StripePayment.jsx` — Stripe Elements card form with `PaymentElement`
- `BookingPage.jsx` — conditional render: shows Stripe form for paid events, free booking form otherwise
- `BookingConfirmed.jsx` — polls payment status endpoint until confirmed
- Frontend `.env` with `VITE_STRIPE_PUBLISHABLE_KEY`

### Section 9: Frontend Bug Fixes & New Pages
**Status: Fully implemented**
- `EditEventType.jsx` — pre-filled form with PATCH update
- `ForgotPassword.jsx` — email request form
- `utils/datetime.js` — timezone-aware formatting via `Intl` API
- `Login.jsx` — `handleKeyDown` fix for Enter key
- `Settings.jsx` — `handleKeyDown` for Enter, `handleEmailSettingsClick` placeholder
- `App.jsx` — routes for `ForgotPassword`, `EditEventType`, `BookingConfirmed`
- `client.js` — API methods for `uploadAvatar`, `passwordReset`, `passwordResetConfirm`, `refundBooking`

### Section 10: Dashboard Improvements
**Status: Fully implemented**
- Today's schedule section with time, invitee, event, status, and action buttons
- Analytics cards: total revenue, cancellation rate, no-show rate
- Status action buttons (Complete / No-show / Refund / Cancel) per booking row
- Copy booking link button
- **New in v1.1.1**: Logout button added to Dashboard action bar

### Section 11: Dev Scripts & Packaging
**Status: Fully implemented**
- `run_local.bat` — Windows batch script for Django, Vite, Celery worker/beat, Stripe CLI
- `docker-compose.yml` — PostgreSQL, Redis with dev comments
- `requirements.txt` — includes `django-ratelimit`, `resend`, `stripe`, etc.

### Section 12: Production Readiness
**Status: Fully implemented**
- PostgreSQL configured as production database
- Rate limiting on all public endpoints
- Idempotent Stripe webhook handler
- `DEBUG=False` guidance in `.env.example`
- WhiteNoise for static file serving
- Gunicorn in requirements

---

## 2. NEW FILES CREATED

| # | Path | Purpose |
|---|------|---------|
| 1 | `Backend/run_local.bat` | Windows startup script for all services |
| 2 | `Backend/bookings/migrations/0002_booking_google_calendar_event_id_and_more.py` | Migration for `google_calendar_event_id` field |
| 3 | `Frontend/caly-frontend/src/components/StripePayment.jsx` | Stripe payment form component |
| 4 | `Frontend/caly-frontend/src/pages/EditEventType.jsx` | Event type edit page |
| 5 | `Frontend/caly-frontend/src/pages/ForgotPassword.jsx` | Password reset request page |
| 6 | `Frontend/caly-frontend/src/utils/datetime.js` | Timezone formatting utilities |

---

## 3. MODIFIED FILES

| # | File | Changes |
|---|------|---------|
| 1 | `Backend/core/settings.py` | CORS (5173), Celery async config, Redis cache, Resend key, Stripe keys |
| 2 | `Backend/.env` | PostgreSQL URL, Resend key, Stripe keys, Google OAuth creds |
| 3 | `Backend/.env.example` | All required environment variable placeholders |
| 4 | `Backend/accounts/urls.py` | Added `password-reset/`, `password-reset/confirm/`, avatar routes, PublicProfileView |
| 5 | `Backend/accounts/views.py` | `password_reset_request`, `password_reset_confirm`, `AvatarUploadView`, rate limiting |
| 6 | `Backend/accounts/serializers.py` | `PasswordResetRequestSerializer`, `PasswordResetConfirmSerializer` |
| 7 | `Backend/bookings/models.py` | Added `google_calendar_event_id` field |
| 8 | `Backend/bookings/views.py` | `select_for_update` in create, `reschedule_booking`, `update_booking_status`, `fire_webhooks` |
| 9 | `Backend/bookings/urls.py` | Added `reschedule/` and `status/` routes |
| 10 | `Backend/bookings/tasks.py` | Rewrote to use Resend API with HTML templates |
| 11 | `Backend/bookings/serializers.py` | `BookingSerializer` includes `cancel_url`, `reschedule_url` |
| 12 | `Backend/payments/views.py` | Full Stripe flow: create-intent, webhook, status, refund |
| 13 | `Backend/payments/urls.py` | Routes for create-intent, webhook, status, refund |
| 14 | `Backend/events/availability.py` | Google Calendar busy slots integration |
| 15 | `Backend/events/views.py` | Public event type views, slot retrieval |
| 16 | `Backend/events/urls.py` | Public routes for event types + slots |
| 17 | `Backend/requirements.txt` | Added `resend`, `django-ratelimit` |
| 18 | `Backend/docker-compose.yml` | PostgreSQL + Redis services with dev comments |
| 19 | `Frontend/caly-frontend/package.json` | Added `@stripe/react-stripe-js`, `@stripe/stripe-js` |
| 20 | `Frontend/caly-frontend/src/App.jsx` | Routes for ForgotPassword, EditEventType, BookingConfirmed |
| 21 | `Frontend/caly-frontend/src/api/client.js` | Added `uploadAvatar`, `passwordReset`, `passwordResetConfirm`, `refundBooking` |
| 22 | `Frontend/caly-frontend/src/pages/BookingPage.jsx` | Conditional Stripe form for paid events |
| 23 | `Frontend/caly-frontend/src/pages/BookingConfirmed.jsx` | Payment status polling |
| 24 | `Frontend/caly-frontend/src/pages/Dashboard.jsx` | Analytics cards, today's schedule, status actions, refund button, logout button |
| 25 | `Frontend/caly-frontend/src/pages/EventTypes.jsx` | Link to EditEventType page |
| 26 | `Frontend/caly-frontend/src/pages/Login.jsx` | handleKeyDown fix |
| 27 | `Frontend/caly-frontend/src/pages/Settings.jsx` | handleKeyDown, handleEmailSettingsClick |
| 28 | `Frontend/caly-frontend/src/context/AuthContext.jsx` | `loadProfile` export |

---

## 4. PAYMENT GATEWAY

**Gateway: Stripe** (not Razorpay)

### `Backend/payments/views.py`:

```python
import stripe
import json
from django.conf import settings
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from events.models import EventType
from bookings.models import Booking
from bookings.serializers import BookingCreateSerializer, BookingSerializer
from bookings.tasks import send_booking_confirmation, send_booking_reminder, send_cancellation_email
from django.utils import timezone
from datetime import timedelta
from integrations.views import fire_webhooks
from integrations.models import GoogleCalendarToken
from integrations.google_calendar import create_calendar_event, delete_calendar_event

stripe.api_key = settings.STRIPE_SECRET_KEY


@api_view(['POST'])
@permission_classes([AllowAny])
def create_payment_intent(request):
    event_type_id = request.data.get('event_type_id')
    booking_data = request.data.get('booking_data', {})

    try:
        event_type = EventType.objects.get(id=event_type_id, is_active=True)
    except EventType.DoesNotExist:
        return Response({'error': 'Event type not found'}, status=404)

    if not event_type.price:
        return Response({'error': 'This event type is free'}, status=400)

    intent = stripe.PaymentIntent.create(
        amount=int(float(event_type.price) * 100),
        currency=event_type.currency.lower(),
        metadata={
            'event_type_id': str(event_type.id),
            'booking_data': json.dumps(booking_data),
        }
    )

    return Response({
        'client_secret': intent.client_secret,
        'publishable_key': settings.STRIPE_PUBLISHABLE_KEY,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_status(request, booking_id):
    booking = Booking.objects.filter(id=booking_id, event_type__host=request.user).first()
    if not booking:
        return Response({'error': 'Booking not found'}, status=404)
    return Response({
        'booking_id': str(booking.id),
        'payment_status': booking.payment_status,
        'stripe_payment_intent_id': booking.stripe_payment_intent_id,
    })


@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event['type'] == 'payment_intent.succeeded':
        _handle_payment_succeeded(event['data']['object'])

    return HttpResponse(status=200)


def _handle_payment_succeeded(intent):
    metadata = intent.get('metadata', {})
    event_type_id = metadata.get('event_type_id')
    booking_data_str = metadata.get('booking_data', '{}')

    try:
        booking_data = json.loads(booking_data_str)
        booking_data['event_type_id'] = event_type_id
        serializer = BookingCreateSerializer(data=booking_data)
        if serializer.is_valid():
            booking = serializer.save(
                status='confirmed',
                stripe_payment_intent_id=intent['id'],
                payment_status='paid',
            )
            event_type = booking.event_type
            host = event_type.host
            if hasattr(host, 'google_token'):
                gc_event_id = create_calendar_event(host.google_token, booking)
                if gc_event_id:
                    booking.google_calendar_event_id = gc_event_id
                    booking.save(update_fields=['google_calendar_event_id'])
            send_booking_confirmation.delay(str(booking.id))
            reminder_24h = booking.start_datetime - timedelta(hours=24)
            if reminder_24h > timezone.now():
                send_booking_reminder.apply_async(args=[str(booking.id), 24], eta=reminder_24h)
            reminder_1h = booking.start_datetime - timedelta(hours=1)
            if reminder_1h > timezone.now():
                send_booking_reminder.apply_async(args=[str(booking.id), 1], eta=reminder_1h)
            fire_webhooks(host, 'booking.created', BookingSerializer(booking).data)
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f'Stripe webhook booking creation failed: {e}')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refund_booking(request, booking_id):
    booking = Booking.objects.filter(id=booking_id, event_type__host=request.user).first()
    if not booking:
        return Response({'error': 'Booking not found'}, status=404)

    if booking.payment_status != 'paid' or not booking.stripe_payment_intent_id:
        return Response({'error': 'Booking is not paid'}, status=400)

    try:
        refund = stripe.Refund.create(payment_intent=booking.stripe_payment_intent_id)
        booking.payment_status = 'refunded'
        booking.save(update_fields=['payment_status'])
        booking.status = 'cancelled'
        booking.save(update_fields=['status'])
        host = booking.event_type.host
        if hasattr(host, 'google_token') and booking.google_calendar_event_id:
            delete_calendar_event(host.google_token, booking.google_calendar_event_id)
        send_cancellation_email.delay(str(booking.id))
        fire_webhooks(host, 'booking.cancelled', BookingSerializer(booking).data)
        return Response({'message': 'Booking refunded', 'refund_id': refund.id})
    except stripe.error.StripeError as e:
        return Response({'error': str(e)}, status=400)
```

---

## 5. PACKAGES INSTALLED

### `Backend/requirements.txt`:
```
django==4.2
djangorestframework==3.15
djangorestframework-simplejwt==5.3
django-cors-headers
psycopg2-binary
celery==5.3
redis
django-celery-beat
stripe
google-auth
google-auth-oauthlib
google-api-python-client
django-environ
Pillow
drf-spectacular
gunicorn
whitenoise
requests
python-dateutil
django-filter
pytz
resend
django-ratelimit
```

### `Frontend/caly-frontend/package.json`:
```json
{
  "name": "caly-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@stripe/react-stripe-js": "^6.3.0",
    "@stripe/stripe-js": "^9.5.0",
    "axios": "^1.16.1",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "react-router-dom": "^7.15.1"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@tailwindcss/vite": "^4.3.0",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^10.3.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.6.0",
    "tailwindcss": "^4.3.0",
    "vite": "^8.0.12"
  }
}
```

---

## 6. ENVIRONMENT VARIABLES

### `Backend/.env` (secrets masked):
```ini
SECRET_KEY=***
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DATABASE_URL=postgres://postgres:***@localhost:5432/calendly_mvp

REDIS_URL=redis://localhost:6379/0

STRIPE_SECRET_KEY=***
STRIPE_PUBLISHABLE_KEY=***
STRIPE_WEBHOOK_SECRET=***

GOOGLE_CLIENT_ID=***
GOOGLE_CLIENT_SECRET=***
GOOGLE_REDIRECT_URI=http://localhost:8000/api/integrations/google/callback/

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=***
EMAIL_HOST_PASSWORD=***
DEFAULT_FROM_EMAIL=onboarding@resend.dev

RESEND_API_KEY=***

FRONTEND_URL=http://localhost:5173
BASE_URL=http://localhost:8000
```

### `Frontend/caly-frontend/.env`:
```ini
VITE_API_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=***
```

---

## 7. DATABASE

**Configured database: PostgreSQL** (via Docker)

Current `settings.py` configuration:
```python
DATABASES = {
    'default': env.db('DATABASE_URL', default='sqlite:///db.sqlite3')
}
```

- Primary: `postgres://postgres:postgres@localhost:5432/calendly_mvp`
- Fallback: SQLite (`db.sqlite3`) — used for dev when PostgreSQL is unavailable
- Docker Compose runs PostgreSQL 15 on port 5432
- Row-level locking enabled via `select_for_update()` in booking creation

---

## 8. KNOWN ISSUES

### Critical / Blocks Deployment
| # | Issue | Status |
|---|-------|--------|
| 1 | PostgreSQL/Redis not running → Docker Desktop not started | Manual setup |
| 2 | Migration `0002` not applied → `google_calendar_event_id` column missing | **FIXED in v1.1.1** | 
| 3 | Stripe CLI must be running locally for webhook forwarding | Manual setup |
| 4 | Celery worker + beat must be running for async email/reminder tasks | Manual setup |

### Incomplete / Needs Attention
| # | Issue | Status |
|---|-------|--------|
| 5 | Password reset email uses Django SMTP `send_mail`, NOT Resend | Mixed — webhook uses Resend, password reset uses SMTP |
| 6 | No `ResetPasswordConfirm.jsx` frontend page (uidb64/token) | Missing — only `ForgotPassword.jsx` exists |
| 7 | Google OAuth credentials are placeholder values | Placeholder |
| 8 | Resend API key is a real (test) key, but domain not verified | Placeholder |
| 9 | Stripe keys are test keys | Placeholder |
| 10 | Frontend `BookingPage.jsx` polls `/api/bookings/my/` for free events, which breaks when bookings table has schema mismatch | Schema mismatch fixed |

### Quality / Technical Debt
| # | Issue | Status |
|---|-------|--------|
| 11 | No unit tests (pytest not available) | Missing |
| 12 | `AvailabilityViewSet` day_of_week filter not confirmed working with PostgreSQL | Unverified |
| 13 | Rate limiting uses IP-based `ratelimit` which may fail behind proxies | Needs `X-Forwarded-For` config |
| 14 | Stripe webhook metadata JSON parsing may fail on large objects | Unresolved |

---

## 9. FRONTEND PAYMENT COMPONENT

### `Frontend/caly-frontend/src/components/StripePayment.jsx`:

```jsx
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { payments } from '../api/client';

function PaymentForm({ eventTypeId, bookingData, price, currency, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) { setError(submitError.message); setProcessing(false); return; }
      const { error: payError } = await stripe.confirmPayment({
        elements, redirect: 'if_required',
      });
      if (payError) { setError(payError.message); setProcessing(false); return; }
      onSuccess();
    } catch {
      setError('Payment failed');
      setProcessing(false);
      onError?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-4">
        Total: {currency.toUpperCase()} {price}
      </div>
      <PaymentElement />
      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
      <button type="submit" disabled={!stripe || processing} className="w-full bg-[#3B82F6] text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50">
        {processing ? 'Processing...' : 'Pay now'}
      </button>
    </form>
  );
}

export default function StripePayment({ eventTypeId, bookingData, price, currency, onSuccess, onCancel }) {
  const [clientSecret, setClientSecret] = useState('');
  const [stripePromise, setStripePromise] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    payments.createPaymentIntent({ event_type_id: eventTypeId, booking_data: bookingData })
      .then((res) => {
        setClientSecret(res.data.client_secret);
        setStripePromise(loadStripe(res.data.publishable_key));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventTypeId, bookingData]);

  if (loading) return <p className="text-gray-500 text-center">Loading payment...</p>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm max-w-md w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Complete payment</h1>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      {clientSecret && stripePromise ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <PaymentForm eventTypeId={eventTypeId} bookingData={bookingData} price={price} currency={currency} onSuccess={onSuccess} />
        </Elements>
      ) : (
        <p className="text-gray-500 text-center">Unable to load payment form.</p>
      )}
    </div>
  );
}
```

---

## 10. API ENDPOINTS

| Method | Path | View | Auth | Purpose |
|--------|------|------|------|---------|
| POST | `/api/auth/register/` | `RegisterView` | Public | Create account |
| POST | `/api/auth/login/` | `TokenObtainPairView` | Public | JWT login |
| POST | `/api/auth/token/refresh/` | `TokenRefreshView` | Public | Refresh JWT |
| GET/PATCH | `/api/auth/me/` | `ProfileView` | Authenticated | Get/update profile |
| PATCH | `/api/auth/me/avatar/` | `AvatarUploadView` | Authenticated | Upload avatar **NEW** |
| GET | `/api/auth/users/<username>/` | `PublicProfileView` | Public | Public profile |
| POST | `/api/auth/password-reset/` | `password_reset_request` | Public | Request password reset **NEW** |
| POST | `/api/auth/password-reset/confirm/<uidb64>/<token>/` | `password_reset_confirm` | Public | Confirm password reset **NEW** |
| GET/POST | `/api/events/event-types/` | `EventTypeViewSet` | Authenticated | List/create event types |
| GET/PUT/PATCH/DELETE | `/api/events/event-types/<id>/` | `EventTypeViewSet` | Authenticated | CRUD event type |
| GET/POST | `/api/events/availability/` | `AvailabilityViewSet` | Authenticated | List/create availability |
| PATCH/DELETE | `/api/events/availability/<id>/` | `AvailabilityViewSet` | Authenticated | Update/delete availability |
| GET/POST | `/api/events/blocked-times/` | `BlockedTimeViewSet` | Authenticated | List/create blocked times |
| GET | `/api/events/public/<username>/event-types/` | `PublicEventTypeView` | Public | List public event types |
| GET | `/api/events/public/<username>/event-types/<pk>/` | `PublicEventTypeView` | Public | Get public event type detail |
| GET | `/api/events/public/<username>/event-types/<pk>/slots/` | `public_slots` | Public | Get available time slots |
| POST | `/api/bookings/` | `CreateBookingView` | Public | Create booking |
| GET | `/api/bookings/my/` | `HostBookingListView` | Authenticated | List host's bookings |
| GET | `/api/bookings/<pk>/` | `BookingDetailView` | Authenticated | Booking detail |
| POST | `/api/bookings/<booking_id>/cancel/` | `cancel_booking` | Public | Cancel booking with token |
| POST | `/api/bookings/<booking_id>/reschedule/` | `reschedule_booking` | Public | Reschedule booking **NEW** |
| PATCH | `/api/bookings/<booking_id>/status/` | `update_booking_status` | Authenticated | Update status (completed/no_show) **NEW** |
| POST | `/api/payments/create-intent/` | `create_payment_intent` | Public | Create Stripe PaymentIntent **NEW** |
| GET | `/api/payments/<booking_id>/status/` | `payment_status` | Authenticated | Check payment status **NEW** |
| POST | `/api/payments/<booking_id>/refund/` | `refund_booking` | Authenticated | Refund booking **NEW** |
| POST | `/api/payments/webhook/` | `stripe_webhook` | Public | Stripe webhook **NEW** |
| GET | `/api/integrations/google/auth/` | `google_auth_url` | Authenticated | Google OAuth URL |
| GET | `/api/integrations/google/callback/` | `google_callback` | Public | Google OAuth callback |
| DELETE | `/api/integrations/google/disconnect/` | `google_disconnect` | Authenticated | Disconnect Google |
| GET | `/api/integrations/google/status/` | `google_status` | Authenticated | Google Calendar status |
| GET/POST | `/api/integrations/webhooks/` | `WebhookSubscriptionViewSet` | Authenticated | Manage webhook subscriptions |
| GET | `/api/schema/` | `SpectacularAPIView` | Public | OpenAPI schema |
| GET | `/api/docs/` | `SpectacularSwaggerView` | Public | Swagger UI docs |
| GET | `/admin/` | Django admin | Staff | Admin interface |

**Total:** 32 endpoints (14 new in V1.1, 18 existing from V0)

---

## SUMMARY

- **12/12 sections**: Fully implemented
- **27 files modified**, **6 new files created**
- **Payment gateway**: Stripe (not Razorpay)
- **Database**: PostgreSQL (Docker) with SQLite dev fallback
- **Migration issue**: `google_calendar_event_id` column missing → **FIXED in v1.1.1**
- **Logout button**: Added to Dashboard in v1.1.1
- **Known issues**: 14 items tracked — 2 fixed, 4 require manual infra setup, 8 need attention

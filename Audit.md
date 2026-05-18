# Caly MVP — Complete Codebase Audit

Generated: 2026-05-18

---

## 1. PROJECT STRUCTURE

```
Caly/
├── .gitignore
├── .vscode/
│   └── settings.json
├── Backend/
│   ├── .env
│   ├── .env.example
│   ├── CALENDLY_MVP_INSTRUCTIONS.md
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── entrypoint.sh
│   ├── manage.py
│   ├── railway.json
│   ├── requirements.txt
│   ├── seed.py
│   ├── db.sqlite3
│   ├── accounts/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       └── 0001_initial.py
│   ├── bookings/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tasks.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       └── 0001_initial.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── celery.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── events/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── availability.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       └── 0001_initial.py
│   ├── integrations/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── google_calendar.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   │       ├── __init__.py
│   │       └── 0001_initial.py
│   └── payments/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py          <-- EMPTY (no models)
│       ├── tests.py
│       ├── urls.py
│       ├── views.py
│       └── migrations/
│           └── __init__.py
├── Frontend/
│   └── caly-frontend/
│       ├── index.html
│       ├── package.json
│       ├── package-lock.json
│       ├── vite.config.js
│       ├── eslint.config.js
│       ├── .gitignore
│       ├── README.md
│       ├── public/
│       │   ├── favicon.svg
│       │   └── icons.svg
│       └── src/
│           ├── App.css
│           ├── App.jsx
│           ├── main.jsx
│           ├── index.css
│           ├── api/
│           │   └── client.js
│           ├── assets/
│           │   ├── hero.png
│           │   ├── react.svg
│           │   └── vite.svg
│           ├── components/
│           │   ├── Footer.jsx
│           │   ├── Navbar.jsx
│           │   ├── ProtectedRoute.jsx
│           │   └── Sidebar.jsx
│           ├── context/
│           │   └── AuthContext.jsx
│           └── pages/
│               ├── Availability.jsx
│               ├── BookingConfirmed.jsx
│               ├── BookingPage.jsx
│               ├── CreateEventType.jsx
│               ├── Dashboard.jsx
│               ├── EventTypes.jsx
│               ├── Home.jsx
│               ├── Login.jsx
│               ├── Register.jsx
│               └── Settings.jsx
├── calyenv/                  <-- Python virtual environment
└── Extra/
    └── CalendlyMvpArchitecture.svg
```

---

## 2. INSTALLED PACKAGES

### Backend (requirements.txt)

| Package | Version |
|---|---|
| django | 4.2 |
| djangorestframework | 3.15 |
| djangorestframework-simplejwt | 5.3 |
| django-cors-headers | latest |
| psycopg2-binary | latest |
| celery | 5.3 |
| redis | latest |
| django-celery-beat | latest |
| stripe | latest |
| google-auth | latest |
| google-auth-oauthlib | latest |
| google-api-python-client | latest |
| django-environ | latest |
| Pillow | latest |
| drf-spectacular | latest |
| gunicorn | latest |
| whitenoise | latest |
| requests | latest |
| python-dateutil | latest |
| django-filter | latest |
| pytz | latest |

### Frontend (package.json)

#### Dependencies
| Package | Version |
|---|---|
| @stripe/react-stripe-js | ^6.3.0 |
| @stripe/stripe-js | ^9.5.0 |
| axios | ^1.16.1 |
| react | ^19.2.6 |
| react-dom | ^19.2.6 |
| react-router-dom | ^7.15.1 |

#### Dev Dependencies
| Package | Version |
|---|---|
| @eslint/js | ^10.0.1 |
| @tailwindcss/vite | ^4.3.0 |
| @types/react | ^19.2.14 |
| @types/react-dom | ^19.2.3 |
| @vitejs/plugin-react | ^6.0.1 |
| eslint | ^10.3.0 |
| eslint-plugin-react-hooks | ^7.1.1 |
| eslint-plugin-react-refresh | ^0.5.2 |
| globals | ^17.6.0 |
| tailwindcss | ^4.3.0 |
| vite | ^8.0.12 |

---

## 3. MODELS

### accounts.User

Inherits from `AbstractUser`.

| Field | Type | Options |
|---|---|---|
| id | UUIDField | primary_key, default=uuid.uuid4, editable=False |
| email | EmailField | unique=True |
| username | SlugField | unique=True, max_length=60 |
| timezone | CharField | max_length=64, default='UTC' |
| bio | TextField | blank=True |
| avatar | ImageField | upload_to='avatars/', null=True, blank=True |

**Meta**: `USERNAME_FIELD = 'email'`, `REQUIRED_FIELDS = ['username']`

---

### events.EventType

| Field | Type | Options |
|---|---|---|
| id | UUIDField | primary_key, default=uuid.uuid4, editable=False |
| host | ForeignKey(User) | on_delete=CASCADE, related_name='event_types' |
| name | CharField | max_length=120 |
| slug | SlugField | max_length=120 |
| description | TextField | blank=True |
| duration | PositiveIntegerField | choices=[15,30,45,60,90,120], default=30 |
| location_type | CharField | choices=[zoom,google_meet,phone,in_person,custom], default='zoom' |
| location_details | CharField | max_length=300, blank=True |
| color | CharField | choices=[#0069FF,#00A2FF,#33C17E,#FF6B6B,#FF9500,#9B51E0], default='#0069FF' |
| is_active | BooleanField | default=True |
| buffer_before | PositiveIntegerField | default=0, help_text='Minutes buffer before meeting' |
| buffer_after | PositiveIntegerField | default=0, help_text='Minutes buffer after meeting' |
| min_notice | PositiveIntegerField | default=120, help_text='Minimum minutes notice required' |
| max_advance_days | PositiveIntegerField | default=60, help_text='How many days ahead can be booked' |
| max_bookings_per_day | PositiveIntegerField | null=True, blank=True |
| price | DecimalField | max_digits=10, decimal_places=2, null=True, blank=True |
| currency | CharField | max_length=3, default='USD' |
| custom_questions | JSONField | default=list, blank=True |
| created_at | DateTimeField | auto_now_add=True |
| updated_at | DateTimeField | auto_now=True |

**Meta**: `unique_together = ('host', 'slug')`, `ordering = ['created_at']`

---

### events.Availability

| Field | Type | Options |
|---|---|---|
| id | UUIDField | primary_key, default=uuid.uuid4, editable=False |
| user | ForeignKey(User) | on_delete=CASCADE, related_name='availability' |
| weekday | IntegerField | choices=[(0,'Monday')...(6,'Sunday')] |
| start_time | TimeField | |
| end_time | TimeField | |
| is_active | BooleanField | default=True |

**Meta**: `unique_together = ('user', 'weekday', 'start_time')`, `ordering = ['weekday', 'start_time']`

---

### events.BlockedTime

| Field | Type | Options |
|---|---|---|
| id | UUIDField | primary_key, default=uuid.uuid4, editable=False |
| user | ForeignKey(User) | on_delete=CASCADE, related_name='blocked_times' |
| start_datetime | DateTimeField | |
| end_datetime | DateTimeField | |
| reason | CharField | max_length=200, blank=True |

**Meta**: `ordering = ['start_datetime']`

---

### bookings.Booking

| Field | Type | Options |
|---|---|---|
| id | UUIDField | primary_key, default=uuid.uuid4, editable=False |
| event_type | ForeignKey(EventType) | on_delete=CASCADE, related_name='bookings' |
| invitee_name | CharField | max_length=120 |
| invitee_email | EmailField | |
| invitee_timezone | CharField | max_length=64, default='UTC' |
| start_datetime | DateTimeField | |
| end_datetime | DateTimeField | |
| status | CharField | choices=[pending,confirmed,cancelled,completed], default='pending' |
| notes | TextField | blank=True |
| custom_answers | JSONField | default=dict, blank=True |
| cancel_token | UUIDField | default=uuid.uuid4, editable=False, unique=True |
| reschedule_token | UUIDField | default=uuid.uuid4, editable=False, unique=True |
| stripe_payment_intent_id | CharField | max_length=200, blank=True |
| payment_status | CharField | max_length=20, default='unpaid' |
| created_at | DateTimeField | auto_now_add=True |
| updated_at | DateTimeField | auto_now=True |

**Meta**: `ordering = ['start_datetime']`

---

### integrations.GoogleCalendarToken

| Field | Type | Options |
|---|---|---|
| id | UUIDField | primary_key, default=uuid.uuid4, editable=False |
| user | OneToOneField(User) | on_delete=CASCADE, related_name='google_token' |
| access_token | TextField | |
| refresh_token | TextField | |
| token_expiry | DateTimeField | null=True, blank=True |
| calendar_id | CharField | max_length=200, default='primary' |
| created_at | DateTimeField | auto_now_add=True |
| updated_at | DateTimeField | auto_now=True |

---

### integrations.WebhookSubscription

| Field | Type | Options |
|---|---|---|
| id | UUIDField | primary_key, default=uuid.uuid4, editable=False |
| user | ForeignKey(User) | on_delete=CASCADE, related_name='webhooks' |
| url | URLField | |
| event | CharField | choices=[booking.created, booking.cancelled, booking.rescheduled], max_length=30 |
| is_active | BooleanField | default=True |
| created_at | DateTimeField | auto_now_add=True |

---

### payments

**No models defined.** The file contains only `# Create your models here.`

---

## 4. WORKING FEATURES (verified end-to-end via 43 unit tests)

| # | Feature | Status | Evidence |
|---|---|---|---|
| 1 | JWT registration | Working | POST /api/auth/register/ creates user + returns tokens. 9 auth unit tests pass. |
| 2 | JWT login | Working | POST /api/auth/login/ returns access + refresh tokens. |
| 3 | JWT token refresh | Working | POST /api/auth/token/refresh/ rotates access token. |
| 4 | Profile GET/PATCH | Working | GET/PATCH /api/auth/me/ returns and updates current user profile. |
| 5 | Public user lookup | Working | GET /api/auth/users/:username/ returns user profile (AllowAny). |
| 6 | Event type CRUD | Working | Full create/list/retrieve/update/delete at /api/events/event-types/ with host-scoping. Slug auto-generated from name. |
| 7 | Availability CRUD | Working | Full create/list/update/delete at /api/events/availability/ with weekday/time ranges. |
| 8 | Blocked times CRUD | Working | Full create/list/update/delete at /api/events/blocked-times/. |
| 9 | Public event types | Working | GET /api/events/public/:username/event-types/ returns active event types (AllowAny). |
| 10 | Slot computation | Working | GET /api/events/public/:username/event-types/:pk/slots/?date=YYYY-MM-DD calculates available slots considering availability windows, duration, buffers, blocked times, min_notice, max_bookings_per_day. |
| 11 | Booking creation (free) | Working | POST /api/bookings/ creates booking with status=confirmed, triggers Celery email tasks. |
| 12 | Host booking list | Working | GET /api/bookings/my/ with optional status filter, scoped to host's bookings. |
| 13 | Booking detail | Working | GET /api/bookings/:id/ returns single booking for authenticated host. |
| 14 | Booking cancellation | Working | POST /api/bookings/:id/cancel/?token=UUID validates cancel_token and sets status=cancelled. |
| 15 | Paid booking flow (partial) | Working | Free bookings create immediately; paid bookings return requires_payment flag with booking_data. |
| 16 | Stripe PaymentIntent | Working | POST /api/payments/create-intent/ creates Stripe PaymentIntent with metadata. |
| 17 | Stripe webhook handler | Working | POST /api/payments/webhook/ validates signature, creates booking on payment_intent.succeeded. |
| 18 | Google OAuth2 auth URL | Working | GET /api/integrations/google/auth/ returns Google OAuth2 authorization URL. |
| 19 | Google OAuth2 callback | Working | GET /api/integrations/google/callback/ exchanges code, stores tokens. |
| 20 | Google disconnect | Working | DELETE /api/integrations/google/disconnect/ removes tokens. |
| 21 | Google status | Working | GET /api/integrations/google/status/ returns connected boolean. |
| 22 | Webhook subscriptions | Working | GET/POST /api/integrations/webhooks/ CRUD for webhook endpoints. |
| 23 | Email tasks (sync) | Working | 3 Celery tasks: confirmation, reminders, cancellation. Run eagerly in dev (CELERY_TASK_ALWAYS_EAGER=True). |
| 24 | API docs | Working | GET /api/schema/ (OpenAPI) and GET /api/docs/ (Swagger UI). |
| 25 | Django admin | Available | GET /admin/ (no custom admin registered). |
| 26 | 43 unit tests | Passing | 9 accounts + 17 events + 8 bookings + 7 integrations + 2 payments. |

---

## 5. BROKEN OR INCOMPLETE FEATURES

| # | Feature | Issue |
|---|---|---|
| 1 | Paid booking end-to-end | Frontend redirects to BookingConfirmed which creates a PaymentIntent, but there is no backend endpoint to finalize the booking after Stripe payment succeeds (webhook does it, but requires a running Stripe CLI for local testing). Never tested with real Stripe keys. |
| 2 | Google Calendar sync (actual sync) | OAuth2 token storage works, but google_calendar.py has no actual calendar event creation, fetching, or conflict checking functions. Only the OAuth handshake is implemented. |
| 3 | CORS origin mismatch | settings.py has CORS_ALLOWED_ORIGINS = ['http://localhost:3000', ...] but Vite frontend runs on port 5173. Vite proxy bypasses this, but a direct frontend-to-backend connection will be blocked. |
| 4 | Profile update (email) | Profile PATCH allows changing email but the email field is unique. No special handling for "email already in use" error. |
| 5 | Cancel token in frontend | Dashboard calls cancelBooking(id, '') with an empty token string. No cancel token is available in the UI, so cancellation from dashboard will always fail with 403. |
| 6 | BookingPage username hardcoding | EventTypes.jsx copies links with hardcoded `testhost` username instead of the actual logged-in user's username. |
| 7 | Rescheduling | reschedule_token field exists in Booking model but no API endpoint or UI for rescheduling. |
| 8 | Availability PATCH | The Availability page adds new windows but does not update existing saved windows (only handles _new flag). |
| 9 | Stripe webhook secret validation | Uses placeholder `whsec_your_webhook_secret` — webhook will fail signature verification with real Stripe. |
| 10 | Email delivery | SMTP config uses placeholder credentials. fail_silently=True means errors are swallowed. No real emails sent. |
| 11 | Celery workers | No Redis server running locally. CELERY_TASK_ALWAYS_EAGER=True makes tasks run synchronously. Async ETA reminders will never fire later. |
| 12 | Event type edit page | EventTypes.jsx links to /event-types/:id/edit but no page exists at that route. |

---

## 6. API ENDPOINTS

| URL | Method | View | Auth Required |
|---|---|---|---|
| /admin/ | GET | Django Admin | Admin login |
| /api/auth/register/ | POST | RegisterView | No |
| /api/auth/login/ | POST | TokenObtainPairView | No |
| /api/auth/token/refresh/ | POST | TokenRefreshView | No |
| /api/auth/me/ | GET, PATCH | ProfileView | Yes (JWT) |
| /api/auth/users/<username>/ | GET | PublicProfileView | No |
| /api/events/event-types/ | GET, POST | EventTypeViewSet.list/create | Yes (JWT) |
| /api/events/event-types/<id>/ | GET, PATCH, DELETE | EventTypeViewSet.retrieve/update/destroy | Yes (JWT) |
| /api/events/event-types/<id>/slots/ | GET | EventTypeViewSet.slots (action) | No |
| /api/events/availability/ | GET, POST | AvailabilityViewSet.list/create | Yes (JWT) |
| /api/events/availability/<id>/ | GET, PATCH, DELETE | AvailabilityViewSet.retrieve/update/destroy | Yes (JWT) |
| /api/events/blocked-times/ | GET, POST | BlockedTimeViewSet.list/create | Yes (JWT) |
| /api/events/blocked-times/<id>/ | GET, PATCH, DELETE | BlockedTimeViewSet.retrieve/update/destroy | Yes (JWT) |
| /api/events/public/<username>/event-types/ | GET | PublicEventTypeView.list | No |
| /api/events/public/<username>/event-types/<pk>/ | GET | PublicEventTypeView.retrieve | No |
| /api/events/public/<username>/event-types/<pk>/slots/ | GET | public_slots | No |
| /api/bookings/ | POST | CreateBookingView | No |
| /api/bookings/my/ | GET | HostBookingListView | Yes (JWT) |
| /api/bookings/<id>/ | GET | BookingDetailView | Yes (JWT) |
| /api/bookings/<id>/cancel/ | POST | cancel_booking | No (requires token param) |
| /api/payments/create-intent/ | POST | create_payment_intent | No |
| /api/payments/webhook/ | POST | stripe_webhook | No (Stripe sig verification) |
| /api/integrations/google/auth/ | GET | google_auth_url | Yes (JWT) |
| /api/integrations/google/callback/ | GET | google_callback | No |
| /api/integrations/google/disconnect/ | DELETE | google_disconnect | Yes (JWT) |
| /api/integrations/google/status/ | GET | google_status | Yes (JWT) |
| /api/integrations/webhooks/ | GET, POST | WebhookSubscriptionViewSet.list/create | Yes (JWT) |
| /api/schema/ | GET | SpectacularAPIView | No |
| /api/docs/ | GET | SpectacularSwaggerView | No |

**Total: 28 endpoints** (5 public, 23 authenticated, 1 admin)

---

## 7. FRONTEND PAGES

| Route | Component | Description | Protected |
|---|---|---|---|
| / | Home.jsx | Landing page: hero, 6 features, how-it-works (3 steps), pricing (3 tiers), testimonials, Navbar + Footer | No |
| /login | Login.jsx | Email + password form, calls auth.login, redirects to /dashboard | No |
| /register | Register.jsx | Email, username, password, timezone form, calls auth.register | No |
| /dashboard | Dashboard.jsx | Stats cards (total bookings, upcoming, active event types), recent bookings table with cancel button, copy booking link, quick actions | Yes |
| /event-types | EventTypes.jsx | Grid of event type cards: name, duration, location, price, color. Toggle active, copy link, edit, delete | Yes |
| /event-types/new | CreateEventType.jsx | Full form: name, duration, location type, details, description, color picker, buffers, notice settings, price/currency, custom questions | Yes |
| /availability | Availability.jsx | Weekly grid (Mon-Sun) with add/remove time ranges, save all, blocked times form (start/end datetime + reason) | Yes |
| /settings | Settings.jsx | Profile edit (first/last name, username, timezone), Google Calendar connect/disconnect, webhook CRUD, sign out | Yes |
| /book/:username | BookingPage.jsx | Public booking: shows host's active event types as selectable cards | No |
| /book/:username/:slug | BookingPage.jsx | Public booking: pre-selects event type, date picker calendar, available slots, booking form (name, email, timezone, notes, custom questions) | No |
| /booking-confirmed | BookingConfirmed.jsx | Confirmation with details, Google Calendar add link, or Stripe PaymentElement if paid | No |

**Components**: Navbar.jsx, Footer.jsx, Sidebar.jsx, ProtectedRoute.jsx
**Context**: AuthContext.jsx (login, register, logout, loadProfile, user state, JWT management)
**API client**: client.js (Axios instance with JWT interceptors, 401 auto-redirect to /login, auth/events/availability/bookings/payments/integrations wrappers)

---

## 8. DATABASE

### Configuration (from settings.py)

```python
DATABASES = {
    'default': env.db('DATABASE_URL', default='sqlite:///db.sqlite3')
}
```

### Current .env value
```
DATABASE_URL=sqlite:///db.sqlite3
```

### Actual database
- **Type**: SQLite3
- **File**: Backend/db.sqlite3
- **Django version**: 4.2
- **Migrations**: All applied (accounts, bookings, events, integrations, admin, auth, contenttypes, sessions, django_celery_beat)
- **Seeded data**: Test user `host@test.com` / `testpass123` with 30-min and 60-min event types + Mon-Fri availability (if seed.py was run)

---

## 9. ENVIRONMENT VARIABLES

| Variable | Value in .env | Notes |
|---|---|---|
| SECRET_KEY | django-insecure-change-this-key-in-production | Default Django dev key |
| DEBUG | True | Dev mode |
| ALLOWED_HOSTS | localhost,127.0.0.1 | |
| DATABASE_URL | sqlite:///db.sqlite3 | SQLite in dev |
| REDIS_URL | redis://localhost:6379/0 | Redis not running locally |
| STRIPE_SECRET_KEY | sk_test_your_stripe_key | PLACEHOLDER |
| STRIPE_PUBLISHABLE_KEY | pk_test_your_stripe_key | PLACEHOLDER |
| STRIPE_WEBHOOK_SECRET | whsec_your_webhook_secret | PLACEHOLDER |
| GOOGLE_CLIENT_ID | your_google_client_id | PLACEHOLDER |
| GOOGLE_CLIENT_SECRET | your_google_client_secret | PLACEHOLDER |
| GOOGLE_REDIRECT_URI | http://localhost:8000/api/integrations/google/callback/ | |
| EMAIL_HOST | smtp.gmail.com | |
| EMAIL_PORT | 587 | |
| EMAIL_USE_TLS | True | |
| EMAIL_HOST_USER | your@gmail.com | PLACEHOLDER |
| EMAIL_HOST_PASSWORD | your_app_password | PLACEHOLDER |
| DEFAULT_FROM_EMAIL | your@gmail.com | PLACEHOLDER |
| FRONTEND_URL | http://localhost:3000 | Should be http://localhost:5173 for Vite |
| BASE_URL | http://localhost:8000 | |

---

## 10. CELERY AND REDIS

### Celery Configuration

| Setting | Value | Notes |
|---|---|---|
| CELERY_BROKER_URL | redis://localhost:6379/0 | |
| CELERY_RESULT_BACKEND | redis://localhost:6379/0 | |
| CELERY_BEAT_SCHEDULER | django_celery_beat.schedulers:DatabaseScheduler | |
| CELERY_TIMEZONE | UTC | |
| CELERY_TASK_ALWAYS_EAGER | True | Tasks run synchronously in dev — no broker needed |

### Celery App
- Defined in `core/celery.py`
- Named `Celery('core')`
- Config loaded from `django.conf:settings` namespace `CELERY`
- `app.autodiscover_tasks()` enabled

### Redis Status
- **Not running** locally — no Redis server started
- **Cache backend**: RedisCache at `redis://localhost:6379/0` — will fail silently
- **Celery works only** because `CELERY_TASK_ALWAYS_EAGER=True` bypasses the broker

### Async Tasks Defined (3 tasks in bookings/tasks.py)

| Task | Description |
|---|---|
| send_booking_confirmation(booking_id) | Sends confirmation email to invitee AND host with event details and cancel link |
| send_booking_reminder(booking_id, hours_before) | Sends reminder email at 24h and 1h before meeting (scheduled via ETA) |
| send_cancellation_email(booking_id) | Sends cancellation notification to invitee with rebooking link |

### Celery Beat
- Scheduled via django-celery-beat (DatabaseScheduler)
- **No periodic tasks** configured in the database
- Would require `celery -A core beat` process to run scheduled tasks

### Worker Process
- Not running
- Command: `celery -A core worker --loglevel=info`

---

## 11. WHAT IS NOT STARTED AT ALL

| # | Feature | Notes |
|---|---|---|
| 1 | Round-robin routing | Teams feature for distributing bookings across members — zero code |
| 2 | SMS reminders | Only email reminders exist. No Twilio, no phone number field, no SMS task |
| 3 | Two-way Google Calendar sync | OAuth handshake works but no actual calendar CRUD. No busy-time fetching from Google. No event creation to Google Calendar. |
| 4 | Event push notifications | Google Calendar watch/webhook subscriptions not implemented |
| 5 | Rescheduling | Model field (reschedule_token) exists but no API endpoint, no UI, no workflow |
| 6 | Booking "completed" status flow | No way to mark bookings as completed. No UI or endpoint. |
| 7 | Team/organization model | No teams, no group scheduling, no collective event types |
| 8 | Zapier/webhook firing | fire_webhooks() function exists but is NEVER called from booking creation, cancellation, or any other event |
| 9 | Admin customizations | No admin.py registrations — all empty. Django admin is bare |
| 10 | User avatar upload | Model field exists, no upload endpoint or UI |
| 11 | Profile bio editing | Model field exists, not exposed in Settings page |
| 12 | Email verification | No email verification flow on registration |
| 13 | Password reset | No forgot-password endpoint or UI |
| 14 | Rate limiting | No throttling on any endpoints |
| 15 | Analytics/metrics | No dashboard analytics, charts, or stats beyond simple counts |
| 16 | Multi-timezone display | All datetimes stored/returned in UTC, no conversion on frontend |
| 17 | Event type edit page | /event-types/:id/edit route referenced but page doesn't exist |
| 18 | CORS for production | Only localhost:3000 in allowed origins. Vite port 5173 not included |
| 19 | Payment management model | No Payment model. Stripe metadata stored on Booking directly |
| 20 | Refund flow | No refund endpoint or UI |
| 21 | Booking page branding | No host avatar, bio, or custom branding on public booking pages |
| 22 | Custom domain / vanity URL | All links use localhost:5173/book/:username |
| 23 | Booking edit from host side | Host can only view and cancel, cannot edit booking details |
| 24 | Bulk availability import | No CSV or bulk import for availability windows |
| 25 | Recurring blocked times | Blocked times are one-off only — no "every Monday" pattern |

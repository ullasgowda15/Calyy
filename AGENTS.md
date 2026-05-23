# AGENTS.md

## Goal
Complete v1 of Caly scheduling app with time/email fixes, mobile responsiveness, and production-ready polish

## Constraints & Preferences
- Keep `Backend/` and `Frontend/` layout; use `calyenv` venv
- PostgreSQL, Redis, Celery, Django server all running — test against real infra
- Use Tailwind v4, CSS variables for styling; avoid `lucide-react` where possible
- Mobile-responsive, dark mode toggle, SEO-optimized pages
- Frontend uses Vite 8 + React 19; oxc parser has issues with JS template literals inside `<style>` — use `dangerouslySetInnerHTML` instead
- Celery on Windows requires `--pool=solo` to avoid `billiard` `PermissionError` crashes
- `@import url(...)` cannot come after `@import "tailwindcss"` in CSS — use `<link>` tag for Google Fonts instead
- `docker-compose.yml` is in `Backend/` directory, not project root
- `calyenv` venv is at project root (`Caly/calyenv/`), not inside `Backend/`
- Razorpay amounts in **paise** (`int(float(price) * 100)`)
- Pricing displayed in INR (₹) only — USD option removed from currency dropdowns

## Progress
### Done
- **96 backend tests passing** (accounts, events, bookings — run with `pytest`; `manage.py test` doesn't disable throttling)
- **Frontend builds clean** (462KB JS, 15KB CSS)
- **Redis + Celery running**: `docker compose up -d` for db + redis; Celery worker started with `--pool=solo` on Windows
- **Google sign-in**: endpoint returns auth URL correctly; was failing because Django server was killed
- **Avatar placeholder centered**: removed duplicate `display: 'block'` overriding `display: 'flex'` in `BookingPage.jsx`
- **Duplicate event type name**: unhandled `IntegrityError` on slug unique constraint → now returns clean validation error via serializer
- **Timezone root cause identified**: host profile timezone defaults to `'UTC'` in DB. Backend `get_available_slots()` interprets availability hours in the host's stored timezone. If `'UTC'`, availability 9-17 gets treated as UTC, which converts to ~2:30 PM-10:30 PM in IST on the booking page. Three-pronged fix:
  1. **Login auto-fix** (`AuthContext.jsx:26-35`): on login, if user's timezone is `'UTC'` (the unset default), silently update it to the browser's detected timezone via `auth.updateProfile()`
  2. **Profile auto-detect** (`Profile.jsx`): timezone field defaults to `getUserTimezone()`; initial load uses `resolveTimezone(user.timezone)` which treats `'UTC'` as unset; shows browser-detected timezone hint below dropdown
  3. **Availability page warning** (`Availability.jsx`): shows the active timezone name with a link to Profile to fix if it's wrong
- **12-hour format enforced** (`datetime.js`): `formatTimeLocal` and `formatDateTimeUTC` now use a shared `TIME_OPT` with explicit `hour12: true`, ensuring AM/PM is always shown
- **Timezone dashboard fix**: 3:15 PM IST showing as 9:45 UTC because user's `timezone` in DB was `'UTC'`. Fixed: `resolveTimezone()` helper treats `'UTC'` as unset and falls back to browser timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone`
- **Register page**: default timezone now auto-detects browser timezone (was hardcoded `'UTC'`)
- **Booking confirmed redirect to login**: `payment_status` endpoint required `IsAuthenticated` → 401 → axios interceptor did `window.location.href = '/login'`. Changed to `AllowAny`
- **Email formatting overhaul**: created `bookings/email_templates.py` with shared `HTML_WRAP`, `detail_rows()`, `detail_table()` for clean alternating-row tables. Password reset email migrated from plain Django `send_mail` to Resend HTML. All 6 email types now use consistent brand wrapper
- **Mobile responsiveness**: global CSS rules in `index.css` with `page-content` class replacing inline `padding`. Removed duplicate inline `<style>` tags from all 7 authenticated pages (Dashboard, EventTypes, CreateEventType, EditEventType, Availability, Profile, Settings). Consistent breakpoints at 767px and 480px
- **Invalid credentials**: axios 401 interceptor now only redirects to `/login` if `localStorage` has an existing token (not during fresh login attempt). Error message simplified to `'Invalid credentials'` (prevents enumeration)
- **Email verification**: OTP model + `email_verified` field, Celery task, endpoints, `VerifyEmail.jsx` page
- **Privacy Policy** (`/privacy`) + **Terms of Service** (`/terms`) with full legal content
- **SEO**: meta tags, Open Graph, Twitter card, proper `<title>`
- **Reschedule page** (`/reschedule/:rescheduleToken`): date/time picker
- **Celery beat**: data migration `0005_add_release_expired_task.py` (every 1 min)
- **robots.txt**: backend template + frontend `public/robots.txt`
- **404/500 error pages**: Django HTML templates
- **Host cancel endpoint**: `POST /api/bookings/{id}/host-cancel/` (JWT auth)
- **Password change**: Settings page form + `POST /api/auth/me/change-password/`
- **Revenue stat**: `event_type_price` + `event_type_currency` in `BookingSerializer`
- **HTML email templates**: branded wrapper with inline styles for all notification types
- **Onboarding banner**: Dashboard empty-state with dismiss persisted in `localStorage`
- **ConfirmModal component**: reusable modal for refund and delete actions
- **Pricing**: Standard ₹499/mo, Teams ₹5,999/mo (Upcoming badge), Free CTA blue
- **Currency switched to INR**: all `$` → `₹`, USD option removed from event type forms
- **N+1 queries fixed**: `select_related('event_type__host')` on all Booking querysets, `select_related('host')` on EventType
- **Google Calendar + webhooks moved to Celery tasks**: `sync_google_calendar_event`, `delete_google_calendar_event`, `deliver_webhook_task` with autoretry
- **`autoretry_for`** on all Celery email tasks (3 retries, exp backoff, 5min max)
- **Unused npm packages removed**: `framer-motion`, `clsx`, `tailwind-merge`
- **Inline components extracted**: `TimeSelect` in `Availability.jsx`, `Section` in `Settings.jsx`
- **Login/Register/ForgotPassword**: all use same `Navbar` component as Home page

### Done (this session)
- **96 tests all passing** (0 failures). Fixed two bugs preventing test suite from running clean:
  - `bookings/serializers.py`: `pytz.utc.localize()` on timezone-aware datetime → strip tzinfo before localizing
  - `conftest.py`: `create_user` fixture missing subscription → added `subscription_status='free_trial'` so `is_subscribed()` passes; fixed `timezone` param shadowing module
- Tests must use `pytest` (reads `pytest.ini` → `core.test_settings` disables throttling); `manage.py test` uses `core.settings` with active throttling

### Blocked
- Google Calendar token expired — user must re-connect
- Razorpay webhook secret still placeholder (`whsec_your_webhook_secret`)
- `DEBUG=True` in `.env` — should be `False` in production

## Key Decisions
- **Timezone fix for existing users**: on login, if user's `timezone` is `'UTC'` (the unset default), silently auto-update to browser timezone via `auth.updateProfile()`. This fixes all existing users without them needing to do anything special.
- **Availability page UX**: shows the active timezone name with a link to Profile settings, so users can verify it's correct.
- **12-hour format**: enforced globally via a shared `TIME_OPT` constant with `hour12: true` in all datetime formatting functions.
- Password reset email moved from `send_mail` to Resend HTML via Celery task (was plain text, no formatting)
- `payment_status` endpoint changed from `IsAuthenticated` to `AllowAny` — booking UUID is the auth
- 401 interceptor only redirects to `/login` when existing token exists (not on login failures)
- Error messages return generic `'Invalid credentials'` — prevents email enumeration
- Mobile responsive via single `page-content` CSS class with breakpoints — replaces 7 duplicate inline `<style>` tags
- `resolveTimezone()` treats `'UTC'` as "not set" and falls back to browser timezone
- Email templates use shared `detail_rows()` helper for consistent styled tables across all 6 email types
- Email verification uses 6-digit OTP (not token link) — simpler UX, 10-min expiry, Resend API
- Celery beat uses `django_celery_beat DatabaseScheduler` with data migration
- Webhook delivery moved from sync `fire_webhooks` to Celery `deliver_webhook_task`
- Google Calendar sync/delete moved to Celery tasks
- PostgreSQL via Docker — already configured in `docker-compose.yml`

## Next Steps
1. Replace Razorpay webhook secret placeholder with real secret from Razorpay dashboard
2. Set `DEBUG=False` and configure proper error handling for production
3. Re-connect Google Calendar (token expired) — visit `/settings` and click Connect
4. Write E2E tests (Playwright/Cypress) for critical flows

## Critical Context
- `RESEND_API_KEY=RESEND_API_KEY_REDACTED` in `Backend/.env`
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/calendly_mvp` — PostgreSQL via Docker
- Celery on Windows crashes with `PermissionError` on `prefork` — always `--pool=solo`
- `@import "tailwindcss"` at line 1 of `index.css` — any `@import url(...)` after it breaks
- Host timezone defaults to `'UTC'` — availability stored without timezone, interpreted as host's timezone during slot computation. **Auto-fixed on login** via `AuthContext.jsx:26-35`
- `get_available_slots()` in `Backend/events/availability.py` uses `host_tz.localize()` to interpret availability times, then converts to UTC for slot storage
- Booking page displays slots via `formatTimeLocal(slot.start, form.invitee_timezone)` — times are UTC ISO strings converted to invitee's browser timezone with `hour12: true`
- All 7 authenticated pages now use `page-content` CSS class instead of inline `padding` — single source of truth in `index.css`
- Payments test file (`test_payments.py`) not discovered by Django test runner — pre-existing issue
- Backend throttling: `register: 5/h`, `login: 10/h`, `token-refresh: 20/h`, `booking-create: 20/h`
- Tests use `core.test_settings` which disables throttling
- Razorpay test keys in `.env`; webhook secret is placeholder
- `.gitignore` excludes `.env`, `calyenv/`, `node_modules/`, `dist/`, `__pycache__/`, `.pytest_cache/`, `start-all.ps1`

## Relevant Files
- `Frontend/src/utils/datetime.js`: `formatTimeLocal`, `formatDateTimeUTC`, `formatDateLocal`, `resolveTimezone`, `getUserTimezone` — all timezone-aware formatting; now uses `TIME_OPT` with `hour12: true`
- `Frontend/src/context/AuthContext.jsx:26-35`: login auto-updates timezone from `'UTC'` to browser timezone
- `Frontend/src/pages/Profile.jsx`: timezone field defaults to `getUserTimezone()`; uses `resolveTimezone()`; shows browser hint
- `Frontend/src/pages/Availability.jsx`: shows active timezone name with link to Profile
- `Frontend/src/pages/Dashboard.jsx`: uses `resolveTimezone(user?.timezone)` for all time displays
- `Frontend/src/pages/Register.jsx`: default timezone now `Intl.DateTimeFormat().resolvedOptions().timeZone`
- `Frontend/src/api/client.js`: 401 interceptor only redirects on existing token; `login()` stores tokens
- `Frontend/src/index.css`: `page-content` class with responsive breakpoints at 767px and 480px
- `Backend/bookings/email_templates.py`: shared `HTML_WRAP`, `detail_rows()`, `detail_table()` for all email types
- `Backend/bookings/tasks.py`: all email tasks rewritten with shared template helpers
- `Backend/accounts/tasks.py`: `send_password_reset_email` now uses Resend HTML (was plain `send_mail`)
- `Backend/events/availability.py`: `get_available_slots()` — uses `host_tz.localize()` for timezone-aware slot computation
- `Backend/bookings/views.py`: `finalize_booking()` triggers Celery tasks
- `Backend/payments/views.py`: `payment_status` changed to `AllowAny`
- `Backend/events/serializers.py`: duplicate event type name returns validation error
- `Frontend/src/pages/Login.jsx`: error message now `'Invalid credentials'`

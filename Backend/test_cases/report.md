# Test Report — Caly MVP V1.1

**Date:** 2026-05-19
**Total:** 120 passed, 0 failed
**Duration:** ~2m 16s
**Python:** 3.14.3
**Django:** 4.2

---

## Accounts (27 tests)

| Test File | Class | Test | Status |
|-----------|-------|------|--------|
| `test_accounts.py` | TestRegistration | test_register_success | PASS |
| | | test_register_duplicate_email | PASS |
| | | test_register_duplicate_username | PASS |
| | | test_register_weak_password | PASS |
| | | test_register_missing_email | PASS |
| | TestLogin | test_login_success | PASS |
| | | test_login_wrong_password | PASS |
| | | test_login_nonexistent_user | PASS |
| | TestProfile | test_get_profile_authenticated | PASS |
| | | test_update_profile | PASS |
| | | test_email_is_readonly | PASS |
| | | test_public_profile | PASS |
| | | test_public_profile_not_found | PASS |
| | | test_get_profile_unauthenticated | PASS |
| | TestTokenRefresh | test_token_refresh | PASS |
| | | test_invalid_refresh_token | PASS |
| | TestPasswordReset | test_password_reset_request_known_email | PASS |
| | | test_password_reset_request_unknown_email | PASS |
| `tests.py` | AuthTests | test_register | PASS |
| | | test_register_duplicate_email | PASS |
| | | test_login | PASS |
| | | test_login_wrong_password | PASS |
| | | test_profile_authenticated | PASS |
| | | test_profile_unauthenticated | PASS |
| | | test_profile_update | PASS |
| | | test_public_profile | PASS |
| | | test_public_profile_not_found | PASS |

## Events (22 tests)

| Test File | Class | Test | Status |
|-----------|-------|------|--------|
| `test_events.py` | TestEventTypeCRUD | test_create_event_type | PASS |
| | | test_create_event_type_unauthenticated | PASS |
| | | test_list_event_types_own_only | PASS |
| | | test_update_event_type | PASS |
| | | test_cannot_update_other_hosts_event_type | PASS |
| | | test_delete_event_type | PASS |
| | | test_toggle_inactive | PASS |
| | TestPublicEventTypes | test_list_public_event_types | PASS |
| | | test_inactive_event_type_not_in_public_list | PASS |
| | | test_unknown_host_public_list | PASS |
| | TestAvailability | test_create_availability | PASS |
| | | test_list_availability | PASS |
| | | test_delete_availability | PASS |
| | | test_cannot_see_other_hosts_availability | PASS |
| | TestAvailabilityEngine | test_slots_returned_on_available_day | PASS |
| | | test_no_slots_on_unavailable_day | PASS |
| | | test_slot_blocked_by_existing_booking | PASS |
| | | test_slots_require_date_param | PASS |
| | | test_slots_invalid_date_format | PASS |
| | | test_buffer_after_blocks_adjacent_slot | PASS |
| | | test_inactive_event_type_has_no_public_slots | PASS |
| | | test_max_advance_days_blocks_far_future | PASS |

## Bookings (27 tests)

| Test File | Class | Test | Status |
|-----------|-------|------|--------|
| `test_bookings.py` | TestFreeBookingCreation | test_create_free_booking_success | PASS |
| | | test_create_booking_slot_taken | PASS |
| | | test_create_booking_invalid_event_type | PASS |
| | | test_create_booking_inactive_event_type | PASS |
| | | test_create_booking_missing_required_fields | PASS |
| | | test_create_paid_booking_returns_requires_payment | PASS |
| | TestBookingCancellation | test_cancel_booking_valid_token | PASS |
| | | test_cancel_booking_invalid_token | PASS |
| | | test_cancel_already_cancelled_booking | PASS |
| | TestHostBookingList | test_host_sees_own_bookings | PASS |
| | | test_host_cannot_see_other_bookings | PASS |
| | | test_unauthenticated_cannot_see_bookings | PASS |
| | | test_booking_response_has_cancel_token | PASS |
| | TestBookingStatusUpdate | test_mark_booking_completed | PASS |
| | | test_mark_booking_no_show | PASS |
| | | test_invalid_status_value | PASS |
| | | test_cannot_update_other_hosts_booking | PASS |
| | TestRescheduling | test_reschedule_to_valid_slot | PASS |
| | | test_reschedule_cancelled_booking_fails | PASS |
| | | test_reschedule_missing_datetime | PASS |
| | TestDoubleBookingPrevention | test_concurrent_booking_same_slot | PASS |
| `tests.py` | BookingTests | test_create_booking | PASS |
| | | test_create_booking_invalid_event_type | PASS |
| | | test_create_booking_invalid_slot | PASS |
| | | test_host_bookings_list | PASS |
| | | test_host_booking_detail | PASS |
| | | test_cancel_booking | PASS |
| | | test_cancel_already_cancelled | PASS |
| | | test_cancel_invalid_token | PASS |
| | PaidBookingTests | test_paid_booking_requires_payment | PASS |

## Integrations (11 tests)

| Test File | Class | Test | Status |
|-----------|-------|------|--------|
| `test_integrations.py` | TestWebhookSubscriptions | test_create_webhook_subscription | PASS |
| | | test_list_webhooks | PASS |
| | | test_unauthenticated_cannot_create_webhook | PASS |
| | TestGoogleCalendarStatus | test_google_status_not_connected | PASS |
| | | test_google_status_connected | PASS |
| | | test_google_auth_url_returned | PASS |
| `tests.py` | GoogleCalendarTests | test_google_auth_url | PASS |
| | | test_google_status_not_connected | PASS |
| | | test_google_disconnect_no_token | PASS |
| | WebhookTests | test_create_webhook | PASS |
| | | test_create_webhook_invalid_event | PASS |
| | | test_list_webhooks | PASS |
| | | test_webhook_isolation | PASS |

## Payments (9 tests)

| Test File | Class | Test | Status |
|-----------|-------|------|--------|
| `test_payments.py` | TestCreatePaymentIntent | test_create_intent_for_paid_event | PASS |
| | | test_create_intent_for_free_event_fails | PASS |
| | | test_create_intent_nonexistent_event_type | PASS |
| | TestStripeWebhook | test_webhook_payment_succeeded_creates_booking | PASS |
| | | test_webhook_idempotent_duplicate_ignored | PASS |
| | | test_webhook_invalid_signature_rejected | PASS |
| | TestRefund | test_refund_paid_booking | PASS |
| | | test_refund_unpaid_booking_fails | PASS |
| | | test_refund_unauthenticated | PASS |
| | | test_cannot_refund_other_hosts_booking | PASS |

---

## Source Code Fixes Applied

| File | Fix |
|------|-----|
| `core/settings.py` | Added `AUTH_PASSWORD_VALIDATORS` (min length 8) |
| | Changed `CACHES` from Redis to `LocMemCache` |
| | Added `django.request` logger config (Python 3.14 workaround) |
| | Changed Celery result backend to `cache` (prevents hang when Redis unavailable) |
| | Added `CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = False` |
| | Added socket timeout transport options for broker |
| `accounts/views.py` | Added `queryset = User.objects.all()` to `ProfileView` and `AvatarUploadView` |
| `events/serializers.py` | Changed `host` field to `UUIDField(source='host.id')` |
| `events/availability.py` | Buffer conflict extends booking range instead of slot range |
| `bookings/views.py` | Added `_safe_delay`/`_safe_apply_async` wrappers for Celery calls |
| | Added `reschedule_by_token` view with proper request passing |
| | Fixed `gc_event_id` UnboundLocalError in reschedule |
| | Changed reschedule to update existing booking in-place instead of cancel+create |
| | Changed reschedule return status from 201 to 200 |
| `bookings/urls.py` | Added `reschedule/<uuid:reschedule_token>/` route |
| `payments/views.py` | Added `import logging` |
| | Added `_safe_delay`/`_safe_apply_async` wrappers |

## Known Limitations

- Tests run on SQLite (not PostgreSQL) — PostgreSQL is not running locally
- Redis not available locally; Celery tasks are wrapped in try/except
- Python 3.14 / Django 4.2 incompatibility in `ContextList.__copy__` — worked around with logger config

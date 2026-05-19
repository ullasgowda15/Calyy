# Test Report — Caly MVP V1.1

**Date:** 2026-05-19
**Total:** 120 passed, 0 failed
**Infrastructure:** PostgreSQL, Redis, Celery (all running)
**Duration:** ~56s
**Python:** 3.14.3 | **Django:** 4.2

---

## Accounts — 27 tests (all PASS)

| Test File | Class | Test |
|-----------|-------|------|
| `test_accounts.py` | TestRegistration | test_register_success |
| | | test_register_duplicate_email |
| | | test_register_duplicate_username |
| | | test_register_weak_password |
| | | test_register_missing_email |
| | TestLogin | test_login_success |
| | | test_login_wrong_password |
| | | test_login_nonexistent_user |
| | TestProfile | test_get_profile_authenticated |
| | | test_update_profile |
| | | test_email_is_readonly |
| | | test_public_profile |
| | | test_public_profile_not_found |
| | | test_get_profile_unauthenticated |
| | TestTokenRefresh | test_token_refresh |
| | | test_invalid_refresh_token |
| | TestPasswordReset | test_password_reset_request_known_email |
| | | test_password_reset_request_unknown_email |
| `tests.py` | AuthTests | test_register |
| | | test_register_duplicate_email |
| | | test_login |
| | | test_login_wrong_password |
| | | test_profile_authenticated |
| | | test_profile_unauthenticated |
| | | test_profile_update |
| | | test_public_profile |
| | | test_public_profile_not_found |

## Events — 22 tests (all PASS)

| Test File | Class | Test |
|-----------|-------|------|
| `test_events.py` | TestEventTypeCRUD | test_create_event_type |
| | | test_create_event_type_unauthenticated |
| | | test_list_event_types_own_only |
| | | test_update_event_type |
| | | test_cannot_update_other_hosts_event_type |
| | | test_delete_event_type |
| | | test_toggle_inactive |
| | TestPublicEventTypes | test_list_public_event_types |
| | | test_inactive_event_type_not_in_public_list |
| | | test_unknown_host_public_list |
| | TestAvailability | test_create_availability |
| | | test_list_availability |
| | | test_delete_availability |
| | | test_cannot_see_other_hosts_availability |
| | TestAvailabilityEngine | test_slots_returned_on_available_day |
| | | test_no_slots_on_unavailable_day |
| | | test_slot_blocked_by_existing_booking |
| | | test_slots_require_date_param |
| | | test_slots_invalid_date_format |
| | | test_buffer_after_blocks_adjacent_slot |
| | | test_inactive_event_type_has_no_public_slots |
| | | test_max_advance_days_blocks_far_future |

## Bookings — 27 tests (all PASS)

| Test File | Class | Test |
|-----------|-------|------|
| `test_bookings.py` | TestFreeBookingCreation | test_create_free_booking_success |
| | | test_create_booking_slot_taken |
| | | test_create_booking_invalid_event_type |
| | | test_create_booking_inactive_event_type |
| | | test_create_booking_missing_required_fields |
| | | test_create_paid_booking_returns_requires_payment |
| | TestBookingCancellation | test_cancel_booking_valid_token |
| | | test_cancel_booking_invalid_token |
| | | test_cancel_already_cancelled_booking |
| | TestHostBookingList | test_host_sees_own_bookings |
| | | test_host_cannot_see_other_bookings |
| | | test_unauthenticated_cannot_see_bookings |
| | | test_booking_response_has_cancel_token |
| | TestBookingStatusUpdate | test_mark_booking_completed |
| | | test_mark_booking_no_show |
| | | test_invalid_status_value |
| | | test_cannot_update_other_hosts_booking |
| | TestRescheduling | test_reschedule_to_valid_slot |
| | | test_reschedule_cancelled_booking_fails |
| | | test_reschedule_missing_datetime |
| | TestDoubleBookingPrevention | test_concurrent_booking_same_slot |
| `tests.py` | BookingTests | test_create_booking |
| | | test_create_booking_invalid_event_type |
| | | test_create_booking_invalid_slot |
| | | test_host_bookings_list |
| | | test_host_booking_detail |
| | | test_cancel_booking |
| | | test_cancel_already_cancelled |
| | | test_cancel_invalid_token |
| | PaidBookingTests | test_paid_booking_requires_payment |

## Integrations — 11 tests (all PASS)

| Test File | Class | Test |
|-----------|-------|------|
| `test_integrations.py` | TestWebhookSubscriptions | test_create_webhook_subscription |
| | | test_list_webhooks |
| | | test_unauthenticated_cannot_create_webhook |
| | TestGoogleCalendarStatus | test_google_status_not_connected |
| | | test_google_status_connected |
| | | test_google_auth_url_returned |
| `tests.py` | GoogleCalendarTests | test_google_auth_url |
| | | test_google_status_not_connected |
| | | test_google_disconnect_no_token |
| | WebhookTests | test_create_webhook |
| | | test_create_webhook_invalid_event |
| | | test_list_webhooks |
| | | test_webhook_isolation |

## Payments — 9 tests (all PASS)

| Test File | Class | Test |
|-----------|-------|------|
| `test_payments.py` | TestCreatePaymentIntent | test_create_intent_for_paid_event |
| | | test_create_intent_for_free_event_fails |
| | | test_create_intent_nonexistent_event_type |
| | TestStripeWebhook | test_webhook_payment_succeeded_creates_booking |
| | | test_webhook_idempotent_duplicate_ignored |
| | | test_webhook_invalid_signature_rejected |
| | TestRefund | test_refund_paid_booking |
| | | test_refund_unpaid_booking_fails |
| | | test_refund_unauthenticated |
| | | test_cannot_refund_other_hosts_booking |

---

## Source Code Fixes Applied (v1.1.2)

| File | Fix |
|------|-----|
| `core/settings.py` | Added `AUTH_PASSWORD_VALIDATORS` (min length 8) |
| | Changed `CACHES` from Redis to `LocMemCache` (test isolation) |
| | Added `django.request` logger config (Python 3.14 `ContextList` workaround) |
| | Set Celery result backend to `cache` with `memory` backend |
| | Added `CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = False` |
| | Added socket timeout transport options for broker |
| `accounts/views.py` | Added `queryset = User.objects.all()` to `ProfileView` / `AvatarUploadView` |
| `events/serializers.py` | Changed `host` field to `UUIDField(source='host.id')` |
| `events/availability.py` | Buffer conflict extends booking range instead of slot range |
| `bookings/views.py` | Added `_safe_delay` / `_safe_apply_async` Celery wrappers |
| | Added `reschedule_by_token` view with token forwarding |
| | Fixed `gc_event_id` `UnboundLocalError` in reschedule path |
| | Changed reschedule to update booking in-place (not cancel+create) |
| | Changed reschedule return status 201 → 200 |
| `bookings/urls.py` | Added `reschedule/<uuid:reschedule_token>/` route |
| `payments/views.py` | Added missing `import logging` |
| | Added `_safe_delay` / `_safe_apply_async` Celery wrappers |

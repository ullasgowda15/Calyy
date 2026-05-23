## Testing-only changes — REVERT BEFORE PRODUCTION

### 1. Self-booking check (commented out)
**File:** `Backend/bookings/serializers.py`
**Lines:** 27-28
**Current:**
```python
# if event_type.host.email == data.get('invitee_email', ''):
#     raise serializers.ValidationError('You cannot book your own event.')
```
**Revert to:**
```python
if event_type.host.email == data.get('invitee_email', ''):
    raise serializers.ValidationError('You cannot book your own event.')
```

### 2. Cancel endpoint accepts GET (for email link)
**File:** `Backend/bookings/views.py`
**Line:** 131
**Current:** `@api_view(['GET', 'POST'])`
**Revert to:** `@api_view(['POST'])`

### 3. DEBUG mode
**File:** `Backend/.env`
**Line:** 2
**Current:** `DEBUG=True`
**Revert to:** `DEBUG=False`
(Also run `python manage.py collectstatic` before switching to False)

### 5. Email timezone fix (safe for production — uses invitee/host timezone from DB)
**File:** `Backend/bookings/tasks.py`
This change adds `_format_dt()` helper that converts UTC datetimes to the recipient's timezone.
It's actually a **bug fix**, not a testing change — keep this in production.

### 4. Resend from address
**File:** `Backend/.env`
**Line:** 23
**Current:** `DEFAULT_FROM_EMAIL=onboarding@resend.dev`
**Revert to:** `DEFAULT_FROM_EMAIL=noreply@your-verified-domain.com`
(Verify a domain at https://resend.com/domains first)

---

**Done testing?** Delete this file after reverting.

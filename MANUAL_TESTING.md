# YourCaly — Manual Testing Checklist

## 1. Authentication

### 1.1 Register
- [ ] Navigate to `/register`
- [ ] Timezone field auto-detects browser timezone (not `'UTC'`)
- [ ] Submit with valid name, email, password, timezone
- [ ] Submit with duplicate email → error shown
- [ ] Submit with duplicate phone → error shown
- [ ] Submit with weak password → error shown (min 8 chars, uppercase, lowercase, digit, special char)
- [ ] After registration, redirected to `/verify-email`
- [ ] OTP sent via email — enter OTP to verify

### 1.2 Email Verification
- [ ] `/verify-email` page renders with OTP input
- [ ] OTP sent via Resend — enter 6-digit code
- [ ] Wrong OTP → error shown
- [ ] OTP expires after 10 min → "Request new OTP"
- [ ] Resend OTP button works (5/h rate limited)

### 1.3 Login
- [ ] Navigate to `/login`
- [ ] Invalid credentials → shows `'Invalid credentials'` (no email enumeration)
- [ ] Valid credentials → redirected to dashboard
- [ ] On login, if timezone is `'UTC'`, auto-updated to browser timezone
- [ ] Tokens stored in localStorage
- [ ] Refresh token works (no 401 loop)
- [ ] Admin login at `/adkrish` (not `/admin/`) — `/admin/` returns 404

### 1.4 Google OAuth
- [ ] Click "Sign in with Google"
- [ ] Redirected to Google consent screen
- [ ] After consent, redirected back and logged in
- [ ] Works cross-origin (frontend on Vercel, backend on Railway)

### 1.5 Forgot / Reset Password
- [ ] `/forgot-password` form accepts email
- [ ] Password reset email sent (HTML formatted)
- [ ] Reset link works
- [ ] New password can be used to login

### 1.6 Password Change & Complexity (Settings)
- [ ] Old password + new password + confirm
- [ ] Wrong old password → error
- [ ] Weak new password → error (needs uppercase, lowercase, digit, special char)

### 1.7 Logout
- [ ] Clears tokens from localStorage
- [ ] Redirected to `/login`
- [ ] Authenticated pages inaccessible after logout

---

## 2. Event Types

### 2.1 Create
- [ ] Navigate to `/event-types` → click "Create"
- [ ] Fill name, duration, description
- [ ] Set price in INR (₹)
- [ ] Select location type (in-person, phone, Google Meet, etc.)
- [ ] Add custom questions (text / select with options)
- [ ] Toggle required on custom questions
- [ ] Submit → event type created
- [ ] Duplicate name → validation error (not 500)

### 2.2 Edit
- [ ] Click edit on an event type
- [ ] Change name, duration, price
- [ ] Add/remove custom questions
- [ ] Save → changes reflected on booking page

### 2.3 Delete
- [ ] Delete event type → confirm modal
- [ ] Event type removed from list
- [ ] Booking page for deleted slug returns 404

### 2.4 List
- [ ] `/event-types` shows all event types for the user
- [ ] Each shows name, duration, price, active status

---

## 3. Availability

### 3.1 Weekly Schedule
- [ ] Navigate to `/availability`
- [ ] Active timezone name displayed with link to Profile
- [ ] Set different hours per day
- [ ] Save → persistence confirmed
- [ ] Unset days show as "Unavailable"

### 3.2 Blocked Times
- [ ] Add blocked time with date + start time + end time
- [ ] Card displays with date range and time range
- [ ] Red left border indicator on blocked-time cards
- [ ] Delete blocked time → confirmation modal → removed

### 3.3 Slot Computation
- [ ] Public booking page shows slots based on availability hours
- [ ] Slots respect blocked times (no slots during blocked period)
- [ ] Slots shown in 12-hour format (AM/PM)

---

## 4. Booking Flow

### 4.1 Public Booking Page
- [ ] Navigate to `/{username}/{event-slug}`
- [ ] Event details displayed (name, duration, price, description)
- [ ] Invitee timezone auto-detected

### 4.2 Calendar
- [ ] Click prev/next month arrows
- [ ] Past dates disabled (greyed out, not clickable)
- [ ] Today highlighted with accent border
- [ ] Selected date highlighted with accent fill

### 4.3 Time Slots
- [ ] Select a date → available slots load (with skeleton loader)
- [ ] No slots → "No available slots" message
- [ ] Select a slot → highlighted
- [ ] 12-hour format with AM/PM

### 4.4 Calendar Collapse (new)
- [ ] Select a slot → calendar + slots collapse
- [ ] Summary card shows selected date and time
- [ ] "Change time" button is visible
- [ ] Click "Change time" → calendar + slots re-appear

### 4.5 Booking Form
- [ ] Form shows name, email, timezone, notes fields
- [ ] Custom questions render correctly (text input / select)
- [ ] Required fields validated
- [ ] Timezone dropdown shows all timezones

### 4.6 Submit Booking
- [ ] Free event → "Confirm booking" button
- [ ] Paid event → "Proceed to payment · ₹X" button
- [ ] Submit with valid data → loading state
- [ ] Successful booking → confirmation page
- [ ] Duplicate booking attempt → error handled

### 4.7 Payment (Razorpay)
- [ ] Razorpay checkout modal opens for paid events
- [ ] Amount shown in INR paise (×100)
- [ ] Successful payment → booking confirmed
- [ ] Failed/cancelled payment → booking not created
- [ ] Payment status endpoint works (no auth required)

---

## 5. Dashboard

- [ ] Navigate to `/dashboard`
- [ ] Upcoming bookings listed with time, invitee, status
- [ ] Past bookings listed
- [ ] Status filter (active / cancelled / completed) works
- [ ] Times displayed in user's timezone (not UTC)
- [ ] Revenue shown (for paid events)
- [ ] Empty state → onboarding banner with dismiss
- [ ] Dismiss onboarding → persists in localStorage (not shown again)

---

## 6. Profile / Settings

### 6.1 Profile
- [ ] Navigate to `/profile`
- [ ] Update name, email, phone, timezone
- [ ] Timezone field auto-detects browser timezone
- [ ] If timezone is `'UTC'`, shown as unset with browser hint
- [ ] Save → changes persist

### 6.2 Settings
- [ ] Navigate to `/settings`
- [ ] Password change form works
- [ ] Webhook URL field
- [ ] Google Calendar connect button

### 6.3 Google Calendar
- [ ] Click "Connect Google Calendar"
- [ ] Redirected to Google OAuth consent
- [ ] After consent, shows "Connected" status

---

## 7. Bookings Management

- [ ] View booking details
- [ ] Host can cancel booking → confirm modal → cancelled
- [ ] Booked time slot freed up after cancellation
- [ ] Reschedule via reschedule token link works
- [ ] Reschedule page shows date/time picker

---

## 8. Email Notifications

- [ ] Booking confirmation email sent (HTML branded)
- [ ] Booking cancelled email sent
- [ ] Booking rescheduled email sent
- [ ] Password reset email sent (HTML, not plain text)
- [ ] Email branding consistent (logo, colors, alternating rows)

---

## 9. Timezone Handling

- [ ] Register defaults to browser timezone
- [ ] Login auto-fixes `'UTC'` to browser timezone
- [ ] Booking page shows times in invitee's timezone
- [ ] Dashboard shows times in user's timezone
- [ ] Availability page shows active timezone
- [ ] Profile timezone field shows browser hint
- [ ] All times in 12-hour AM/PM format

---

## 10. Admin Panel

### 10.1 Dashboard
- [ ] `/adkrish` shows stats (users, bookings, revenue)
- [ ] Charts render correctly
- [ ] Eye toggle on password field works

### 10.2 Users
- [ ] Search by email/username
- [ ] Filter by active/inactive status
- [ ] Filter by staff/non-staff
- [ ] Pagination works
- [ ] View user details modal
- [ ] Create user via `POST /api/adkrish/users/` (admin creates accounts with email_verified=True)

### 10.3 Event Types
- [ ] Search by name or host
- [ ] Filter by active/inactive
- [ ] Pagination works

### 10.4 Bookings
- [ ] Search by invitee name/email
- [ ] Filter by booking status
- [ ] Filter by payment status
- [ ] Pagination works

### 10.5 Settings (Admin)
- [ ] Two-factor authentication toggle

---

## 11. Responsive / Mobile

### 11.1 Breakpoint 767px
- [ ] All pages render without horizontal scroll
- [ ] Booking page calendar stacks vertically (not 2-column grid)
- [ ] Navbar collapses/hamburger menu
- [ ] Forms full-width

### 11.2 Breakpoint 480px
- [ ] Text not cut off
- [ ] Buttons touch-target sized (≥44px)
- [ ] Cards full-width with adequate padding

---

## 12. Dark Mode

- [ ] Toggle in navbar works
- [ ] All pages render correctly in dark mode
- [ ] Text contrast meets accessibility
- [ ] Input fields visible (borders, backgrounds)
- [ ] Date/time picker icons visible (white calendar/clock)
- [ ] Select dropdown arrows visible

---

## 13. Error Pages

- [ ] `/nonexistent-page` → custom 404 page (not blank)
- [ ] Server error → custom 500 page (not stack trace)
- [ ] `robots.txt` accessible at `/robots.txt`
- [ ] `calyy-production.up.railway.app/admin/` returns 404 (Django admin hidden)
- [ ] Response headers include `X-Content-Type-Options: nosniff`
- [ ] Response headers include `Strict-Transport-Security` (when HSTS enabled)

---

## 14. SEO

- [ ] Each page has proper `<title>`
- [ ] Meta description tags present
- [ ] Open Graph tags (og:title, og:description, og:image)
- [ ] Twitter Card tags

---

## 15. Static Pages

- [ ] `/privacy` — Privacy Policy renders
- [ ] `/terms` — Terms of Service renders
- [ ] Pricing page shows Standard ₹499/mo, Teams ₹5,999/mo (Upcoming badge)
- [ ] Free CTA button is blue

---

## 16. Edge Cases

- [ ] Rapid double-click on "Confirm booking" → no duplicate
- [ ] Register 6+ times in an hour → throttled (429, scope `register: 5/h`)
- [ ] Login 11+ times in an hour → throttled (scope `login: 10/h`)
- [ ] Admin login 11+ times in an hour → throttled (`@ratelimit 10/h`)
- [ ] JWT token expired → redirect to login (not infinite loop)
- [ ] Network error during booking → user-friendly message
- [ ] Payment window closed → booking page handles gracefully
- [ ] Host deletes event type → existing bookings unaffected
- [ ] Very long event type name → truncated/scrolls appropriately

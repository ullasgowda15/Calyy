from celery import shared_task
from django.conf import settings
import logging
import resend
import requests

from .email_templates import HTML_WRAP, detail_rows, detail_table

logger = logging.getLogger(__name__)
resend.api_key = settings.RESEND_API_KEY


@shared_task(autoretry_for=(Exception,), max_retries=3, retry_backoff=True, retry_backoff_max=300, retry_jitter=True)
def send_booking_confirmation(booking_id: str):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        logger.warning(f'Booking {booking_id} not found for confirmation email')
        return

    host = booking.event_type.host
    host_name = host.get_full_name() or host.username
    dt = booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')

    invitee_rows = detail_rows([
        ('Event', booking.event_type.name),
        ('With', host_name),
        ('When', f'{dt} UTC'),
        ('Duration', f'{booking.event_type.duration} min'),
        ('Location', booking.event_type.location_type.upper()),
    ])
    invitee_body = f'''<p style="margin:0 0 20px">Hi <strong>{booking.invitee_name}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;color:#1a1a2e;font-weight:600">Your meeting has been confirmed!</p>
{detail_table(invitee_rows)}
<p style="margin:0;font-size:13px;color:#999">Need to cancel?
<a href="{settings.BASE_URL}/api/bookings/{booking.id}/cancel/?token={booking.cancel_token}" style="color:#7C3AED;text-decoration:none;font-weight:600">Cancel here</a></p>'''
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [booking.invitee_email],
            'subject': f'Booking confirmed: {booking.event_type.name}',
            'html': HTML_WRAP.replace('{body}', invitee_body),
        })
    except Exception as e:
        logger.error(f'Failed to send invitee confirmation email: {e}')
        raise

    host_rows = detail_rows([
        ('From', f'{booking.invitee_name} ({booking.invitee_email})'),
        ('Event', booking.event_type.name),
        ('When', f'{dt} UTC'),
        ('Notes', booking.notes or 'None'),
    ])
    host_body = f'''<p style="margin:0 0 20px">Hi {host_name},</p>
<p style="margin:0 0 20px;font-size:16px;color:#1a1a2e;font-weight:600">New booking received!</p>
{detail_table(host_rows)}'''
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [host.email],
            'subject': f'New booking: {booking.invitee_name}',
            'html': HTML_WRAP.replace('{body}', host_body),
        })
    except Exception as e:
        logger.error(f'Failed to send host confirmation email: {e}')
        raise


@shared_task(autoretry_for=(Exception,), max_retries=3, retry_backoff=True, retry_backoff_max=300, retry_jitter=True)
def send_booking_reminder(booking_id: str, hours_before: int = 24):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        return

    if booking.status != 'confirmed':
        return

    dt = booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')
    rows = detail_rows([
        ('Event', booking.event_type.name),
        ('When', f'{dt} UTC'),
        ('Location', booking.event_type.location_type.upper()),
    ])
    body = f'''<p style="margin:0 0 20px">Hi <strong>{booking.invitee_name}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;color:#1a1a2e;font-weight:600">Reminder: your meeting is coming up!</p>
{detail_table(rows)}'''
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [booking.invitee_email],
            'subject': f'Reminder: {booking.event_type.name} in {hours_before} hour{"s" if hours_before != 1 else ""}',
            'html': HTML_WRAP.replace('{body}', body),
        })
    except Exception as e:
        logger.error(f'Failed to send reminder email: {e}')
        raise


@shared_task(autoretry_for=(Exception,), max_retries=3, retry_backoff=True, retry_backoff_max=300, retry_jitter=True)
def send_cancellation_email(booking_id: str, reason: str = ''):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        return

    dt = booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')
    items = [
        ('Event', booking.event_type.name),
        ('Original time', f'{dt} UTC'),
    ]
    if reason:
        items.append(('Reason', reason))
    rows = detail_rows(items)
    body = f'''<p style="margin:0 0 20px">Hi <strong>{booking.invitee_name}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;color:#dc2626;font-weight:600">Your booking has been cancelled.</p>
{detail_table(rows)}
<p style="margin:0;font-size:13px;color:#999">To book a new time:
<a href="{settings.BASE_URL}/book/{booking.event_type.host.username}/{booking.event_type.slug}/" style="color:#7C3AED;text-decoration:none;font-weight:600">Schedule a meeting</a></p>'''
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [booking.invitee_email],
            'subject': f'Cancelled: {booking.event_type.name}',
            'html': HTML_WRAP.replace('{body}', body),
        })
    except Exception as e:
        logger.error(f'Failed to send cancellation email: {e}')
        raise


@shared_task(autoretry_for=(Exception,), max_retries=3, retry_backoff=True, retry_backoff_max=300, retry_jitter=True)
def send_no_show_email(booking_id: str):
    from .models import Booking
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        return

    host = booking.event_type.host
    host_name = host.get_full_name() or host.username
    dt = booking.start_datetime.strftime('%A, %B %d %Y at %I:%M %p')
    rows = detail_rows([
        ('Event', booking.event_type.name),
        ('With', host_name),
        ('Scheduled', f'{dt} UTC'),
    ])
    body = f'''<p style="margin:0 0 20px">Hi <strong>{booking.invitee_name}</strong>,</p>
<p style="margin:0 0 20px;font-size:16px;color:#dc2626;font-weight:600">Marked as no-show</p>
{detail_table(rows)}
<p style="margin:0 0 4px;font-size:13px;color:#999">If you believe this is an error, please contact the host directly.</p>
<p style="margin:0;font-size:13px;color:#999">To reschedule:
<a href="{settings.BASE_URL}/book/{booking.event_type.host.username}/{booking.event_type.slug}/" style="color:#7C3AED;text-decoration:none;font-weight:600">Book a new time</a></p>'''
    try:
        resend.Emails.send({
            'from': settings.DEFAULT_FROM_EMAIL,
            'to': [booking.invitee_email],
            'subject': f'Missed meeting: {booking.event_type.name}',
            'html': HTML_WRAP.replace('{body}', body),
        })
    except Exception as e:
        logger.error(f'Failed to send no-show email: {e}')
        raise


@shared_task(autoretry_for=(Exception,), max_retries=3, retry_backoff=True, retry_backoff_max=300, retry_jitter=True)
def sync_google_calendar_event(booking_id: str):
    from .models import Booking
    from integrations.google_calendar import create_calendar_event
    try:
        booking = Booking.objects.select_related('event_type__host').get(id=booking_id)
    except Booking.DoesNotExist:
        return
    host = booking.event_type.host
    if not hasattr(host, 'google_token'):
        return
    gc_event_id = create_calendar_event(host.google_token, booking)
    if gc_event_id:
        booking.google_calendar_event_id = gc_event_id
        booking.save(update_fields=['google_calendar_event_id'])


@shared_task(autoretry_for=(Exception,), max_retries=3, retry_backoff=True, retry_backoff_max=300, retry_jitter=True)
def delete_google_calendar_event(host_id: str, event_id: str):
    from integrations.models import GoogleCalendarToken
    from integrations.google_calendar import delete_calendar_event
    try:
        token = GoogleCalendarToken.objects.get(user_id=host_id)
    except GoogleCalendarToken.DoesNotExist:
        return
    try:
        delete_calendar_event(token, event_id)
    except Exception as e:
        logger.error(f'Failed to delete calendar event {event_id}: {e}')
        raise


@shared_task(autoretry_for=(requests.RequestException,), max_retries=3, retry_backoff=True, retry_backoff_max=300, retry_jitter=True)
def deliver_webhook_task(user_id: str, event: str, payload: dict):
    from integrations.models import WebhookSubscription
    subscriptions = WebhookSubscription.objects.filter(user_id=user_id, event=event, is_active=True)
    for sub in subscriptions:
        try:
            requests.post(sub.url, json=payload, timeout=5)
        except requests.RequestException as e:
            logger.error(f'Webhook delivery failed to {sub.url}: {e}')
            raise


@shared_task
def expire_subscriptions():
    from django.utils import timezone
    from datetime import timedelta
    from accounts.models import User

    now = timezone.now()
    expired = User.objects.filter(
        subscription_status='active',
        subscribed_until__lt=now,
    )
    count_active = expired.count()
    if count_active:
        expired.update(subscription_status='expired')

    expired_trials = User.objects.filter(
        subscription_status='free_trial',
        trial_started_at__lt=now - timedelta(days=7),
    )
    count_trial = expired_trials.count()
    if count_trial:
        expired_trials.update(subscription_status='expired')

    total = count_active + count_trial
    if total:
        logger.info(f'Expired {total} subscription(s) ({count_active} active, {count_trial} trial)')
    return total


@shared_task
def release_expired_pending_bookings():
    from django.utils import timezone
    from .models import Booking

    now = timezone.now()
    expired = Booking.objects.filter(
        status='pending',
        pending_until__isnull=False,
        pending_until__lt=now,
    )

    count = expired.count()
    if count:
        expired.update(status='cancelled', pending_until=None)
        logger.info(f'Released {count} expired pending booking(s)')
    return count
